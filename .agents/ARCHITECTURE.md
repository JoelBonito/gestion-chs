# Inove AI Framework - Architecture

> Multi-agent AI development framework with 22 agents, 42 skills, 25 workflows, and multi-platform support.

---

## 1. Overview

Inove AI Framework is a modular system that enhances AI coding assistants with:

- **22 Specialist Agents** -- Role-based AI personas for different domains
- **42 Skills** -- Domain-specific knowledge modules loaded on demand
- **25 Workflows** -- Slash command procedures for structured processes
- **22 Scripts** -- Python/Bash automation for task tracking, sessions, and validation
- **Multi-Platform Support** -- Claude Code, Codex CLI, and Antigravity/Gemini

The canonical source of truth lives in `.agents/`. Other platforms access it through symlinks.

---

## 2. Directory Structure

```
.agents/
├── ARCHITECTURE.md              # This file
├── INSTRUCTIONS.md              # Canonical instructions (synced to CLAUDE.md, AGENTS.md)
├── agents/                      # 22 specialist agents
│   ├── orchestrator.md
│   ├── project-planner.md
│   ├── product-manager.md
│   ├── product-owner.md
│   ├── frontend-specialist.md
│   ├── backend-specialist.md
│   ├── database-architect.md
│   ├── mobile-developer.md
│   ├── security-auditor.md
│   ├── penetration-tester.md
│   ├── debugger.md
│   ├── devops-engineer.md
│   ├── test-engineer.md
│   ├── qa-automation-engineer.md
│   ├── documentation-writer.md
│   ├── code-archaeologist.md
│   ├── performance-optimizer.md
│   ├── seo-specialist.md
│   ├── game-developer.md
│   ├── ux-researcher.md
│   └── explorer-agent.md
├── skills/                      # 41 skill modules
│   ├── api-patterns/
│   ├── app-builder/
│   │   └── templates/           # 13 project templates
│   ├── architecture/
│   ├── ...                      # (see Skills section below)
│   └── webapp-testing/
├── workflows/                   # 22 slash command workflows
│   ├── brainstorm.md
│   ├── context.md
│   ├── ...                      # (see Workflows section below)
│   └── ui-ux-pro-max.md
├── scripts/                     # 22 automation scripts
│   ├── auto_finish.py
│   ├── dashboard.py
│   ├── ...                      # (see Scripts section below)
│   └── verify_all.py
├── config/                      # Platform-specific configuration
│   ├── codex.toml
│   └── mcp.json
├── rules/                       # Global rules
│   └── GEMINI.md
└── .shared/                     # Shared data resources
    └── ui-ux-pro-max/
        ├── data/                # 13 CSV datasets + 12 stack CSVs
        └── scripts/             # Python scripts (core, design_system, search)
```

---

## 3. Agents (21)

Each agent is a Markdown file in `.agents/agents/` defining a persona, rules, and skill dependencies.

| Agent | Focus | Skills |
| ----- | ----- | ------ |
| `orchestrator` | Multi-agent coordination | parallel-agents, behavioral-modes, plan-writing, brainstorming, architecture, lint-and-validate, powershell-windows, bash-linux |
| `project-planner` | Discovery, architecture, task planning | app-builder, plan-writing, brainstorming, architecture, system-design, gap-analysis |
| `product-manager` | Requirements, user stories | plan-writing, brainstorming |
| `product-owner` | Strategy, backlog, MVP, GAP analysis | plan-writing, brainstorming, gap-analysis, doc-review |
| `frontend-specialist` | Web UI/UX, React, Next.js | nextjs-react-expert, web-design-guidelines, tailwind-patterns, frontend-design, lint-and-validate, gap-analysis |
| `backend-specialist` | APIs, Node.js, Python, business logic | nodejs-best-practices, python-patterns, api-patterns, database-design, mcp-builder, lint-and-validate, powershell-windows, bash-linux |
| `database-architect` | Schema design, queries, migrations | database-design |
| `mobile-developer` | iOS, Android, React Native | mobile-design |
| `security-auditor` | Security compliance, OWASP | vulnerability-scanner, red-team-tactics, api-patterns, gap-analysis |
| `penetration-tester` | Offensive security testing | vulnerability-scanner, red-team-tactics, api-patterns |
| `debugger` | Root cause analysis | systematic-debugging |
| `devops-engineer` | CI/CD, Docker, infrastructure | deployment-procedures, server-management, powershell-windows, bash-linux |
| `test-engineer` | Testing strategies | testing-patterns, tdd-workflow, webapp-testing, code-review-checklist, lint-and-validate |
| `qa-automation-engineer` | E2E testing, CI pipelines | webapp-testing, testing-patterns, lint-and-validate |
| `documentation-writer` | Manuals, technical docs | documentation-templates |
| `code-archaeologist` | Legacy code, refactoring | code-review-checklist |
| `performance-optimizer` | Speed, Web Vitals | performance-profiling |
| `seo-specialist` | SEO, visibility, GEO | seo-fundamentals, geo-fundamentals |
| `game-developer` | Game logic, mechanics | game-development |
| `ux-researcher` | UX research, user flows, wireframes | ux-research, frontend-design, stitch-ui-design, gap-analysis |
| `explorer-agent` | Codebase analysis, discovery | architecture, plan-writing, brainstorming, systematic-debugging |

> **Note:** All agents implicitly load `clean-code` as a Tier 0 (mandatory) skill.

---

## 4. Skills (41)

Skills are modular knowledge domains in `.agents/skills/`. Each contains at minimum a `SKILL.md` file, and optionally `scripts/` and `references/` subdirectories.

### Frontend and UI

| Skill | Description |
| ----- | ----------- |
| `nextjs-react-expert` | Next.js/React performance patterns and optimization rules |
| `tailwind-patterns` | Tailwind CSS utility patterns and best practices |
| `frontend-design` | UI/UX patterns, design systems, color/typography systems |
| `web-design-guidelines` | UI audit against Web Interface Guidelines |
| `stitch-ui-design` | Stitch MCP integration for generating high-fidelity UI designs from textual wireframes |

### Backend and API

| Skill | Description |
| ----- | ----------- |
| `api-patterns` | REST, GraphQL, tRPC design patterns and documentation |
| `nodejs-best-practices` | Node.js async patterns, modules, error handling |
| `python-patterns` | Python standards, FastAPI, idiomatic patterns |

### Database

| Skill | Description |
| ----- | ----------- |
| `database-design` | Schema design, indexing, migrations, ORM selection, optimization |

### Architecture and Planning

| Skill | Description |
| ----- | ----------- |
| `app-builder` | Full-stack app scaffolding with 13 project templates |
| `architecture` | System design patterns, trade-off analysis, context discovery |
| `system-design` | Large-scale system design patterns |
| `plan-writing` | Task planning and breakdown |
| `brainstorming` | Socratic questioning and dynamic exploration |
| `gap-analysis` | Identify gaps in product, UX, infrastructure, security, and tech |

### Testing and Quality

| Skill | Description |
| ----- | ----------- |
| `testing-patterns` | Jest, Vitest, testing strategies |
| `webapp-testing` | E2E testing with Playwright |
| `tdd-workflow` | Test-driven development methodology |
| `code-review-checklist` | Code review standards and checklists |
| `lint-and-validate` | Linting, type coverage, validation scripts |

### Security

| Skill | Description |
| ----- | ----------- |
| `vulnerability-scanner` | Security auditing, OWASP checklists |
| `red-team-tactics` | Offensive security techniques |

### Mobile

| Skill | Description |
| ----- | ----------- |
| `mobile-design` | Mobile UI/UX, platform-specific patterns (iOS/Android), debugging |

### Game Development

| Skill | Description |
| ----- | ----------- |
| `game-development` | 2D/3D games, multiplayer, VR/AR, game design, audio |

### SEO and Growth

| Skill | Description |
| ----- | ----------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals optimization |
| `geo-fundamentals` | Generative Engine Optimization (GEO) |

### UX Research

| Skill | Description |
| ----- | ----------- |
| `ux-research` | UX research methodology, user flows, usability testing |

### DevOps and Infrastructure

| Skill | Description |
| ----- | ----------- |
| `deployment-procedures` | CI/CD workflows, deploy procedures |
| `server-management` | Infrastructure management, monitoring |

### Shell and CLI

| Skill | Description |
| ----- | ----------- |
| `bash-linux` | Linux commands, shell scripting |
| `powershell-windows` | Windows PowerShell scripting |

### Performance

| Skill | Description |
| ----- | ----------- |
| `performance-profiling` | Web Vitals, Lighthouse audits, profiling |

### Documentation

| Skill | Description |
| ----- | ----------- |
| `documentation-templates` | README, API docs, ADR, changelog templates |
| `doc-review` | Document review and validation |

### Internationalization

| Skill | Description |
| ----- | ----------- |
| `i18n-localization` | Internationalization patterns and i18n checking |

### Agent Behavior and Coordination

| Skill | Description |
| ----- | ----------- |
| `behavioral-modes` | Agent persona modes and behavioral configuration |
| `parallel-agents` | Multi-agent coordination patterns |
| `intelligent-routing` | Request routing to appropriate agents |

### Cross-Cutting

| Skill | Description |
| ----- | ----------- |
| `clean-code` | Pragmatic coding standards (mandatory Tier 0 for all agents) |
| `systematic-debugging` | Root cause analysis, troubleshooting methodology |
| `mcp-builder` | Model Context Protocol server/tool building |

### App Builder Templates (13)

The `app-builder` skill includes a `templates/` subdirectory with scaffolding for:

| Template | Stack |
| -------- | ----- |
| `astro-static` | Astro static site |
| `chrome-extension` | Chrome browser extension |
| `cli-tool` | Command-line tool |
| `electron-desktop` | Electron desktop app |
| `express-api` | Express.js REST API |
| `flutter-app` | Flutter cross-platform app |
| `monorepo-turborepo` | Turborepo monorepo setup |
| `nextjs-fullstack` | Next.js full-stack app |
| `nextjs-saas` | Next.js SaaS starter |
| `nextjs-static` | Next.js static site |
| `nuxt-app` | Nuxt.js application |
| `python-fastapi` | Python FastAPI backend |
| `react-native-app` | React Native mobile app |

---

## 5. Workflows (22)

Slash command procedures in `.agents/workflows/`. Invoke with `/command`.

| Command | Description |
| ------- | ----------- |
| `/define` | Full project planning in 9 phases with GAP Analysis |
| `/journeys` | Document user journeys and flows |
| `/context` | Create project context and technical conventions |
| `/readiness` | Validate readiness for implementation |
| `/brainstorm` | Socratic exploration and ideation |
| `/create` | Create new features with guided implementation |
| `/debug` | Systematic debugging workflow |
| `/enhance` | Improve and refactor existing code |
| `/deploy` | Application deployment procedure |
| `/test` | Generate and run tests |
| `/plan` | Task breakdown and planning |
| `/orchestrate` | Multi-agent coordination |
| `/preview` | Preview changes before applying |
| `/track` | Update task progress |
| `/status` | Consolidated project dashboard |
| `/log` | Record session activity |
| `/finish` | Mark tasks as complete |
| `/review` | Post-sprint code review and quality checks |
| `/test-book` | Generate or update testing notebook artifacts |
| `/release` | Final release workflow for MVP or production |
| `/ui-ux-pro-max` | Design system workflow with styles, palettes, and fonts |
| `/squad` | Manage squads: reusable packages of agents, skills, and workflows |

---

## 6. Scripts (22)

Automation scripts in `.agents/scripts/` for task management, validation, and session tracking.

### Task and Progress Management

| Script | Description |
| ------ | ----------- |
| `finish_task.py` | Mark a backlog task as complete |
| `auto_finish.py` | Automated task completion protocol |
| `progress_tracker.py` | Update and display progress bar |
| `checklist.py` | Priority-based validation (security, lint, types, tests, UX, SEO) |
| `shard_epic.py` | Split backlog into individual story files (shard/sync/status/clean) |

### Session Management

| Script | Description |
| ------ | ----------- |
| `auto_session.py` | Start/stop session tracking |
| `session_logger.py` | Log session activity |
| `project_analyzer.py` | Analyze project state and tech stack |

### Dashboard and Metrics

| Script | Description |
| ------ | ----------- |
| `dashboard.py` | Consolidated project dashboard view |
| `metrics.py` | Generate insights and metrics |

### Multi-Agent Coordination

| Script | Description |
| ------ | ----------- |
| `lock_manager.py` | File lock management for multi-agent work |
| `sync_tracker.py` | Synchronization tracking between agents |
| `platform_compat.py` | Auto-detect active AI platform (claude_code, codex, unknown) |

### Validation

| Script | Description |
| ------ | ----------- |
| `verify_all.py` | Comprehensive pre-deployment verification (all checks) |
| `validate_installation.py` | Verify framework installation and setup |
| `validate_traceability.py` | Validate backlog-to-code traceability |
| `_check_runner.py` | Shared check runner utilities for verification scripts |

### Notifications and Previews

| Script | Description |
| ------ | ----------- |
| `notifier.py` | Send notifications on task events |
| `reminder_system.py` | Scheduled reminders for pending tasks |
| `auto_preview.py` | Automated preview generation |
| `generate_web_data.py` | Generate JSON data artifacts for web docs/dashboard |

### Squads and Recovery

| Script | Description |
| ------ | ----------- |
| `squad_manager.py` | Create, validate, activate, deactivate, and export squads |
| `recovery.py` | Retry with exponential backoff, safe execution with rollback, git checkpoints |

### Git Hooks

| Script | Description |
| ------ | ----------- |
| `install_git_hooks.sh` | Install pre-commit and post-commit hooks |

---

## 7. Multi-Platform Support

Inove AI Framework runs on three AI platforms simultaneously. The canonical source is `.agents/`, and each platform accesses it through symlinks or direct references.

### Platform Configuration

| Platform | Instruction File | Agents Path | Skills Path | Workflows Path |
| -------- | ---------------- | ----------- | ----------- | -------------- |
| Claude Code | `CLAUDE.md` | `.claude/agents/` -> `.agents/agents/` | `.claude/skills/` -> `.agents/skills/` | `.agents/workflows/` (direct) |
| Codex CLI | `AGENTS.md` | `.codex/agents/` -> `.agents/agents/` | `.codex/skills/` -> `.agents/skills/` | `.codex/prompts/` -> `.agents/workflows/` |
| Antigravity/Gemini | `GEMINI.md` | `.agents/agents/` (direct) | `.agents/skills/` (direct) | `.agents/workflows/` (direct) |

### Symlink Map

```
.claude/
├── agents  -> ../.agents/agents     (symlink)
├── skills  -> ../.agents/skills     (symlink)
├── project_instructions.md
├── settings.json
└── settings.local.json

.codex/
├── agents  -> ../.agents/agents     (symlink)
├── skills  -> ../.agents/skills     (symlink)
├── prompts -> ../.agents/workflows  (symlink)
└── config.toml
```

### Platform Detection

Scripts auto-detect the active platform:

```python
from platform_compat import get_agent_source
source = get_agent_source()  # Returns 'claude_code', 'codex', or 'unknown'
```

Environment variable override:

```bash
export AGENT_SOURCE=claude_code   # For Claude Code
export AGENT_SOURCE=codex         # For Codex CLI
export AGENT_SOURCE=antigravity   # For Antigravity/Gemini
```

### Platform-Specific Config

| File | Platform | Purpose |
| ---- | -------- | ------- |
| `.agents/config/codex.toml` | Codex CLI | Codex-specific configuration |
| `.agents/config/mcp.json` | All | Model Context Protocol server configuration |
| `.agents/rules/GEMINI.md` | Antigravity/Gemini | Gemini-specific rules and instructions |

---

## 8. Shared Resources

### UI/UX Pro Max Data (`.agents/.shared/ui-ux-pro-max/`)

A curated dataset of design system references used by the `/ui-ux-pro-max` workflow.

#### Data CSVs (`.shared/ui-ux-pro-max/data/`)

| File | Content |
| ---- | ------- |
| `styles.csv` | Design style references |
| `colors.csv` | Color palettes |
| `typography.csv` | Font pairings |
| `icons.csv` | Icon sets |
| `charts.csv` | Chart/data visualization patterns |
| `landing.csv` | Landing page patterns |
| `products.csv` | Product page patterns |
| `prompts.csv` | AI prompt templates for design |
| `react-performance.csv` | React performance rules |
| `ui-reasoning.csv` | UI decision reasoning data |
| `ux-guidelines.csv` | UX guideline references |
| `web-interface.csv` | Web interface patterns |

#### Stack-Specific Data (`.shared/ui-ux-pro-max/data/stacks/`)

Framework-specific implementation patterns:

| File | Framework |
| ---- | --------- |
| `react.csv` | React |
| `nextjs.csv` | Next.js |
| `vue.csv` | Vue.js |
| `nuxtjs.csv` | Nuxt.js |
| `nuxt-ui.csv` | Nuxt UI |
| `svelte.csv` | Svelte |
| `flutter.csv` | Flutter |
| `react-native.csv` | React Native |
| `swiftui.csv` | SwiftUI |
| `jetpack-compose.csv` | Jetpack Compose |
| `shadcn.csv` | shadcn/ui |
| `html-tailwind.csv` | HTML + Tailwind CSS |

#### Python Scripts (`.shared/ui-ux-pro-max/scripts/`)

| Script | Purpose |
| ------ | ------- |
| `core.py` | Core utilities for data loading and processing |
| `design_system.py` | Design system generation from CSV data |
| `search.py` | Search across design data |

---

## 9. Squad System

Squads are reusable packages of agents + skills + workflows for specific domains.

### Structure

```
squads/
├── README.md                    # Documentation
├── .templates/                  # Templates for creation
│   ├── basic/                   # Minimal template
│   └── specialist/              # Full template with skills + workflows
└── <name>/                      # User-created squads
    ├── squad.yaml               # Required manifest
    ├── agents/                  # Squad agents
    ├── skills/                  # Squad skills
    ├── workflows/               # Squad workflows
    └── config/                  # Optional configuration
```

### Activation

When a squad is activated via `squad_manager.py activate <name>`, symlinks are created:
- `.agents/agents/<agent>.md` -> `../../squads/<name>/agents/<agent>.md`
- `.agents/skills/<skill>/` -> `../../squads/<name>/skills/<skill>/`
- `.agents/workflows/<wf>.md` -> `../../squads/<name>/workflows/<wf>.md`

This makes squad components visible to the framework without code changes.

### Recovery System

The `recovery.py` module provides resilience utilities:
- `with_retry(fn, max_attempts=3, backoff=2)` — Retry with exponential backoff
- `safe_execute(command, rollback_fn=None)` — Execute with rollback on failure
- `git_checkpoint(label)` / `git_rollback(label)` — Git stash checkpoints

Used by: `checklist.py`, `auto_preview.py`, `finish_task.py`

---

## Skill Loading Protocol

```
User Request
    |
    v
Detect Domain -> Match Agent -> Read agent .md frontmatter
                                    |
                                    v
                              Load skill SKILL.md files
                                    |
                                    v
                              Load scripts/ (if present)
                                    |
                                    v
                              Apply agent persona + rules
```

### Skill File Structure

```
skill-name/
├── SKILL.md           # Required: Metadata, instructions, rules
├── scripts/           # Optional: Python/Bash validation scripts
├── references/        # Optional: Templates, supplementary docs
└── *.md               # Optional: Additional topic-specific docs
```

---

## Statistics

| Metric | Count |
| ------ | ----- |
| Agents | 21 (core) + N (squads) |
| Skills | 41 (core) + N (squads) |
| Workflows | 22 |
| Scripts | 22 |
| App Templates | 13 |
| Shared Data CSVs | 13 (general) + 12 (stack-specific) |
| Supported Platforms | 3 (Claude Code, Codex CLI, Antigravity/Gemini) |
