#!/usr/bin/env bash
# user-prompt-submit.sh — UserPromptSubmit hook for the self-improve plugin.
#
# Reads the hook event from stdin, runs a cheap regex pre-filter against the
# prompt, and emits a JSON object with `additionalContext` injected into the
# next model turn. Activation is gated on the existence of `.agent/self-learning/`
# in either the project repo or the user's home directory — if neither exists
# the hook exits silently with no output.
#
# Cross-platform: targets bash on Unix and git-bash on Windows.

set -uo pipefail

# Fail-loud helper used only for internal/unexpected errors. Hook contract:
# stdout must be empty (silent) on the activation-gate exit path, and JSON-only
# when injecting context. All diagnostics go to stderr.
die_silent() { exit 0; }

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
PROJECT_DIR_ENV="${CLAUDE_PROJECT_DIR:-}"

# Read the event payload from stdin.
if ! payload="$(cat)"; then
  die_silent
fi

# jq is required for parsing. If it's missing exit silently — the hook is
# additive and should never break the user's turn.
if ! command -v jq >/dev/null 2>&1; then
  die_silent
fi

# Extract prompt and cwd from the event. Fall back to env vars when fields
# are missing. `tr -d '\r'` defends against Windows CRLF.
prompt="$(printf '%s' "$payload" | jq -r '.prompt // ""' 2>/dev/null | tr -d '\r')"
cwd="$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null | tr -d '\r')"
if [ -z "$cwd" ]; then
  cwd="$PROJECT_DIR_ENV"
fi

# Activation gate: at least one of the two piles must exist.
REPO_PILE=""
GLOBAL_PILE=""
if [ -n "$cwd" ] && [ -d "$cwd/.agent/self-learning" ]; then
  REPO_PILE="$cwd/.agent/self-learning"
fi
if [ -n "${HOME:-}" ] && [ -d "$HOME/.agent/self-learning" ]; then
  GLOBAL_PILE="$HOME/.agent/self-learning"
fi
if [ -z "$REPO_PILE" ] && [ -z "$GLOBAL_PILE" ]; then
  die_silent
fi

# Load config (prefer repo, fall back to global). Read `regex_strictness`
# independently for each of `correction_detection:` and `coupling_detection:` —
# they nest separately in the YAML and may differ. Inline comments are
# stripped from the value so `regex_strictness: loose   # ...` parses cleanly.
correction_strictness="loose"
coupling_strictness="loose"

# Walks $1 line-by-line. Sets correction_strictness / coupling_strictness in
# the caller's scope (via stdout: two lines, "correction\tcoupling"). Returns
# 0 if the file existed and was parsed, 1 otherwise.
read_strictness_from() {
  local cfg="$1"
  [ -f "$cfg" ] || return 1
  local section="" corr="" coup=""
  while IFS= read -r line || [ -n "$line" ]; do
    # Detect leaving a section: any non-indented key starts a new section.
    if printf '%s' "$line" | grep -qE '^[A-Za-z_]'; then
      case "$line" in
        correction_detection:*) section="correction" ;;
        coupling_detection:*) section="coupling" ;;
        *) section="" ;;
      esac
      continue
    fi
    if [ -n "$section" ] && printf '%s' "$line" | grep -qE '^[[:space:]]+regex_strictness:[[:space:]]*'; then
      local val
      val="$(printf '%s' "$line" \
        | sed -E 's/^[[:space:]]+regex_strictness:[[:space:]]*//' \
        | sed -E 's/#.*$//' \
        | sed -E 's/[[:space:]]+$//' \
        | tr -d '\r')"
      case "$section" in
        correction) corr="$val" ;;
        coupling) coup="$val" ;;
      esac
    fi
  done < "$cfg"
  printf '%s\t%s' "$corr" "$coup"
  return 0
}
if [ -n "$REPO_PILE" ]; then
  IFS=$'\t' read -r repo_corr repo_coup <<< "$(read_strictness_from "$REPO_PILE/config.yml" || printf '\t')"
  [ -n "${repo_corr:-}" ] && correction_strictness="$repo_corr"
  [ -n "${repo_coup:-}" ] && coupling_strictness="$repo_coup"
fi
if [ -n "$GLOBAL_PILE" ]; then
  IFS=$'\t' read -r glo_corr glo_coup <<< "$(read_strictness_from "$GLOBAL_PILE/config.yml" || printf '\t')"
  # Only fall back to global when the repo didn't set it.
  if [ "$correction_strictness" = "loose" ] && [ -n "${glo_corr:-}" ]; then
    correction_strictness="$glo_corr"
  fi
  if [ "$coupling_strictness" = "loose" ] && [ -n "${glo_coup:-}" ]; then
    coupling_strictness="$glo_coup"
  fi
fi
case "$correction_strictness" in loose|strict) ;; *) correction_strictness="loose" ;; esac
case "$coupling_strictness" in loose|strict) ;; *) coupling_strictness="loose" ;; esac

# Stage 1 — regex pre-filter.
PATTERNS_FILE="${PLUGIN_ROOT}/lib/regex-patterns.json"
correction_hit=0
coupling_hit=0
if [ -f "$PATTERNS_FILE" ] && [ -n "$prompt" ]; then
  # Correction
  correction_patterns="$(jq -r --arg s "$correction_strictness" '.correction[$s][]?' "$PATTERNS_FILE" 2>/dev/null | tr -d '\r')"
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if printf '%s' "$prompt" | grep -qE "$p"; then
      correction_hit=1
      break
    fi
  done <<< "$correction_patterns"

  # Coupling
  coupling_patterns="$(jq -r --arg s "$coupling_strictness" '.coupling[$s][]?' "$PATTERNS_FILE" 2>/dev/null | tr -d '\r')"
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if printf '%s' "$prompt" | grep -qE "$p"; then
      coupling_hit=1
      break
    fi
  done <<< "$coupling_patterns"
fi

# Curation-state check.
today="$(date -u +%Y-%m-%d)"
repo_overdue=0
global_overdue=0
repo_last=""
repo_next=""
global_last=""
global_next=""
read_curation() {
  local cfg="$1"
  [ -f "$cfg" ] || return 1
  local last next
  last="$(grep -E '^\s*last_curated:\s*' "$cfg" | head -n1 | sed -E 's/^\s*last_curated:\s*//; s/[[:space:]]+$//' | tr -d '\r')"
  next="$(grep -E '^\s*next_nag:\s*' "$cfg" | head -n1 | sed -E 's/^\s*next_nag:\s*//; s/[[:space:]]+$//' | tr -d '\r')"
  printf '%s\t%s' "$last" "$next"
}
if [ -n "$REPO_PILE" ]; then
  IFS=$'\t' read -r repo_last repo_next <<< "$(read_curation "$REPO_PILE/curation-state.yml" || printf '\t')"
  if [ -n "$repo_next" ] && { [ "$today" \> "$repo_next" ] || [ "$today" = "$repo_next" ]; }; then
    repo_overdue=1
  fi
fi
if [ -n "$GLOBAL_PILE" ]; then
  IFS=$'\t' read -r global_last global_next <<< "$(read_curation "$GLOBAL_PILE/curation-state.yml" || printf '\t')"
  if [ -n "$global_next" ] && { [ "$today" \> "$global_next" ] || [ "$today" = "$global_next" ]; }; then
    global_overdue=1
  fi
fi

# Plan-time signal.
plan_signal=0
if [ -n "$prompt" ] && printf '%s' "$prompt" | grep -qiE '\b(write|writing|create|implement|plan|implementation plan)\b'; then
  plan_signal=1
fi

# Self-improve mention signal — explicit references to plugin concepts.
self_improve_signal=0
if [ -n "$prompt" ] && printf '%s' "$prompt" | grep -qiE '\b(lesson|coupling|curate|INDEX)\b'; then
  self_improve_signal=1
fi

# Curation-overdue is also a signal that justifies surfacing the INDEX.
curation_overdue=0
if [ "$repo_overdue" = "1" ] || [ "$global_overdue" = "1" ]; then
  curation_overdue=1
fi

# Progressive-disclosure gate: if no signal fired, exit silently. Injecting
# the INDEX on every neutral prompt would pollute context on unrelated turns.
any_signal=0
if [ "$correction_hit" = "1" ] || [ "$coupling_hit" = "1" ] || [ "$plan_signal" = "1" ] || [ "$curation_overdue" = "1" ] || [ "$self_improve_signal" = "1" ]; then
  any_signal=1
fi
if [ "$any_signal" -eq 0 ]; then
  die_silent
fi

# Compose additionalContext.
ctx=""
append_block() {
  if [ -z "$ctx" ]; then
    ctx="$1"
  else
    ctx="$ctx"$'\n\n'"$1"
  fi
}

# INDEX content (the routing layer). Only included when at least one signal
# fired — never on neutral prompts.
index_section="## Lessons routing index"$'\n'"The plugin tracks two lesson piles. Consult these for this turn — each entry is a routing condition."$'\n'
if [ -n "$REPO_PILE" ]; then
  index_section="$index_section"$'\n'"### Repo INDEX — $REPO_PILE/INDEX.md"$'\n\n'
  if [ -f "$REPO_PILE/INDEX.md" ]; then
    index_section="$index_section$(cat "$REPO_PILE/INDEX.md")"$'\n'
  else
    index_section="$index_section""(missing)"$'\n'
  fi
fi
if [ -n "$GLOBAL_PILE" ]; then
  index_section="$index_section"$'\n'"### Global INDEX — $GLOBAL_PILE/INDEX.md"$'\n\n'
  if [ -f "$GLOBAL_PILE/INDEX.md" ]; then
    index_section="$index_section$(cat "$GLOBAL_PILE/INDEX.md")"$'\n'
  else
    index_section="$index_section""(missing)"$'\n'
  fi
fi
append_block "$index_section"

# Correction stanza.
corr_stanza=""
if [ "$correction_hit" = "1" ]; then
  read -r -d '' corr_stanza <<'EOF' || true
## Correction detected
The user's last message matched correction signals. After completing their task:
1. Judge whether this was a correction worth capturing as a durable rule (not situational/one-off).
2. Inspect the turn's tool-use trace for any Skill invocations. If found, predict related_skill = <skill-name>.
3. Predict scope: repo-specific (mentions packages/paths/symbols of this repo) vs global (universal engineering rule).
4. Draft a one-line rule with Why and How-to-apply.
5. Append at end of your response: `📌 Saw you corrected me about [draft rule]. Capture as [predicted scope] lesson? `/learn yes` to capture, `/learn yes --[other-scope]` to flip scope, ignore to dismiss.`
If the correction was situational/one-off (not worth a durable rule), ignore.
EOF
  append_block "$corr_stanza"
fi

# Coupling stanza.
coup_stanza=""
if [ "$coupling_hit" = "1" ]; then
  read -r -d '' coup_stanza <<'EOF' || true
## Coupling assertion detected
The user's last message matched coupling-assertion signals. After completing their task:
1. Judge whether they described a durable architectural coupling worth a rule.
2. Draft a structured entry: { id (kebab-case), trigger (file/symbol/glob pattern), impacts: [{ target (path or path-array), kind: "change-required" | "new-code-required", why }] }
3. Append: `📌 Saw you describe a coupling — `/couple yes` to capture, ignore to dismiss.`
EOF
  append_block "$coup_stanza"
fi

# Curation nag stanza.
if [ "$repo_overdue" = "1" ] || [ "$global_overdue" = "1" ]; then
  nag="## Curation overdue"
  if [ "$repo_overdue" = "1" ]; then
    nag="$nag"$'\n'"- Repo lessons: last curated $repo_last, next nag was $repo_next"
  fi
  if [ "$global_overdue" = "1" ]; then
    nag="$nag"$'\n'"- Global lessons: last curated $global_last, next nag was $global_next"
  fi
  nag="$nag"$'\n'"Append at end of response: \`⏰ Lesson curation overdue. \`/curate-lessons\` to review, \`/curate snooze 30d\` to defer.\`"
  append_block "$nag"
fi

# Plan-time stanza.
if [ "$plan_signal" = "1" ] && [ -n "$REPO_PILE" ]; then
  plan="## Plan-time coupling check"$'\n'"This message looks like a planning request. Consult \`.agent/self-learning/coupling.json\` (at ${REPO_PILE}/coupling.json) before finalizing the plan. If the planned work matches any coupling's trigger, expand the plan to include all impacted targets explicitly as tasks."
  append_block "$plan"
fi

# Emit JSON. Use jq -Rs to safely escape the string.
escaped_ctx="$(printf '%s' "$ctx" | jq -Rs .)"
printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":%s}}\n' "$escaped_ctx"
exit 0
