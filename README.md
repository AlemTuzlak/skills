# Skills

Personal [agent skills](https://agentskills.io) I use across projects with Claude Code and other AI coding agents.

Each directory contains a `SKILL.md` file that can be invoked via the `Skill` tool or slash commands. Install them by cloning this repo into your `~/.claude/skills/` directory or symlinking individual skills.

## Available Skills

| Skill | Description |
|---|---|
| [architecture-impact](./architecture-impact) | Analyze a PR's architectural impact with before/after diagrams |
| [blog-post](./blog-post) | Write blog posts |
| [changelog](./changelog) | Generate changelogs |
| [marketing-brief](./marketing-brief) | Create marketing briefs |
| [marketing-pipeline](./marketing-pipeline) | End-to-end marketing content pipeline |
| [newsletter](./newsletter) | Write newsletter content |
| [social-copy](./social-copy) | Generate social media copy |
| [video-script](./video-script) | Write video scripts |

## Usage

```bash
# Clone into your skills directory
git clone git@github.com:AlemTuzlak/skills.git ~/.claude/skills

# Or symlink a single skill
ln -s /path/to/skills/architecture-impact ~/.claude/skills/architecture-impact
```

Then invoke via slash command (e.g. `/architecture-impact #3550`) or let the agent pick it up automatically based on the skill's trigger description.
