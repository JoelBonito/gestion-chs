#!/usr/bin/env python3
"""
Validation Script - Inove AI Framework v5.1
============================================
Validates framework integrity via nominal set comparison (not just counts).

Modes:
    --mode warn   (default) extras/broken/shadowed are WARN, exit 0
    --mode strict           extras/broken/shadowed are FAIL, exit 1

Usage:
    python3 .agents/scripts/validate_installation.py
    python3 .agents/scripts/validate_installation.py --verbose
    python3 .agents/scripts/validate_installation.py --mode strict
"""

import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Core Manifests — single source of truth
# ---------------------------------------------------------------------------

CORE_AGENTS = {
    "backend-specialist.md",
    "code-archaeologist.md",
    "database-architect.md",
    "debugger.md",
    "devops-engineer.md",
    "documentation-writer.md",
    "explorer-agent.md",
    "frontend-specialist.md",
    "game-developer.md",
    "mobile-developer.md",
    "orchestrator.md",
    "penetration-tester.md",
    "performance-optimizer.md",
    "product-manager.md",
    "product-owner.md",
    "project-planner.md",
    "qa-automation-engineer.md",
    "security-auditor.md",
    "seo-specialist.md",
    "test-engineer.md",
    "ux-researcher.md",
}  # 21

CORE_SKILLS = {
    "api-patterns",
    "app-builder",
    "architecture",
    "bash-linux",
    "behavioral-modes",
    "brainstorming",
    "clean-code",
    "code-review-checklist",
    "database-design",
    "deployment-procedures",
    "doc-review",
    "documentation-templates",
    "frontend-design",
    "game-development",
    "gap-analysis",
    "geo-fundamentals",
    "i18n-localization",
    "intelligent-routing",
    "lint-and-validate",
    "mcp-builder",
    "mobile-design",
    "nextjs-react-expert",
    "nodejs-best-practices",
    "parallel-agents",
    "performance-profiling",
    "plan-writing",
    "powershell-windows",
    "python-patterns",
    "red-team-tactics",
    "seo-fundamentals",
    "server-management",
    "stitch-ui-design",
    "system-design",
    "systematic-debugging",
    "tailwind-patterns",
    "tdd-workflow",
    "testing-patterns",
    "ux-research",
    "vulnerability-scanner",
    "web-design-guidelines",
    "webapp-testing",
}  # 41

CORE_WORKFLOWS = {
    "brainstorm.md",
    "context.md",
    "create.md",
    "debug.md",
    "define.md",
    "deploy.md",
    "enhance.md",
    "finish.md",
    "journeys.md",
    "log.md",
    "orchestrate.md",
    "plan.md",
    "preview.md",
    "readiness.md",
    "release.md",
    "review.md",
    "squad.md",
    "status.md",
    "test-book.md",
    "test.md",
    "track.md",
    "ui-ux-pro-max.md",
}  # 22

CORE_SCRIPTS = {
    "_check_runner.py",
    "auto_finish.py",
    "auto_preview.py",
    "auto_session.py",
    "checklist.py",
    "dashboard.py",
    "finish_task.py",
    "generate_web_data.py",
    "lock_manager.py",
    "metrics.py",
    "notifier.py",
    "platform_compat.py",
    "progress_tracker.py",
    "project_analyzer.py",
    "recovery.py",
    "reminder_system.py",
    "shard_epic.py",
    "squad_manager.py",
    "sync_tracker.py",
    "validate_installation.py",
    "validate_traceability.py",
    "verify_all.py",
}  # 25


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class ValidationResult:
    """Accumulates findings across all checks."""

    def __init__(self):
        self.missing: list[str] = []        # always FAIL
        self.extras_expected: list[str] = [] # squad-expected (OK/info)
        self.extras_unexpected: list[str] = []  # WARN or FAIL
        self.broken_symlinks: list[str] = []    # WARN or FAIL
        self.shadowed_core: list[str] = []      # WARN or FAIL

    @property
    def has_hard_failures(self) -> bool:
        return len(self.missing) > 0

    def has_soft_issues(self) -> bool:
        return bool(
            self.extras_unexpected
            or self.broken_symlinks
            or self.shadowed_core
        )


def load_squad_expected(root: Path) -> dict[str, set[str]]:
    """Read active squad manifests and return expected extras per domain."""
    expected: dict[str, set[str]] = {
        "agents": set(),
        "skills": set(),
        "workflows": set(),
        "scripts": set(),
    }
    squads_dir = root / "squads"
    if not squads_dir.exists():
        return expected

    for squad_dir in sorted(squads_dir.iterdir()):
        if not squad_dir.is_dir() or squad_dir.name.startswith("."):
            continue
        manifest = squad_dir / "squad.yaml"
        if not manifest.exists():
            continue

        # Simple YAML parser (avoids PyYAML dependency)
        data = _parse_squad_yaml(manifest)
        for domain in ("agents", "skills", "workflows", "scripts"):
            for item in data.get(domain, []):
                if domain == "agents":
                    expected[domain].add(f"{item}.md")
                elif domain == "skills":
                    expected[domain].add(item)
                elif domain == "workflows":
                    expected[domain].add(f"{item}.md")
                elif domain == "scripts":
                    expected[domain].add(item)

    return expected


def _parse_squad_yaml(path: Path) -> dict[str, list[str]]:
    """Minimal YAML parser for squad.yaml components section."""
    result: dict[str, list[str]] = {}
    current_section = None
    in_components = False

    for line in path.read_text().splitlines():
        stripped = line.strip()

        if stripped == "components:":
            in_components = True
            continue

        if in_components:
            # End of components block (new top-level key)
            if stripped and not stripped.startswith("-") and not stripped.startswith("#"):
                if not line.startswith(" ") and not line.startswith("\t"):
                    in_components = False
                    current_section = None
                    continue

            # Sub-section header (e.g. "agents:")
            if stripped.endswith(":") and not stripped.startswith("-"):
                current_section = stripped[:-1].strip()
                result[current_section] = []
                continue

            # List item
            if stripped.startswith("- ") and current_section:
                result[current_section].append(stripped[2:].strip())

    return result


def scan_directory(directory: Path, pattern: str, name_extractor) -> tuple[set[str], list[str]]:
    """Scan a directory and return (found_names, broken_symlinks)."""
    found = set()
    broken = []
    if not directory.exists():
        return found, broken

    for item in sorted(directory.iterdir()):
        # Check for broken symlinks first
        if item.is_symlink() and not item.resolve().exists():
            broken.append(str(item.relative_to(directory.parent.parent.parent)))
            continue
        name = name_extractor(item)
        if name and item.match(pattern):
            found.add(name)

    return found, broken


def detect_shadowed_core(directory: Path, core_set: set[str], name_extractor) -> list[str]:
    """Detect core items that are symlinks pointing to non-core origins (squad overrides)."""
    shadowed = []
    if not directory.exists():
        return shadowed

    for item in sorted(directory.iterdir()):
        name = name_extractor(item)
        if name and name in core_set and item.is_symlink():
            target = str(item.resolve())
            # Core items should be regular files, not symlinks.
            # Platform symlinks (.claude/*, .codex/*) are NOT in this directory,
            # so any symlink here is a squad override.
            shadowed.append(f"{name} -> {target}")

    return shadowed


def validate_domain(
    label: str,
    directory: Path,
    pattern: str,
    core_set: set[str],
    squad_expected: set[str],
    name_extractor,
    result: ValidationResult,
    verbose: bool,
):
    """Validate a single domain (agents, skills, workflows, scripts)."""
    print(f"  [{label}]")

    actual, broken = scan_directory(directory, pattern, name_extractor)
    shadowed = detect_shadowed_core(directory, core_set, name_extractor)

    # Set operations
    missing = sorted(core_set - actual)
    extras = actual - core_set
    extras_exp = sorted(extras & squad_expected)
    extras_unexp = sorted(extras - squad_expected)

    # Core integrity
    core_present = sorted(core_set & actual)
    print(f"    Core: {len(core_present)}/{len(core_set)}", end="")
    if not missing:
        print(" OK")
    else:
        print(f" MISSING {len(missing)}")

    # Report missing
    for m in missing:
        print(f"    FAIL  missing: {m}")
        result.missing.append(f"{label}/{m}")

    # Report extras (squad-expected)
    if extras_exp:
        print(f"    Extras (squad-expected): {len(extras_exp)}")
        if verbose:
            for e in extras_exp:
                print(f"      OK  {e}")
        result.extras_expected.extend(f"{label}/{e}" for e in extras_exp)

    # Report extras (unexpected)
    if extras_unexp:
        for e in extras_unexp:
            print(f"    WARN  unexpected: {e}")
        result.extras_unexpected.extend(f"{label}/{e}" for e in extras_unexp)

    # Report broken symlinks
    for b in broken:
        print(f"    WARN  broken-symlink: {b}")
        result.broken_symlinks.append(b)

    # Report shadowed core
    for s in shadowed:
        print(f"    WARN  shadowed-core: {s}")
        result.shadowed_core.append(s)

    print()


# ---------------------------------------------------------------------------
# Main validation
# ---------------------------------------------------------------------------

def validate_installation(verbose: bool = False, mode: str = "warn"):
    """Run full framework validation."""
    is_strict = mode == "strict"
    print(f"Inove AI Framework v5.1 - Integrity Validation (mode={mode})")
    print("=" * 64)
    print()

    root = Path(__file__).parent.parent.parent  # project root
    agents_dir = root / ".agents"
    script_dir = agents_dir / "scripts"

    result = ValidationResult()

    # Load squad whitelist
    squad_expected = load_squad_expected(root)

    # --- 1. Core Integrity ---
    print("[1/7] Core Integrity")
    print("-" * 64)

    validate_domain(
        label="Agents",
        directory=agents_dir / "agents",
        pattern="*.md",
        core_set=CORE_AGENTS,
        squad_expected=squad_expected["agents"],
        name_extractor=lambda p: p.name if p.suffix == ".md" else None,
        result=result,
        verbose=verbose,
    )

    validate_domain(
        label="Skills",
        directory=agents_dir / "skills",
        pattern="*",
        core_set=CORE_SKILLS,
        squad_expected=squad_expected["skills"],
        name_extractor=lambda p: p.name if p.is_dir() and (p / "SKILL.md").exists() else None,
        result=result,
        verbose=verbose,
    )

    validate_domain(
        label="Workflows",
        directory=agents_dir / "workflows",
        pattern="*.md",
        core_set=CORE_WORKFLOWS,
        squad_expected=squad_expected["workflows"],
        name_extractor=lambda p: p.name if p.suffix == ".md" else None,
        result=result,
        verbose=verbose,
    )

    validate_domain(
        label="Scripts",
        directory=script_dir,
        pattern="*.py",
        core_set=CORE_SCRIPTS,
        squad_expected=squad_expected["scripts"],
        name_extractor=lambda p: p.name if p.suffix == ".py" else None,
        result=result,
        verbose=verbose,
    )

    # --- 2. Instruction Files ---
    print("[2/7] Instruction Files")
    print("-" * 64)

    instruction_files = [
        (root / "CLAUDE.md", "CLAUDE.md (Claude Code)"),
        (root / "AGENTS.md", "AGENTS.md (Codex CLI)"),
        (root / "GEMINI.md", "GEMINI.md (Antigravity)"),
        (agents_dir / "INSTRUCTIONS.md", ".agents/INSTRUCTIONS.md (canonical)"),
        (agents_dir / "ARCHITECTURE.md", ".agents/ARCHITECTURE.md"),
        (root / ".claude" / "project_instructions.md", ".claude/project_instructions.md"),
    ]

    for path, label in instruction_files:
        if path.exists():
            print(f"  OK   {label}")
        else:
            print(f"  FAIL {label} - MISSING")
            result.missing.append(label)

    print()

    # --- 3. Platform Symlinks ---
    print("[3/7] Platform Symlinks")
    print("-" * 64)

    symlinks = [
        (root / ".claude" / "agents", ".claude/agents/"),
        (root / ".claude" / "skills", ".claude/skills/"),
    ]

    codex_dir = root / ".codex"
    if codex_dir.exists():
        symlinks.extend([
            (codex_dir / "agents", ".codex/agents/"),
            (codex_dir / "skills", ".codex/skills/"),
            (codex_dir / "prompts", ".codex/prompts/"),
        ])

    for path, label in symlinks:
        if not path.exists() and not path.is_symlink():
            print(f"  FAIL {label} - MISSING")
            result.missing.append(label)
        elif path.is_symlink():
            target = path.resolve()
            if target.exists():
                print(f"  OK   {label} -> {target.name}/")
            else:
                print(f"  WARN {label} - BROKEN SYMLINK -> {path.readlink()}")
                result.broken_symlinks.append(label)
        else:
            print(f"  OK   {label} (direct)")

    print()

    # --- 4. Squad System ---
    print("[4/7] Squad System")
    print("-" * 64)

    squad_items = [
        (root / "squads", "squads/"),
        (root / "squads" / "README.md", "squads/README.md"),
        (root / "squads" / ".templates" / "basic" / "squad.yaml", "templates/basic/squad.yaml"),
        (root / "squads" / ".templates" / "specialist" / "squad.yaml", "templates/specialist/squad.yaml"),
        (agents_dir / "workflows" / "squad.md", "workflows/squad.md"),
    ]

    for path, label in squad_items:
        if path.exists():
            print(f"  OK   {label}")
        else:
            print(f"  FAIL {label} - MISSING")
            result.missing.append(label)

    squads_dir = root / "squads"
    active_squads = [
        d.name for d in sorted(squads_dir.iterdir())
        if d.is_dir() and not d.name.startswith(".") and (d / "squad.yaml").exists()
    ] if squads_dir.exists() else []
    print(f"  Active squads: {len(active_squads)}", end="")
    if active_squads:
        print(f" ({', '.join(active_squads)})")
    else:
        print()

    print()

    # --- 5. Gemini Config ---
    print("[5/7] Gemini CLI Config")
    print("-" * 64)

    gemini_items = [
        (root / ".gemini" / "settings.json", ".gemini/settings.json"),
        (root / ".gemini" / "mcp.json", ".gemini/mcp.json"),
    ]

    for path, label in gemini_items:
        if path.exists():
            print(f"  OK   {label}")
        else:
            print(f"  FAIL {label} - MISSING")
            result.missing.append(label)

    for path, label in gemini_items:
        if path.exists():
            try:
                json.loads(path.read_text())
            except json.JSONDecodeError as e:
                msg = f"  FAIL {label} - INVALID JSON: {e}"
                print(msg)
                result.missing.append(f"{label} (invalid)")

    print()

    # --- 6. Recovery System ---
    print("[6/7] Recovery System")
    print("-" * 64)

    recovery_path = script_dir / "recovery.py"
    if recovery_path.exists():
        print("  OK   recovery.py")
    else:
        print("  FAIL recovery.py - MISSING")
        result.missing.append("recovery.py")

    try:
        sys.path.insert(0, str(script_dir))
        from recovery import with_retry, safe_execute, git_checkpoint, git_rollback  # noqa: F401
        print("  OK   recovery imports (with_retry, safe_execute, git_checkpoint, git_rollback)")
    except ImportError as e:
        print(f"  FAIL recovery import: {e}")
        result.missing.append(f"recovery import: {e}")
    finally:
        if str(script_dir) in sys.path:
            sys.path.remove(str(script_dir))

    print()

    # --- 7. Summary ---
    print("[7/7] Summary")
    print("=" * 64)

    # Counts
    print(f"  Core expected: {21} agents | {41} skills | {22} workflows | {22} scripts")
    print()

    has_issues = False

    if result.missing:
        has_issues = True
        print(f"  FAIL  Core Missing: {len(result.missing)}")
        for item in result.missing:
            print(f"        - {item}")
        print()

    if result.extras_expected:
        print(f"  OK    Squad-Expected Extras: {len(result.extras_expected)}")
        if verbose:
            for item in result.extras_expected:
                print(f"        - {item}")
        print()

    if result.extras_unexpected:
        severity = "FAIL" if is_strict else "WARN"
        print(f"  {severity}  Unexpected Extras: {len(result.extras_unexpected)}")
        for item in result.extras_unexpected:
            print(f"        - {item}")
        if is_strict:
            has_issues = True
        print()

    if result.broken_symlinks:
        severity = "FAIL" if is_strict else "WARN"
        print(f"  {severity}  Broken Symlinks: {len(result.broken_symlinks)}")
        for item in result.broken_symlinks:
            print(f"        - {item}")
        if is_strict:
            has_issues = True
        print()

    if result.shadowed_core:
        severity = "FAIL" if is_strict else "WARN"
        print(f"  {severity}  Shadowed Core: {len(result.shadowed_core)}")
        for item in result.shadowed_core:
            print(f"        - {item}")
        if is_strict:
            has_issues = True
        print()

    if not has_issues and not result.has_soft_issues():
        print("  PASSED - All components validated (core intact, no drift)")
    elif not has_issues:
        print("  PASSED (with warnings) - Core intact, drift detected")
    else:
        print(f"  FAILED - {len(result.missing)} core missing", end="")
        if is_strict and result.has_soft_issues():
            soft = len(result.extras_unexpected) + len(result.broken_symlinks) + len(result.shadowed_core)
            print(f", {soft} strict violation(s)", end="")
        print()

    print()
    return not has_issues


def main():
    verbose = "--verbose" in sys.argv
    mode = "warn"
    if "--mode" in sys.argv:
        idx = sys.argv.index("--mode")
        if idx + 1 < len(sys.argv) and sys.argv[idx + 1] in ("warn", "strict"):
            mode = sys.argv[idx + 1]
        else:
            print("Usage: --mode warn|strict")
            sys.exit(2)

    success = validate_installation(verbose, mode)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
