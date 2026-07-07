# gstack + Cursor (fleet-tracker)

This project can use [gstack](https://github.com/garrytan/gstack) — Garry Tan’s open-source skill pack for “think → plan → build → review → test → ship” workflows. gstack targets **Claude Code** first but documents support for any agent that follows the **SKILL.md** convention, including **Cursor**, via `.agents/skills/`.

## Prerequisites

gstack’s `setup` script **requires [Bun](https://bun.sh/)** (`bun install`, `bun run build`, Playwright checks). Install Bun, then continue.

Optional: **Node.js** is required on Windows for Playwright (Bun pipe bug); Linux/macOS typically use Bun for the browser check.

## Install gstack for this repo (recommended)

From the **repository root** (`fleet-tracker/`):

```bash
mkdir -p .agents/skills
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git .agents/skills/gstack
cd .agents/skills/gstack && ./setup --host codex
```

- **Repo-local:** Generated Codex-format skills are symlinked under `.agents/skills/` (e.g. `gstack-review`, `gstack-qa`). Cursor is expected to discover skills in `.agents/skills/` the same way as Codex/Gemini CLI (per [gstack README](https://github.com/garrytan/gstack)).
- **After clone:** If skills don’t appear, open Cursor **Settings → Agent / Skills** and confirm the workspace scans `.agents/skills/`. If only `~/.cursor/skills` is used, symlink or copy generated skill folders there, or ask Cursor support which paths apply to your version.

### Non-interactive setup (CI / no TTY)

The script defaults to **short skill names** when stdin isn’t a TTY. To avoid any name collision with other packs, use namespaced commands:

```bash
cd .agents/skills/gstack && ./setup --host codex --prefix
```

That uses `gstack-`-prefixed symlinks where applicable (see gstack’s `setup` script).

### Global install (all repos)

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack && ./setup --host codex
```

Skills land under `~/.codex/skills/` for Codex CLI; **Cursor may or may not** read that path — prefer the **repo-local** `.agents/skills/` flow for this project.

### Committing gstack for teammates

gstack’s upstream README suggests vendoring under `.claude/skills/` for Claude Code. For Cursor/Codex-style discovery, vendoring **`.agents/skills/gstack`** (and symlinks next to it) is the parallel. Remove `.git` inside the clone if you want a plain folder commit:

```bash
rm -rf .agents/skills/gstack/.git
```

Then commit `.agents/` as a team decision (large tree + `node_modules` after `bun install` — follow gstack’s own `.gitignore` or exclude `node_modules` per your policy).

## Conflicts with existing Cursor skills (this machine)

These live under **`~/.cursor/skills/`** and **`~/.cursor/skills-cursor/`** and coexist with gstack **by default** because gstack’s Codex skills are typically named under the **`gstack-*`** namespace (e.g. `gstack-review`), not generic top-level names like `review`.

| Your skill / tool | gstack overlap | Notes |
|-------------------|----------------|--------|
| **code-simplifier** | **`/review` (gstack)** | Both improve code quality. Use **gstack `/review`** for pre-merge / production-risk review; **code-simplifier** for readability and cleanup after edits. |
| **frontend-design** | **`/plan-design-review`**, **`/design-review`**, **`/design-consultation`** | Overlap on UI quality. Use **frontend-design** when implementing or polishing UI in Cursor; use gstack design skills when you want a **structured audit** or plan-phase design pass. |
| **plan-exit-review** (if installed) | **`/plan-ceo-review`**, **`/plan-eng-review`**, **`/autoplan`** | Same **phase** (plan before build), different playbooks. Pick **one pipeline per feature** to avoid duplicate or contradictory reviews. |
| **create-rule**, **create-skill**, **update-cursor-settings**, **shell**, **migrate-to-skills**, **create-subagent** | None by name | No skill name collision; keep using these for Cursor-specific setup. |
| **Playwright MCP** (this workspace) | **`/browse`**, **`/qa`** | gstack’s README tells **Claude Code** users to prefer **gstack `/browse`** and avoid **`mcp__claude-in-chrome__*`** — that does **not** apply to Cursor’s **Playwright MCP**. If both are available, **choose one browser automation path per task** to avoid duplicate sessions. |
| **Svelte MCP**, **GitHub MCP** | None | Safe to keep enabled alongside gstack. |

### `TODOS.md` and doc hygiene

gstack includes **`/document-release`** and conventions around **`TODOS.md`**. If you also use a personal **plan-exit-review** skill that mandates `TODOS.md` entries, align on **one format** so the file stays readable (single section per source, or merge rules in `AGENTS.md`).

## Suggested “when to use what” (fleet-tracker)

1. **Product / scope framing** → gstack **`/office-hours`** or **`/plan-ceo-review`**.
2. **Technical plan + tests** → gstack **`/plan-eng-review`** (or your **plan-exit-review** if you prefer that playbook only).
3. **UI implementation** → **`frontend-design`** skill while coding.
4. **Pre-ship code review** → gstack **`/review`**.
5. **Browser QA** → gstack **`/qa`** *or* Playwright MCP / manual — not both blindly in parallel.

## Upgrades

Inside `.agents/skills/gstack`:

```bash
git pull && ./setup --host codex
```

Or use gstack’s **`/gstack-upgrade`** skill after install.

## References

- [garrytan/gstack](https://github.com/garrytan/gstack) — README, install, skill table, `docs/skills.md`.
- Cursor: confirm **Agent Skills** discovery paths for your editor version if `.agents/skills/` is not picked up automatically.
