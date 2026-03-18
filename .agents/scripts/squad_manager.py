#!/usr/bin/env python3
"""
Squad Manager - Inove AI Framework
===================================
Manages squads: reusable packages of agents + skills + workflows.

Usage:
    python3 .agents/scripts/squad_manager.py create <name> [--template basic|specialist]
    python3 .agents/scripts/squad_manager.py list
    python3 .agents/scripts/squad_manager.py validate <name>
    python3 .agents/scripts/squad_manager.py activate <name>
    python3 .agents/scripts/squad_manager.py deactivate <name>
    python3 .agents/scripts/squad_manager.py repair <name> [--apply]
    python3 .agents/scripts/squad_manager.py info <name>
    python3 .agents/scripts/squad_manager.py export <name>
"""

import sys
import os
import shutil
import argparse
import tarfile
from pathlib import Path

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


# Paths
FRAMEWORK_ROOT = Path(__file__).resolve().parent.parent.parent
SQUADS_DIR = FRAMEWORK_ROOT / "squads"
TEMPLATES_DIR = SQUADS_DIR / ".templates"
AGENTS_DIR = FRAMEWORK_ROOT / ".agents"


def _parse_yaml(filepath: Path) -> dict:
    """Parse a YAML file. Falls back to basic parsing if PyYAML not installed."""
    text = filepath.read_text(encoding="utf-8")
    if HAS_YAML:
        return yaml.safe_load(text) or {}
    # Minimal YAML parser for squad.yaml (flat keys + simple lists)
    result = {}
    current_key = None
    current_list = None
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith("- "):
            if current_list is not None:
                current_list.append(stripped[2:].strip().strip('"').strip("'"))
            continue
        if ":" in stripped:
            key, _, val = stripped.partition(":")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if val:
                # Navigate nested keys
                indent = len(line) - len(line.lstrip())
                if indent == 0:
                    result[key] = val
                    current_key = key
                    current_list = None
                else:
                    if current_key and isinstance(result.get(current_key), dict):
                        result[current_key][key] = val
                    else:
                        result[key] = val
                    current_list = None
            else:
                indent = len(line) - len(line.lstrip())
                if indent == 0:
                    result[key] = {}
                    current_key = key
                    current_list = None
                else:
                    # This is a nested key that might contain a list
                    if current_key and isinstance(result.get(current_key), dict):
                        result[current_key][key] = []
                        current_list = result[current_key][key]
                    else:
                        result[key] = []
                        current_list = result[key]
    return result


def _get_squad_dir(name: str) -> Path:
    return SQUADS_DIR / name


def _get_manifest(name: str) -> dict:
    squad_dir = _get_squad_dir(name)
    manifest_path = squad_dir / "squad.yaml"
    if not manifest_path.exists():
        print(f"Error: squad.yaml not found in {squad_dir}")
        sys.exit(1)
    return _parse_yaml(manifest_path)


def _get_components(manifest: dict) -> dict:
    """Extract components from manifest."""
    components = manifest.get("components", {})
    if not isinstance(components, dict):
        components = {}
    return {
        "agents": components.get("agents", []) or [],
        "skills": components.get("skills", []) or [],
        "workflows": components.get("workflows", []) or [],
        "scripts": components.get("scripts", []) or [],
    }


def _check_symlink(link_path: Path, squad_dir: Path) -> str:
    """Check a single symlink status. Returns: 'ok', 'missing', 'drift', 'core'."""
    if not link_path.exists() and not link_path.is_symlink():
        return "missing"
    if link_path.is_symlink():
        try:
            target = link_path.resolve()
            if str(squad_dir.resolve()) in str(target):
                return "ok"
            else:
                return "drift"
        except OSError:
            return "drift"
    # Exists but is NOT a symlink = core file, not ours
    return "core"


def _compute_squad_status(squad_dir: Path, components: dict) -> dict:
    """Compute granular squad status by checking ALL components.

    Returns dict with:
        state: 'inactive' | 'partial' | 'active' | 'drift'
        total: int (expected symlinks, excluding core-blocked)
        linked: int (correctly linked)
        missing: list of missing component paths
        drifted: list of drifted component paths
        core_blocked: list of components blocked by core files
    """
    missing = []
    drifted = []
    core_blocked = []
    linked = 0
    total = 0

    checks = []
    for agent_name in components["agents"]:
        checks.append(("agents", agent_name, AGENTS_DIR / "agents" / f"{agent_name}.md"))
    for skill_name in components["skills"]:
        checks.append(("skills", skill_name, AGENTS_DIR / "skills" / skill_name))
    for wf_name in components["workflows"]:
        checks.append(("workflows", wf_name, AGENTS_DIR / "workflows" / f"{wf_name}.md"))

    for comp_type, comp_name, link_path in checks:
        status = _check_symlink(link_path, squad_dir)
        if status == "core":
            core_blocked.append(f"{comp_type}/{comp_name}")
            continue
        total += 1
        if status == "ok":
            linked += 1
        elif status == "missing":
            missing.append(f"{comp_type}/{comp_name}")
        elif status == "drift":
            drifted.append(f"{comp_type}/{comp_name}")

    if drifted:
        state = "drift"
    elif total == 0:
        state = "active" if core_blocked else "inactive"
    elif linked == total:
        state = "active"
    elif linked == 0:
        state = "inactive"
    else:
        state = "partial"

    return {
        "state": state,
        "total": total,
        "linked": linked,
        "missing": missing,
        "drifted": drifted,
        "core_blocked": core_blocked,
    }


def cmd_create(name: str, template: str = "basic"):
    """Create a new squad from template."""
    squad_dir = _get_squad_dir(name)
    if squad_dir.exists():
        print(f"Error: Squad '{name}' already exists at {squad_dir}")
        sys.exit(1)

    template_dir = TEMPLATES_DIR / template
    if not template_dir.exists():
        print(f"Error: Template '{template}' not found at {template_dir}")
        sys.exit(1)

    # Copy template
    shutil.copytree(template_dir, squad_dir)

    # Update squad.yaml with the actual name
    manifest_path = squad_dir / "squad.yaml"
    content = manifest_path.read_text(encoding="utf-8")
    content = content.replace("name: my-squad", f"name: {name}")
    manifest_path.write_text(content, encoding="utf-8")

    print(f"Squad '{name}' created at {squad_dir}")
    print(f"Template: {template}")
    print(f"\nNext steps:")
    print(f"  1. Edit squads/{name}/squad.yaml")
    print(f"  2. Add agents, skills, workflows")
    print(f"  3. Run: python3 .agents/scripts/squad_manager.py validate {name}")
    print(f"  4. Run: python3 .agents/scripts/squad_manager.py activate {name}")


def cmd_list():
    """List all squads with status."""
    if not SQUADS_DIR.exists():
        print("No squads directory found.")
        return

    squads = [
        d for d in SQUADS_DIR.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    ]

    if not squads:
        print("No squads found.")
        print(f"\nCreate one with: python3 .agents/scripts/squad_manager.py create <name>")
        return

    print(f"{'Name':<25} {'Version':<10} {'Components':<20} {'Status':<15}")
    print("-" * 70)

    for squad_dir in sorted(squads):
        manifest_path = squad_dir / "squad.yaml"
        if not manifest_path.exists():
            print(f"{squad_dir.name:<25} {'?':<10} {'No manifest':<20} {'invalid':<15}")
            continue

        manifest = _parse_yaml(manifest_path)
        components = _get_components(manifest)
        n_agents = len(components["agents"])
        n_skills = len(components["skills"])
        n_workflows = len(components["workflows"])
        comp_str = f"{n_agents}A {n_skills}S {n_workflows}W"

        info = _compute_squad_status(squad_dir, components)
        state = info["state"]
        if state == "partial":
            status_str = f"partial ({info['linked']}/{info['total']})"
        elif state == "drift":
            status_str = f"drift ({len(info['drifted'])})"
        else:
            status_str = state

        version = manifest.get("version", "?")
        print(f"{squad_dir.name:<25} {version:<10} {comp_str:<20} {status_str:<15}")


def cmd_validate(name: str):
    """Validate squad integrity."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    manifest = _get_manifest(name)
    components = _get_components(manifest)
    errors = []
    warnings = []

    # Check manifest required fields
    for field in ["name", "version", "description"]:
        if not manifest.get(field):
            errors.append(f"Missing required field '{field}' in squad.yaml")

    # Validate agents
    for agent_name in components["agents"]:
        agent_file = squad_dir / "agents" / f"{agent_name}.md"
        if not agent_file.exists():
            errors.append(f"Agent '{agent_name}' declared but file not found: {agent_file}")
        else:
            content = agent_file.read_text(encoding="utf-8")
            if not content.startswith("---"):
                warnings.append(f"Agent '{agent_name}' missing frontmatter")

    # Validate skills
    for skill_name in components["skills"]:
        skill_dir = squad_dir / "skills" / skill_name
        skill_file = skill_dir / "SKILL.md"
        if not skill_dir.exists():
            errors.append(f"Skill '{skill_name}' declared but directory not found: {skill_dir}")
        elif not skill_file.exists():
            errors.append(f"Skill '{skill_name}' missing SKILL.md: {skill_file}")

    # Validate workflows
    for wf_name in components["workflows"]:
        wf_file = squad_dir / "workflows" / f"{wf_name}.md"
        if not wf_file.exists():
            errors.append(f"Workflow '{wf_name}' declared but file not found: {wf_file}")

    # Check dependencies
    deps = manifest.get("dependencies", {})
    core_skills = deps.get("core_skills", []) if isinstance(deps, dict) else []
    if isinstance(core_skills, list):
        for skill in core_skills:
            core_skill_dir = AGENTS_DIR / "skills" / skill
            if not core_skill_dir.exists():
                warnings.append(f"Core skill dependency '{skill}' not found in framework")

    # Report
    print(f"Validating squad '{name}'...")
    print()

    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  [ERROR] {e}")
    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if not errors and not warnings:
        print("VALID: All checks passed.")
    elif not errors:
        print(f"\nVALID with {len(warnings)} warning(s).")
    else:
        print(f"\nINVALID: {len(errors)} error(s) found.")
        sys.exit(1)


def cmd_activate(name: str):
    """Activate squad by creating symlinks into .agents/."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    manifest = _get_manifest(name)
    components = _get_components(manifest)
    created = []

    # Create agent symlinks
    for agent_name in components["agents"]:
        src = squad_dir / "agents" / f"{agent_name}.md"
        dst = AGENTS_DIR / "agents" / f"{agent_name}.md"
        if dst.exists() and not dst.is_symlink():
            print(f"  SKIP: {dst} already exists as a regular file (core agent?)")
            continue
        if dst.is_symlink():
            dst.unlink()
        if src.exists():
            rel_src = os.path.relpath(src, dst.parent)
            os.symlink(rel_src, dst)
            created.append(f"agents/{agent_name}.md")

    # Create skill symlinks
    for skill_name in components["skills"]:
        src = squad_dir / "skills" / skill_name
        dst = AGENTS_DIR / "skills" / skill_name
        if dst.exists() and not dst.is_symlink():
            print(f"  SKIP: {dst} already exists as a regular directory (core skill?)")
            continue
        if dst.is_symlink():
            dst.unlink()
        if src.exists():
            rel_src = os.path.relpath(src, dst.parent)
            os.symlink(rel_src, dst)
            created.append(f"skills/{skill_name}/")

    # Create workflow symlinks
    for wf_name in components["workflows"]:
        src = squad_dir / "workflows" / f"{wf_name}.md"
        dst = AGENTS_DIR / "workflows" / f"{wf_name}.md"
        if dst.exists() and not dst.is_symlink():
            print(f"  SKIP: {dst} already exists as a regular file (core workflow?)")
            continue
        if dst.is_symlink():
            dst.unlink()
        if src.exists():
            rel_src = os.path.relpath(src, dst.parent)
            os.symlink(rel_src, dst)
            created.append(f"workflows/{wf_name}.md")

    if created:
        print(f"Squad '{name}' activated. Symlinks created:")
        for c in created:
            print(f"  .agents/{c}")
    else:
        print(f"Squad '{name}': no symlinks created (components may already exist as core).")

    # Post-activation validation
    info = _compute_squad_status(squad_dir, components)
    if info["state"] != "active":
        print(f"\n  WARNING: Post-activation state is {info['state'].upper()}, not ACTIVE.")
        if info["missing"]:
            print(f"  Missing: {', '.join(info['missing'])}")
        if info["drifted"]:
            print(f"  Drifted: {', '.join(info['drifted'])}")
        if info["core_blocked"]:
            print(f"  Core-blocked: {', '.join(info['core_blocked'])}")
        print(f"  Run: python3 .agents/scripts/squad_manager.py repair {name}")
    else:
        print(f"\n  Status: ACTIVE ({info['linked']}/{info['total']} components linked)")


def cmd_auto_activate(name: str):
    """Silently activate squad if not fully active (handles partial state)."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        sys.exit(0)

    manifest = _get_manifest(name)
    components = _get_components(manifest)
    info = _compute_squad_status(squad_dir, components)

    # Only skip if fully active; partial/inactive/drift all need repair
    if info["state"] == "active":
        return

    import io
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    try:
        cmd_activate(name)
    except Exception:
        pass
    finally:
        sys.stdout = old_stdout


def cmd_deactivate(name: str):
    """Deactivate squad by removing symlinks."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    manifest = _get_manifest(name)
    components = _get_components(manifest)
    removed = []

    # Remove agent symlinks
    for agent_name in components["agents"]:
        dst = AGENTS_DIR / "agents" / f"{agent_name}.md"
        if dst.is_symlink():
            target = dst.resolve()
            if str(squad_dir) in str(target):
                dst.unlink()
                removed.append(f"agents/{agent_name}.md")

    # Remove skill symlinks
    for skill_name in components["skills"]:
        dst = AGENTS_DIR / "skills" / skill_name
        if dst.is_symlink():
            target = dst.resolve()
            if str(squad_dir) in str(target):
                dst.unlink()
                removed.append(f"skills/{skill_name}/")

    # Remove workflow symlinks
    for wf_name in components["workflows"]:
        dst = AGENTS_DIR / "workflows" / f"{wf_name}.md"
        if dst.is_symlink():
            target = dst.resolve()
            if str(squad_dir) in str(target):
                dst.unlink()
                removed.append(f"workflows/{wf_name}.md")

    if removed:
        print(f"Squad '{name}' deactivated. Symlinks removed:")
        for r in removed:
            print(f"  .agents/{r}")
    else:
        print(f"Squad '{name}': no active symlinks found.")


def cmd_info(name: str):
    """Show squad details."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    manifest = _get_manifest(name)
    components = _get_components(manifest)

    print(f"Squad: {manifest.get('name', name)}")
    print(f"Version: {manifest.get('version', '?')}")
    print(f"Description: {manifest.get('description', '?')}")
    print(f"Author: {manifest.get('author', '?')}")
    print(f"Path: {squad_dir}")
    print()
    print(f"Components:")
    print(f"  Agents ({len(components['agents'])}):")
    for a in components["agents"]:
        exists = (squad_dir / "agents" / f"{a}.md").exists()
        print(f"    {'[OK]' if exists else '[!!]'} {a}")
    print(f"  Skills ({len(components['skills'])}):")
    for s in components["skills"]:
        exists = (squad_dir / "skills" / s / "SKILL.md").exists()
        print(f"    {'[OK]' if exists else '[!!]'} {s}")
    print(f"  Workflows ({len(components['workflows'])}):")
    for w in components["workflows"]:
        exists = (squad_dir / "workflows" / f"{w}.md").exists()
        print(f"    {'[OK]' if exists else '[!!]'} {w}")

    # Check activation status (granular)
    info = _compute_squad_status(squad_dir, components)
    state = info["state"].upper()
    if info["state"] == "partial":
        state = f"PARTIAL ({info['linked']}/{info['total']})"
    elif info["state"] == "drift":
        state = f"DRIFT ({len(info['drifted'])} drifted)"
    print(f"\nStatus: {state}")
    if info["missing"]:
        print(f"  Missing: {', '.join(info['missing'])}")
    if info["drifted"]:
        print(f"  Drifted: {', '.join(info['drifted'])}")
    if info["core_blocked"]:
        print(f"  Core-blocked: {', '.join(info['core_blocked'])}")

    # Show dependencies
    deps = manifest.get("dependencies", {})
    if isinstance(deps, dict):
        core_skills = deps.get("core_skills", [])
        if core_skills:
            print(f"\nCore Dependencies: {', '.join(core_skills)}")

    # Show platform support
    platforms = manifest.get("platforms", {})
    if isinstance(platforms, dict):
        supported = [p for p, v in platforms.items() if v]
        if supported:
            print(f"Platforms: {', '.join(supported)}")


def cmd_repair(name: str, apply: bool = False):
    """Compare manifest with actual symlinks and fix discrepancies.

    Default is --dry-run (show what would change). Use --apply to execute.
    """
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    manifest = _get_manifest(name)
    components = _get_components(manifest)
    info = _compute_squad_status(squad_dir, components)

    mode = "APPLY" if apply else "DRY-RUN"
    print(f"Repair squad '{name}' [{mode}]")
    print(f"Current state: {info['state'].upper()}", end="")
    if info["state"] == "partial":
        print(f" ({info['linked']}/{info['total']})")
    else:
        print()
    print()

    if info["state"] == "active":
        print("Nothing to repair — squad is fully active.")
        return

    actions = []

    # Build repair plan for missing symlinks
    for comp_path in info["missing"]:
        comp_type, comp_name = comp_path.split("/", 1)
        if comp_type == "agents":
            src = squad_dir / "agents" / f"{comp_name}.md"
            dst = AGENTS_DIR / "agents" / f"{comp_name}.md"
        elif comp_type == "skills":
            src = squad_dir / "skills" / comp_name
            dst = AGENTS_DIR / "skills" / comp_name
        elif comp_type == "workflows":
            src = squad_dir / "workflows" / f"{comp_name}.md"
            dst = AGENTS_DIR / "workflows" / f"{comp_name}.md"
        else:
            continue

        if src.exists():
            actions.append(("create", comp_path, src, dst))
        else:
            actions.append(("src_missing", comp_path, src, dst))

    # Build repair plan for drifted symlinks
    for comp_path in info["drifted"]:
        comp_type, comp_name = comp_path.split("/", 1)
        if comp_type == "agents":
            src = squad_dir / "agents" / f"{comp_name}.md"
            dst = AGENTS_DIR / "agents" / f"{comp_name}.md"
        elif comp_type == "skills":
            src = squad_dir / "skills" / comp_name
            dst = AGENTS_DIR / "skills" / comp_name
        elif comp_type == "workflows":
            src = squad_dir / "workflows" / f"{comp_name}.md"
            dst = AGENTS_DIR / "workflows" / f"{comp_name}.md"
        else:
            continue

        if src.exists():
            actions.append(("relink", comp_path, src, dst))
        else:
            actions.append(("src_missing", comp_path, src, dst))

    if not actions:
        print("No actionable repairs found.")
        if info["core_blocked"]:
            print(f"\nCore-blocked (cannot repair): {', '.join(info['core_blocked'])}")
        return

    # Show/execute plan
    for action, comp_path, src, dst in actions:
        if action == "create":
            rel_src = os.path.relpath(src, dst.parent)
            print(f"  + CREATE  .agents/{comp_path}  ->  {rel_src}")
            if apply:
                dst.parent.mkdir(parents=True, exist_ok=True)
                os.symlink(rel_src, dst)
        elif action == "relink":
            old_target = dst.resolve() if dst.is_symlink() else "?"
            rel_src = os.path.relpath(src, dst.parent)
            print(f"  ~ RELINK  .agents/{comp_path}  ->  {rel_src}  (was: {old_target})")
            if apply:
                dst.unlink()
                os.symlink(rel_src, dst)
        elif action == "src_missing":
            print(f"  ! SKIP    .agents/{comp_path}  (source file not found in squad)")

    if info["core_blocked"]:
        print(f"\n  Core-blocked (skipped): {', '.join(info['core_blocked'])}")

    # Post-repair status
    if apply:
        new_info = _compute_squad_status(squad_dir, components)
        print(f"\nPost-repair state: {new_info['state'].upper()}", end="")
        if new_info["state"] == "partial":
            print(f" ({new_info['linked']}/{new_info['total']})")
        else:
            print()
    else:
        print(f"\nRun with --apply to execute these repairs.")


def cmd_export(name: str):
    """Export squad as .tar.gz."""
    squad_dir = _get_squad_dir(name)
    if not squad_dir.exists():
        print(f"Error: Squad '{name}' not found at {squad_dir}")
        sys.exit(1)

    output_file = SQUADS_DIR / f"{name}.tar.gz"
    with tarfile.open(output_file, "w:gz") as tar:
        tar.add(squad_dir, arcname=name)

    print(f"Squad '{name}' exported to {output_file}")
    print(f"Size: {output_file.stat().st_size / 1024:.1f} KB")


def main():
    parser = argparse.ArgumentParser(
        description="Squad Manager - Inove AI Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  create <name>          Create new squad from template
  list                   List all squads (with granular status)
  validate <name>        Validate squad integrity
  activate <name>        Activate squad (create symlinks)
  deactivate <name>      Deactivate squad (remove symlinks)
  repair <name>          Repair partial/drift state (--dry-run default)
  info <name>            Show squad details
  export <name>          Export squad as .tar.gz
        """
    )
    parser.add_argument("command", choices=[
        "create", "list", "validate", "activate", "deactivate",
        "auto-activate", "info", "export", "repair"
    ])
    parser.add_argument("name", nargs="?", help="Squad name")
    parser.add_argument("--template", default="basic", choices=["basic", "specialist"],
                        help="Template to use for create (default: basic)")
    parser.add_argument("--apply", action="store_true", default=False,
                        help="Execute repair actions (default: dry-run)")

    args = parser.parse_args()

    # Ensure squads directory exists
    SQUADS_DIR.mkdir(exist_ok=True)

    if args.command == "list":
        cmd_list()
    elif args.command in ("validate", "activate", "auto-activate", "deactivate",
                          "info", "export", "create", "repair"):
        if not args.name:
            print(f"Error: '{args.command}' requires a squad name.")
            sys.exit(1)
        if args.command == "create":
            cmd_create(args.name, args.template)
        elif args.command == "validate":
            cmd_validate(args.name)
        elif args.command == "activate":
            cmd_activate(args.name)
        elif args.command == "auto-activate":
            cmd_auto_activate(args.name)
        elif args.command == "deactivate":
            cmd_deactivate(args.name)
        elif args.command == "info":
            cmd_info(args.name)
        elif args.command == "export":
            cmd_export(args.name)
        elif args.command == "repair":
            cmd_repair(args.name, apply=args.apply)


if __name__ == "__main__":
    main()
