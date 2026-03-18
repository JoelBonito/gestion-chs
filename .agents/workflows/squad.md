---
description: Manage squads - reusable packages of agents, skills, and workflows for specific domains.
---

# Workflow: /squad

> **Purpose:** Create, manage, and activate squads - reusable packages of agents + skills + workflows for specific domains.

## Commands

```
/squad create <name>                    # Interactive creation with Socratic Gate
/squad create <name> --from-docs <path> # Auto-generate from PRD/Brief
/squad list                             # List all squads
/squad activate <name>                  # Activate in framework
/squad deactivate <name>                # Deactivate
/squad validate <name>                  # Validate integrity
```

---

## Flow: /squad create

### Step 1: Socratic Discovery

Before creating a squad, ask:

1. **What domain does this squad cover?** (e.g., social media, e-commerce, analytics)
2. **What agents are needed?** (lead agent + specialists)
3. **What domain knowledge (skills) should be included?**
4. **Are there workflows specific to this domain?**
5. **Which platforms should support this squad?** (Claude Code, Gemini, Codex)

### Step 2: Create Structure

```bash
python3 .agents/scripts/squad_manager.py create <name> --template specialist
```

### Step 3: Generate Components

Based on discovery answers:
1. Create agent files in `squads/<name>/agents/`
2. Create skill SKILL.md files in `squads/<name>/skills/`
3. Create workflow files in `squads/<name>/workflows/`
4. Update `squad.yaml` with all component references

### Step 4: Validate

```bash
python3 .agents/scripts/squad_manager.py validate <name>
```

### Step 5: Activate (Optional)

```bash
python3 .agents/scripts/squad_manager.py activate <name>
```

---

## Flow: /squad create --from-docs

When a PRD or Brief exists, auto-extract:
1. **Agents** from identified domains in the PRD
2. **Skills** from technical requirements
3. **Workflows** from process requirements

---

## Flow: /squad list

```bash
python3 .agents/scripts/squad_manager.py list
```

Shows: name, version, components count, active/inactive status.

---

## Flow: /squad activate

```bash
python3 .agents/scripts/squad_manager.py activate <name>
```

Creates symlinks from `.agents/` to squad components. Activated squads are treated as native framework components.

---

## Flow: /squad deactivate

```bash
python3 .agents/scripts/squad_manager.py deactivate <name>
```

Removes symlinks. Squad files remain in `squads/<name>/`.

---

## Flow: /squad validate

```bash
python3 .agents/scripts/squad_manager.py validate <name>
```

Checks:
- squad.yaml has required fields
- All declared agents have files with frontmatter
- All declared skills have SKILL.md
- All declared workflows have files
- Core skill dependencies exist in framework
