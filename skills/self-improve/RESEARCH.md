# Self-Improve Plugin — Research (Task 0.1)

Date: 2026-05-13
Sources:
- https://code.claude.com/docs/en/plugins (Create plugins)
- https://code.claude.com/docs/en/plugins-reference (Plugins reference — full schema)
- https://code.claude.com/docs/en/hooks (Hooks reference)
- https://code.claude.com/docs/en/skills (Skills in Claude Code)
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview (Agent Skills overview)
- Installed plugins on this machine:
  - `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/`
  - `~/.claude/plugins/cache/claude-plugins-official/code-review/unknown/`
  - `~/.claude/plugins/cache/claude-plugins-official/commit-commands/unknown/`
  - `~/.claude/plugins/cache/claude-plugins-official/security-guidance/unknown/`
  - `~/.claude/plugins/cache/copilotkit-internal-plugins/copilotkit-internal/2.8.0/`
  - `~/.claude/plugins/cache/superpowers-marketplace/episodic-memory/1.0.15/`

## TL;DR — Plan corrections needed (READ THIS FIRST)

The plan at `F:/projects/tanstack/ai/.claude/plans/2026-05-13-self-improve-plugin-plan.md` lines 107–133 contains a `plugin.json` example that does NOT match the actual Claude Code schema. Specific corrections required before Task 1.2:

1. **`hooks` cannot be inlined the way the plan shows.** The plan writes hooks directly in `plugin.json` with a flat `{"command": "..."}` shape. The real schema requires either:
   - A separate `hooks/hooks.json` file (auto-discovered, recommended), OR
   - An inline `hooks` field in `plugin.json` whose value matches the full hook-config shape: `{ "EventName": [{ "matcher": "...", "hooks": [{ "type": "command", "command": "..." }] }] }`.
   The flat `{"command": ...}` form the plan shows is invalid — every hook entry needs `type: "command"` wrapped in a matcher group.

2. **`commands` should NOT be declared as objects with `{name, file}`.** The plan declares commands as `[{ "name": "learn", "file": "commands/learn.md" }]`. The real schema is: commands are **auto-discovered** from the `commands/` directory by filename. The `commands` field in `plugin.json` is optional and accepts **string or array of relative paths** (e.g. `"./custom/cmd.md"` or `["./commands/foo.md"]`), NOT objects with `name`/`file`. Setting `commands` in `plugin.json` **replaces** the default `commands/` directory scan. The recommended approach is to omit `commands` entirely and let auto-discovery handle it.

3. **`skills` should NOT be declared as objects with `{name, path}`.** Same story: skills are auto-discovered from the `skills/` directory where each skill is a folder `skills/<name>/SKILL.md`. The `skills` field in `plugin.json` is optional and accepts **string or array of directory paths**, NOT objects. Unlike `commands`, the `skills` field **adds to** the default rather than replacing it. The recommended approach is to omit `skills` and just put the skill folder at `skills/self-improve/SKILL.md`.

4. **`${pluginDir}` is the wrong variable name.** The plan uses `${pluginDir}` in hook command paths. The correct variable is **`${CLAUDE_PLUGIN_ROOT}`**.

5. **`author` should be an object, not a string.** The plan writes `"author": "Alem Tuzlak"`. The schema requires an object: `{ "name": "...", "email": "...", "url": "..." }`. (String form is not documented and would likely fail validation.)

6. **The hook output JSON shape in Task 3.1 is CORRECT.** The plan's assumed format `{ "hookSpecificOutput": { "hookEventName": "UserPromptSubmit", "additionalContext": "..." } }` matches what the docs require and what installed plugins like `superpowers/session-start` actually emit.

---

## 1. Plugin manifest (`.claude-plugin/plugin.json`) — confirmed schema

### Location and discoverability
- Manifest file lives at `<plugin-root>/.claude-plugin/plugin.json`.
- The `.claude-plugin/` directory holds ONLY `plugin.json`. All other directories (`skills/`, `commands/`, `hooks/`, `agents/`) must be at the plugin root.
- The manifest is **optional**. If omitted, Claude Code auto-discovers components in default locations and derives the plugin name from the directory name. Most plugins observed only set metadata (`name`, `description`, `version`, `author`) and rely on convention directories.

### Required field
- `name` — string, kebab-case, no spaces. Becomes the namespace prefix for commands/skills (`/<plugin-name>:<skill-name>`).

### Optional metadata fields
| Field | Type | Notes |
|---|---|---|
| `$schema` | string | `"https://json.schemastore.org/claude-code-plugin-manifest.json"` for editor autocomplete. Ignored at load time. |
| `version` | string | Semantic version. If set, users only receive updates when bumped. If omitted and source is git, every commit is a new version. |
| `description` | string | Shown in plugin manager. |
| `author` | object | `{ "name": "...", "email": "...", "url": "..." }` |
| `homepage` | string | Docs URL |
| `repository` | string | Source URL |
| `license` | string | SPDX identifier |
| `keywords` | array of strings | Discovery tags |

### Component path fields (all optional — defaults work via directory convention)
| Field | Type | Behavior |
|---|---|---|
| `skills` | string \| string[] | Custom skill directories (each contains `<name>/SKILL.md`). **Adds to** default `skills/` scan. |
| `commands` | string \| string[] | Custom flat `.md` skill files or directories. **Replaces** default `commands/` scan. |
| `agents` | string \| string[] | Custom agent files. Replaces default `agents/`. |
| `hooks` | string \| string[] \| object | Path(s) to hook JSON config(s), or inline hooks object. Default `hooks/hooks.json`. |
| `mcpServers` | string \| string[] \| object | Path(s) to MCP config(s) or inline. Default `.mcp.json`. |
| `outputStyles` | string \| string[] | Replaces default `output-styles/`. |
| `lspServers` | string \| string[] \| object | Default `.lsp.json`. |
| `experimental.themes` | string \| string[] | Replaces default `themes/`. |
| `experimental.monitors` | string \| string[] | Replaces default `monitors/monitors.json`. |
| `userConfig` | object | User-prompted config values at enable time. |
| `channels` | array | Message-injection channels bound to MCP servers. |
| `dependencies` | array | Other plugins this requires, with optional semver. |

All path values must start with `./` and be relative to plugin root.

### Recommended `plugin.json` for self-improve

Minimal — rely on convention:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "self-improve",
  "version": "0.1.0",
  "description": "Self-improving agent: captures lessons from corrections, enforces architectural couplings, and absorbs learnings back into your skills.",
  "author": {
    "name": "Alem Tuzlak"
  },
  "homepage": "https://github.com/AlemTuzlak/skills",
  "repository": "https://github.com/AlemTuzlak/skills",
  "license": "MIT",
  "keywords": ["self-improve", "lessons", "couplings", "skills"]
}
```

With this minimal manifest:
- Commands placed at `commands/learn.md`, `commands/couple.md`, etc. are auto-discovered.
- Skill at `skills/self-improve/SKILL.md` is auto-discovered.
- Hooks defined in `hooks/hooks.json` are auto-discovered.

No need to enumerate components in the manifest at all.

---

## 2. Hook configuration — `hooks/hooks.json`

### File location
Default: `<plugin-root>/hooks/hooks.json` (auto-discovered).

### Schema (top level)
```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<regex-or-empty>",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/hooks/user-prompt-submit.sh",
            "timeout": 60,
            "async": false
          }
        ]
      }
    ]
  }
}
```

Notes from observed plugins:
- The outer `{ "hooks": { ... } }` wrapper is the canonical form (superpowers, security-guidance, episodic-memory all use it).
- One installed plugin (`copilotkit-internal/2.8.0/hooks/hooks.json`) omits the outer `hooks` key and writes the event object directly. Both forms are tolerated by Claude Code in practice, but the wrapped form matches the documented `settings.json` `hooks` field exactly and is safer.
- Each event has a list of matcher groups; each matcher group has its own `hooks` array of action entries.
- `matcher` is a regex against either tool names (for `PreToolUse`/`PostToolUse`) or event subtypes (e.g. `"startup|clear|compact"` for `SessionStart`). For `UserPromptSubmit` use empty string `""` to match all.
- `type` must be one of `command`, `http`, `mcp_tool`, `prompt`, `agent`. For shell scripts use `command`.

### Hook event names (exact, case-sensitive)

From the official docs:

```
SessionStart, Setup, UserPromptSubmit, UserPromptExpansion,
PreToolUse, PermissionRequest, PermissionDenied, PostToolUse,
PostToolUseFailure, PostToolBatch, Notification,
SubagentStart, SubagentStop, TaskCreated, TaskCompleted,
Stop, StopFailure, TeammateIdle, InstructionsLoaded,
ConfigChange, CwdChanged, FileChanged,
WorktreeCreate, WorktreeRemove, PreCompact, PostCompact,
Elicitation, ElicitationResult, SessionEnd
```

The plan's chosen event `UserPromptSubmit` is correct (camelCase, capitalised exactly as shown).

### Hook script execution
- The script receives the hook event payload as JSON on stdin.
- The plugin root is exposed as the env var `CLAUDE_PLUGIN_ROOT` (also substitutable inline in the `command` string).
- Other available env vars in commands: `CLAUDE_PLUGIN_DATA` (persistent state dir), `CLAUDE_PROJECT_DIR` (project root).
- Exit code 0 = success; the stdout JSON is parsed. Exit code 2 = block (input/JSON output is ignored).

### Recommended `hooks/hooks.json` for self-improve
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/user-prompt-submit.sh\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

---

## 3. Hook stdout JSON shape for `additionalContext` injection

**CONFIRMED — the plan's assumption is correct.** The exact format Claude Code reads is:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<string injected into next model turn>"
  }
}
```

Requirements:
- Exit code 0 (exit 2 ignores JSON output).
- The JSON object must be the ONLY content on stdout (no leading/trailing text).
- `hookEventName` must match the firing event name EXACTLY (`"UserPromptSubmit"`, not `"userPromptSubmit"`).
- `additionalContext` is a plain string. Soft cap: 10,000 characters; over that, Claude Code saves the full text to a file and shows the model a preview.
- For `UserPromptSubmit` and `SessionStart`, plain text stdout (without JSON wrapper) is also accepted as additional context. The JSON form is preferred for forward compatibility.

Events that support `additionalContext` injection (per docs):
`SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`.

Confirmed in the wild: see `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/hooks/session-start` which emits:

```bash
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
```

This is the exact pattern the self-improve hook should use.

---

## 4. Slash command frontmatter fields (and skill frontmatter — same surface)

In Claude Code, custom commands have been merged into skills. A file at `commands/foo.md` and a skill at `skills/foo/SKILL.md` are equivalent. The Claude Code docs document the frontmatter once and call it the "frontmatter reference" for both.

Supported frontmatter fields (all optional; only `description` is recommended):

| Field | Type | Purpose |
|---|---|---|
| `name` | string | Display name. Defaults to directory/filename. Lowercase + digits + hyphens, max 64 chars. |
| `description` | string | What it does and when to use it. Recommended. Soft cap 1,536 chars (combined with `when_to_use`). |
| `when_to_use` | string | Extra trigger phrases. Appended to `description` in the listing. |
| `argument-hint` | string | Autocomplete hint, e.g. `[issue-number]`. |
| `arguments` | string \| array | Named positional args, used as `$name` substitutions. |
| `disable-model-invocation` | bool | If `true`, only the user can invoke (Claude won't auto-load). |
| `user-invocable` | bool | If `false`, hidden from `/` menu (Claude-only). Default `true`. |
| `allowed-tools` | string \| array | Tools pre-approved while skill is active. |
| `model` | string | Override model for the turn. |
| `effort` | string | `low`/`medium`/`high`/`xhigh`/`max`. |
| `context` | string | `fork` to run in a forked subagent context. |
| `agent` | string | Subagent type to use when `context: fork`. |
| `hooks` | object | Hooks scoped to this skill's lifecycle. |
| `paths` | string \| array | Glob patterns that limit when this skill auto-activates. |
| `shell` | string | `bash` (default) or `powershell`. |

Existing installed example (`commit-commands/commands/commit.md`):
```yaml
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---
```

Existing installed example (`code-review/commands/code-review.md`):
```yaml
---
allowed-tools: Bash(gh issue view:*), Bash(gh search:*), ...
description: Code review a pull request
disable-model-invocation: false
---
```

**For self-improve commands:** every command file should have at minimum:
```yaml
---
description: <user-facing trigger phrase>
---
```
And for commands that should NOT auto-trigger (like `/learn`, `/promote`), add `disable-model-invocation: true`.

### Bash injection in skill content
The `` !`<command>` `` syntax in skill body content runs shell commands before the skill content is sent to Claude. `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N` substitute user-passed args. `${CLAUDE_SKILL_DIR}` resolves to the skill directory regardless of install scope (use this when referencing bundled scripts).

---

## 5. Skill manifest (`SKILL.md`)

Skills are folders: `skills/<skill-name>/SKILL.md` (+ optional supporting files like `references/`, `scripts/`, etc.).

The YAML frontmatter at the top of `SKILL.md` uses the same field set documented in section 4 above (Claude Code unified commands and skills). The Agent Skills open-standard subset (used outside Claude Code too) recognises:

- `name` — max 64 chars, lowercase + digits + hyphens. Cannot contain "anthropic" or "claude".
- `description` — required, max 1024 chars in the open standard (1,536 char soft cap in Claude Code listing).

Plus all the Claude Code extensions listed in section 4.

Recommended `skills/self-improve/SKILL.md` frontmatter:
```yaml
---
name: self-improve
description: Use when curating lessons, promoting clusters to skills, or improving an existing skill from accumulated lessons.
disable-model-invocation: true
---
```

---

## 6. Plugin installation & discovery mechanism

### How plugins get loaded
1. **Marketplace install:** `claude plugin install <plugin>@<marketplace>` copies the plugin into `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` and adds it to `enabledPlugins` in the appropriate settings file:
   - `--scope user` (default) → `~/.claude/settings.json`
   - `--scope project` → `.claude/settings.json` (commits with the repo)
   - `--scope local` → `.claude/settings.local.json` (gitignored)
   - `--scope managed` → managed settings (read-only)
2. **Dev/test:** `claude --plugin-dir ./path/to/plugin` loads a plugin from a local directory for the current session only. Useful for iteration. Accepts `.zip` archives too (v2.1.128+).
3. **Remote dev:** `claude --plugin-url https://.../plugin.zip` fetches an archive at startup.

### Marketplace registration
A "marketplace" is a directory containing `.claude-plugin/marketplace.json` listing plugins:

```json
{
  "name": "alem-skills",
  "description": "Personal skills marketplace",
  "owner": { "name": "Alem Tuzlak" },
  "plugins": [
    {
      "name": "self-improve",
      "description": "...",
      "version": "0.1.0",
      "source": "./skills/self-improve",
      "author": { "name": "Alem Tuzlak" }
    }
  ]
}
```

The `source` is a path (relative to marketplace root) to the plugin directory. The marketplace itself is added via `/plugin marketplace add <url-or-path>`.

### Caching behavior
- All marketplace-installed plugins live in `~/.claude/plugins/cache/`. The path traversal limitation means installed plugins cannot reference files outside their copied directory (the cache copy is isolated for security).
- Hooks reference paths via `${CLAUDE_PLUGIN_ROOT}` so they keep working after the cache directory hash changes.
- `${CLAUDE_PLUGIN_DATA}` resolves to `~/.claude/plugins/data/{id}/` and is the persistent state directory across plugin updates.

### Practical implication for self-improve
Since this plugin is meant to live in `F:/projects/skills/skills/self-improve/` (the user's "skills" monorepo), the distribution model is:
- Develop in `F:/projects/skills/skills/self-improve/` with the structure documented above.
- For local testing: `claude --plugin-dir F:/projects/skills/skills/self-improve`.
- For installation: the parent dir `F:/projects/skills/` should have a `.claude-plugin/marketplace.json` listing this plugin; user runs `/plugin marketplace add F:/projects/skills` then `/plugin install self-improve@<marketplace-name>`.
- The plan's "mirror at `~/.claude/plugins/self-improve/`" is not how Claude Code expects plugins to be installed — the cache path is `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`. If the user wants direct filesystem editing without marketplace install, `--plugin-dir` is the supported path.

### Directory layout — recommended for self-improve
```
F:/projects/skills/skills/self-improve/
├── .claude-plugin/
│   └── plugin.json
├── commands/                       # auto-discovered slash commands
│   ├── self-improve-init.md
│   ├── learn.md
│   ├── couple.md
│   ├── check-couplings.md
│   ├── curate-lessons.md
│   ├── curate.md
│   ├── promote.md
│   ├── promote-cluster.md
│   ├── promote-skill.md
│   └── improve-skill.md
├── skills/
│   └── self-improve/               # auto-discovered skill
│       ├── SKILL.md
│       └── references/             # supporting files (optional)
├── hooks/
│   ├── hooks.json
│   └── user-prompt-submit.sh
├── templates/                      # not a Claude Code convention — purely internal
│   ├── lesson.md.tmpl
│   ├── INDEX.md.tmpl
│   ├── coupling.json.tmpl
│   └── coupling.schema.json
├── scripts/                        # helper scripts referenced from hooks/commands
│   └── ...
├── README.md
└── LICENSE
```

---

## Divergences from the plan — actionable checklist

These must be addressed in the plan before Task 1.2:

| Item | Plan says | Actual | Action |
|---|---|---|---|
| Hook declaration | Inline `"hooks": { "UserPromptSubmit": [{ "command": "..." }] }` in `plugin.json` with flat `command` entries | Either separate `hooks/hooks.json` OR inline with full `{matcher, hooks:[{type, command, ...}]}` shape | Use separate `hooks/hooks.json` (default location, idiomatic). Remove `hooks` from `plugin.json`. |
| Commands declaration | Array of `{name, file}` objects | Auto-discovered from `commands/` directory; OR string \| string[] of paths in `plugin.json` | Omit `commands` field from `plugin.json`; rely on auto-discovery. |
| Skills declaration | `[{ "name": "self-improve", "path": "skill/self-improve" }]` | Auto-discovered from `skills/` directory (note plural `skills`, not `skill`); OR string \| string[] of paths | Omit `skills` field; place skill at `skills/self-improve/SKILL.md`. |
| Path variable in hook commands | `${pluginDir}` | `${CLAUDE_PLUGIN_ROOT}` | Replace `${pluginDir}` → `${CLAUDE_PLUGIN_ROOT}` everywhere. |
| `author` field | String `"Alem Tuzlak"` | Object `{ "name": "..." }` | Use object form. |
| Hook output shape | `{ "hookSpecificOutput": { "hookEventName": "UserPromptSubmit", "additionalContext": "..." } }` | Identical | **NO CHANGE — assumption is correct.** |
| Plugin install path | `~/.claude/plugins/self-improve/` | `~/.claude/plugins/cache/<marketplace>/self-improve/<version>/` | Update Task 6+ (marketplace publishing) and any references to install location. Use `--plugin-dir` for dev. |
| `disable-model-invocation` for commands | Not mentioned | Available; default `false` | Add `disable-model-invocation: true` to action commands (`/learn`, `/promote`, etc.) so Claude doesn't auto-invoke them. |

The plan's Task 0.1 note explicitly says "adapt schema per Task 0.1 findings" so this divergence is expected and acceptable — but the fixes need to land in Task 1.2 before any code references the manifest.

## Open questions / things not verified
- Whether `disable-model-invocation` and `user-invocable` are both honoured for files in `commands/` (flat-file form) the same as in `skills/<name>/SKILL.md`. Docs say "commands and skills work the same way" — assumed yes.
- Whether `experimental.monitors` would be useful for the curation nag. Probably overkill; `UserPromptSubmit` hook is simpler.
- The "git `pre-push` hook" mentioned in the spec is a git-side hook (not a Claude Code hook). It runs from `.git/hooks/pre-push` or a `lefthook`/`husky` setup, not from Claude Code. This is fine — just note that Claude Code's `PreToolUse` is a different concept and not relevant for git push enforcement.
