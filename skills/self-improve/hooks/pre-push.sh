#!/usr/bin/env bash
# pre-push.sh — git pre-push hook for the self-improve plugin.
#
# Installed by `/self-improve init` to `<repo>/.git/hooks/pre-push`.
#
# For each ref being pushed, computes the diff range, walks
# `.agent/self-learning/coupling.json`, and reports any triggered couplings
# whose impacted targets are missing from the diff.
#
# Behavior gated by `enforcement.pre_push_block` in
# `.agent/self-learning/config.yml`:
#   - true  → exit 1 if any FAIL exists (unless SKIP_COUPLING_CHECK=1)
#   - false → warn only, exit 0
#
# Override: `SKIP_COUPLING_CHECK=1 git push` bypasses blocking.
#
# Cross-platform: targets bash on Unix and git-bash on Windows.

set -uo pipefail

# --- Locate repo root ---
if ! ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  exit 0
fi

COUPLING_JSON="$ROOT/.agent/self-learning/coupling.json"
CONFIG_YML="$ROOT/.agent/self-learning/config.yml"

# --- Activation gate ---
if [ ! -s "$COUPLING_JSON" ]; then
  exit 0
fi

# jq is required for JSON parsing. If missing, exit silently (hook is additive).
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

# Quick check: is the couplings array non-empty?
coupling_count="$(jq -r '.couplings | length // 0' "$COUPLING_JSON" 2>/dev/null || echo 0)"
if [ "$coupling_count" -eq 0 ] 2>/dev/null; then
  exit 0
fi

# --- Read pre-push stdin: <local_ref> <local_sha> <remote_ref> <remote_sha> ---
# Collect all changed files across all refs being pushed.
zero_sha="0000000000000000000000000000000000000000"
all_changed_files=""

while read -r local_ref local_sha remote_ref remote_sha; do
  [ -z "${local_sha:-}" ] && continue
  # Deletion (local_sha is zeros) — nothing to check.
  if [ "$local_sha" = "$zero_sha" ]; then
    continue
  fi

  if [ "${remote_sha:-}" = "$zero_sha" ] || [ -z "${remote_sha:-}" ]; then
    # New branch — diff against the local HEAD's first commit (root commit).
    root_commit="$(git rev-list --max-parents=0 "$local_sha" 2>/dev/null | tail -n1)"
    if [ -n "$root_commit" ] && [ "$root_commit" != "$local_sha" ]; then
      range_files="$(git diff --name-only "$root_commit" "$local_sha" 2>/dev/null || true)"
    else
      # Single-commit history; list everything in the tree.
      range_files="$(git ls-tree -r --name-only "$local_sha" 2>/dev/null || true)"
    fi
  else
    range_files="$(git diff --name-only "$remote_sha" "$local_sha" 2>/dev/null || true)"
  fi

  if [ -n "$range_files" ]; then
    if [ -z "$all_changed_files" ]; then
      all_changed_files="$range_files"
    else
      all_changed_files="$all_changed_files"$'\n'"$range_files"
    fi
  fi
done

# Dedup changed files.
if [ -n "$all_changed_files" ]; then
  all_changed_files="$(printf '%s\n' "$all_changed_files" | sort -u | sed '/^$/d')"
fi

if [ -z "$all_changed_files" ]; then
  exit 0
fi

# --- Helper: does a regex compile in grep -E? ---
is_valid_regex() {
  printf '' | grep -qE "$1" 2>/dev/null
  # grep returns 1 on no-match (regex is valid). Returns 2 on invalid regex.
  [ $? -ne 2 ]
}

# --- Helper: does any line in $1 (changed files) match pattern $2 (regex first, glob fallback)? ---
# Returns 0 (success) on match, 1 on no match.
files_match_pattern() {
  local files="$1"
  local pattern="$2"

  # Try regex first.
  if is_valid_regex "$pattern"; then
    if printf '%s\n' "$files" | grep -qE "$pattern" 2>/dev/null; then
      return 0
    fi
  fi

  # Glob fallback (case sensitive). Iterate per line.
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    # shellcheck disable=SC2254
    case "$f" in
      $pattern) return 0 ;;
    esac
    # Also check substring containment for simple path triggers.
    case "$f" in
      *"$pattern"*) return 0 ;;
    esac
  done <<< "$files"

  return 1
}

# --- Helper: is any changed file under target $1 (string)? ---
file_under_target() {
  local files="$1"
  local target="$2"

  # Strip trailing slash for cleaner prefix match.
  local clean_target="${target%/}"

  # Try regex match.
  if is_valid_regex "$target"; then
    if printf '%s\n' "$files" | grep -qE "$target" 2>/dev/null; then
      return 0
    fi
  fi

  # Glob / prefix match.
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      $target) return 0 ;;
      "$clean_target"/*) return 0 ;;
      "$clean_target") return 0 ;;
    esac
  done <<< "$files"

  return 1
}

# --- Walk couplings ---
pass_lines=""
fail_lines=""
any_fail=0

n="$(jq -r '.couplings | length' "$COUPLING_JSON")"
i=0
while [ "$i" -lt "$n" ]; do
  id="$(jq -r ".couplings[$i].id" "$COUPLING_JSON")"
  trigger="$(jq -r ".couplings[$i].trigger" "$COUPLING_JSON")"

  if files_match_pattern "$all_changed_files" "$trigger"; then
    # Triggered. Walk impacts.
    impact_count="$(jq -r ".couplings[$i].impacts | length" "$COUPLING_JSON")"
    j=0
    coupling_missing=""
    while [ "$j" -lt "$impact_count" ]; do
      target_type="$(jq -r ".couplings[$i].impacts[$j].target | type" "$COUPLING_JSON")"
      kind="$(jq -r ".couplings[$i].impacts[$j].kind" "$COUPLING_JSON")"
      why="$(jq -r ".couplings[$i].impacts[$j].why" "$COUPLING_JSON")"

      # Build target list.
      if [ "$target_type" = "array" ]; then
        targets="$(jq -r ".couplings[$i].impacts[$j].target[]" "$COUPLING_JSON")"
      else
        targets="$(jq -r ".couplings[$i].impacts[$j].target" "$COUPLING_JSON")"
      fi

      # At least one target must match.
      matched=0
      while IFS= read -r t; do
        [ -z "$t" ] && continue
        if file_under_target "$all_changed_files" "$t"; then
          matched=1
          break
        fi
      done <<< "$targets"

      if [ "$matched" -eq 0 ]; then
        # Render target display: comma-joined if array.
        target_display="$(printf '%s' "$targets" | paste -sd',' - 2>/dev/null || printf '%s' "$targets" | tr '\n' ',' | sed 's/,$//')"
        coupling_missing="$coupling_missing"$'\n'"  - MISSING [$kind]: $target_display ($why)"
      fi
      j=$((j + 1))
    done

    if [ -z "$coupling_missing" ]; then
      pass_lines="$pass_lines"$'\n'"  ✓ $id (trigger: $trigger)"
    else
      fail_lines="$fail_lines"$'\n'"  ✗ $id (trigger: $trigger)$coupling_missing"
      any_fail=1
    fi
  fi
  i=$((i + 1))
done

# --- If no triggered couplings, exit silently ---
if [ -z "$pass_lines" ] && [ -z "$fail_lines" ]; then
  exit 0
fi

# --- Render report to stderr ---
{
  printf '\n[self-improve] Coupling check on push:\n'
  if [ -n "$pass_lines" ]; then
    printf '\nPASS:%s\n' "$pass_lines"
  fi
  if [ -n "$fail_lines" ]; then
    printf '\nFAIL:%s\n' "$fail_lines"
  fi
} >&2

# --- Decide on blocking ---
pre_push_block="true"
if [ -f "$CONFIG_YML" ]; then
  v="$(grep -E '^[[:space:]]*pre_push_block:[[:space:]]*' "$CONFIG_YML" | head -n1 | sed -E 's/^[[:space:]]*pre_push_block:[[:space:]]*//; s/[[:space:]]+$//' | tr -d '\r')"
  case "$v" in
    true|false) pre_push_block="$v" ;;
  esac
fi

if [ "$any_fail" -eq 0 ]; then
  exit 0
fi

# Override?
if [ "${SKIP_COUPLING_CHECK:-}" = "1" ]; then
  printf '\n[self-improve] SKIP_COUPLING_CHECK=1 set — push proceeding despite failures.\n' >&2
  exit 0
fi

if [ "$pre_push_block" = "true" ]; then
  printf '\nPush blocked. Add missing artifacts or override with: SKIP_COUPLING_CHECK=1 git push\n' >&2
  exit 1
fi

printf '\nWarning: missing artifacts above. Push proceeding (pre_push_block=false).\n' >&2
exit 0
