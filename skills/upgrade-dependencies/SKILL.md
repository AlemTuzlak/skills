---
name: upgrade-dependencies
description: Use when upgrading a JS/TS dependency or toolchain to a new/latest version (e.g. "upgrade TypeScript to the latest", "bump Vite to v7", major-version bumps), or when a build/typecheck/lint/test/CI goes red after a version bump and peer-dependency incompatibilities need resolving.
---

# Upgrade Dependencies

Drive a dependency upgrade from "bump X to latest" all the way to green — without hacking around the errors it causes.

**Core principle: fix upward, never patch sideways.** When a bump breaks something, the fix is to upgrade the *thing that's incompatible* to a version that supports the target — not to suppress the error, downgrade the target, or add `// @ts-ignore`. If nothing upstream supports the target yet, that's a blocker you report, not a workaround you invent.

JS/TS ecosystems only (npm / pnpm / yarn / bun, including workspace monorepos and nx/turbo).

## The workflow

Work the phases in order. Scan the full impact (phase 2) before touching anything, and collect all breakage (phase 4) before fixing — otherwise you'll fix the same file three times and discover missed references halfway through.

### 1. Resolve the target version

- Absolute latest **stable** by default: `npm view <pkg> version` (dist-tag `latest`). Ignore existing semver ranges — the user asked to upgrade.
- Use a prerelease (`next`/`rc`/`canary`) **only** if the user asked for it, or if it's the only version that unblocks a phase-5 blocker (and say so).
- Detect the package manager from the lockfile: `pnpm-lock.yaml`→pnpm, `bun.lockb`→bun, `yarn.lock`→yarn, `package-lock.json`→npm. Never substitute a different runner.
- Detect monorepo layout: root `workspaces`, `pnpm-workspace.yaml`, `nx.json`, `turbo.json`.

### 2. Scan the impact (read-only — before touching anything)

Do NOT bump yet. First, in one read-only pass, build the **impact map**: everything the upgrade will touch. This map drives every later phase.

- **Every reference to bump.** Grep the package name across all `package.json` — root and every workspace, `dependencies`/`devDependencies`/`peerDependencies` alike. Don't assume it lives in one place.
- **Config/usage sites the version affects.** e.g. TypeScript → `tsconfig*.json` + everything compiled by `tsc`; Vite → `vite.config.*`; ESLint/Prettier → their config files. These are where a major bump's breaking changes land.
- **Checks that exercise it** — don't guess. Read root+workspace `package.json` `scripts` (build, typecheck/`tsc`, lint, test…), `.github/workflows/*.{yml,yaml}` (what CI actually runs), and `nx.json`/`turbo.json` task graphs. Produce a concrete check list; include only checks the dep can affect. A TypeScript bump touches typecheck + build + anything running `tsc`; a Vite bump touches build + dev + test (if vitest); a linter bump touches lint.
- **Third-party deps in the blast radius.** From the config/usage and peer requirements, note which other deps are likely to need their own upgrade to support the target (feeds phase 5).

Output of this phase: the list of files to bump, the check list to run, and the suspect deps — decided up front, not discovered mid-fix.

### 3. Bump everywhere

- Using the impact map, update **every** referencing `package.json` to the target version.
- Reinstall to regenerate the lockfile with the repo's package manager.

### 4. Collect ALL breakage first

Run every mapped check **once** and capture full output per check. Now you know the total damage before touching code. Record which checks are red and the leading errors of each.

If everything's green — done. Report and stop.

### 5. Triage failures — upstream first

For each failing **third-party** dependency (the thing whose incompatibility is causing the error, e.g. Vite failing under TS 7):

1. Look up whether a newer release supports the target. Sources: `npm view <dep> peerDependencies`, `npm view <dep> versions`, the package's GitHub releases/CHANGELOG, and open issues/PRs referencing the target version.
2. **Compatible release exists** → bump that dep too (rescan + rebump, phases 2–3, for it), then continue.
3. **No compatible release exists** → **STOP that thread and report it as a blocker.** Include the evidence: the dep's latest version, its peer range, and the tracking issue/PR link if there is one. Do **not** downgrade the target, pin around it, or suppress the error to make the check pass.

Failures that are just your own code needing updates for the new version go straight to phase 6.

### 6. Fix, one check at a time, parallelized

Fix real code — new API usage, updated types, migrated config — never suppressions.

- Dispatch **one worktree-isolated subagent per independent check** (a build agent, a typecheck agent, a lint agent, a test agent). Give each agent: the target bump, its single check's command, and that check's captured errors.
- Use worktrees so parallel agents don't collide on the same working tree (see `superpowers:using-git-worktrees` / your `blitz` skill).
- Serialize instead when checks share the same files or when there are only one or two — parallel worktrees aren't free.
- Each agent's exit bar: its check passes on real fixes.

### 7. Verify and report

- Merge the agents' branches, then re-run the **full** check set on the merged result. A fix that passed in isolation can fail once combined — loop phase 6/7 until the whole set is green.
- Final report:
  - **Bumped:** target + any upstream deps you moved, with versions.
  - **Fixed:** which checks were red and what the real fix was.
  - **Blocked:** any deps held at their current version because upstream doesn't support the target yet, with evidence. These are the only things left un-upgraded, and the user decides what to do with them.

## Quick reference

| Step | Command / action |
|------|------------------|
| Latest stable | `npm view <pkg> version` |
| All versions | `npm view <pkg> versions --json` |
| Peer requirements | `npm view <dep> peerDependencies` |
| Find every reference | grep the package name across all `package.json` |
| What CI runs | read `.github/workflows/*` |
| Reinstall | repo's package manager (lockfile decides) |

## Common mistakes

- **Bumping before scanning.** Editing `package.json` before the phase-2 impact pass means you find missed workspace references and affected configs mid-fix. Scan first, then bump.
- **Fixing before mapping.** Jumping into errors before phase 4 means re-fixing files as later checks surface more of the same. Collect all breakage first.
- **Patching sideways.** `@ts-ignore`, `eslint-disable`, downgrading the target, or pinning a dep to dodge the error. The failing dep's *upgrade* is the fix; absence of one is a blocker, not a license to suppress.
- **Bumping in one file.** Missing workspace `package.json`s leaves a split-version install that "works" until it doesn't. Update every reference.
- **Guessing the check list.** Running `test` when the dep only affects `build`, or missing a CI-only check. Read the scripts and workflows.
- **Parallelizing overlapping fixes.** Two agents editing the same config in separate worktrees produces merge conflicts and lost work. Serialize when fixes touch shared files.
- **Isolation-green ≠ merged-green.** Always re-run the full set after merging.
