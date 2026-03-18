# Squads - Inove AI Framework

> Squads are reusable packages of agents + skills + workflows for specific domains.

## Overview

A Squad is a self-contained module that groups related agents, skills, and workflows for a specific domain (e.g., social media management, e-commerce, etc.). Squads can be created, activated, deactivated, and shared.

## Structure

Each squad lives in `squads/<name>/` and must contain a `squad.yaml` manifest:

```
squads/<name>/
├── squad.yaml          # Required: Squad manifest
├── agents/             # Squad-specific agents
│   └── *.md
├── skills/             # Squad-specific skills
│   └── <skill-name>/
│       └── SKILL.md
├── workflows/          # Squad-specific workflows
│   └── *.md
└── config/             # Optional: Squad configuration
    └── *.yaml
```

## Commands

```bash
# Create a new squad from template
python .agents/scripts/squad_manager.py create <name> [--template basic|specialist]

# List all squads
python .agents/scripts/squad_manager.py list

# Validate squad integrity
python .agents/scripts/squad_manager.py validate <name>

# Activate squad (creates symlinks into .agents/)
python .agents/scripts/squad_manager.py activate <name>

# Deactivate squad (removes symlinks)
python .agents/scripts/squad_manager.py deactivate <name>

# Show squad details
python .agents/scripts/squad_manager.py info <name>

# Export squad as .tar.gz
python .agents/scripts/squad_manager.py export <name>
```

## Workflow

Use the `/squad` workflow for interactive squad management:

```
/squad create social-media        # Interactive creation with Socratic Gate
/squad list                       # List all squads
/squad activate social-media      # Activate in framework
/squad deactivate social-media    # Deactivate
/squad validate social-media      # Check integrity
```

## How Activation Works

When a squad is activated, symlinks are created from `.agents/` to the squad's components:

```
.agents/agents/social-strategist.md -> ../../squads/social-media/agents/social-strategist.md
.agents/skills/social-media-strategy/ -> ../../squads/social-media/skills/social-media-strategy/
.agents/workflows/social-pipeline.md -> ../../squads/social-media/workflows/social-pipeline.md
```

This allows activated squad components to be treated as native framework components without modifying any existing code.

## Templates

### basic
Minimal squad with a single lead agent. Use for simple, single-purpose squads.

### specialist
Full squad template with agents, skills, and workflows. Use for complex, multi-component squads.

## Creating Custom Squads

1. Run `python .agents/scripts/squad_manager.py create my-squad --template specialist`
2. Edit `squads/my-squad/squad.yaml` with your configuration
3. Add agents, skills, and workflows to the respective directories
4. Run `python .agents/scripts/squad_manager.py validate my-squad`
5. Run `python .agents/scripts/squad_manager.py activate my-squad`
