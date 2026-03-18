#!/usr/bin/env python3
"""
Shard Epic - Inove AI Framework (v2)
Manages story files in docs/stories/ as the single source of implementation context.

Usage:
    python3 .agents/scripts/shard_epic.py generate    # Generate story files (called by /define)
    python3 .agents/scripts/shard_epic.py status      # Coverage and health report
    python3 .agents/scripts/shard_epic.py clean       # Remove orphan story files
    python3 .agents/scripts/shard_epic.py migrate     # Convert fat backlog to lean + stories

    # Backward compat alias:
    python3 .agents/scripts/shard_epic.py shard       # Same as 'generate'

Options:
    --epic N          Process only Epic N
    --story N.N       Process only Story N.N
    --force           Overwrite Agent Workspace (destructive)
    --dry-run         Show what would be done without writing
    --backlog PATH    Override backlog path
    --output DIR      Override stories directory (default: docs/stories/)
"""

import re
import sys
import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import (
    find_backlog,
    get_agent_source,
    get_tool_for_agent,
    find_story_file,
    parse_story_frontmatter,
    STORY_TEMPLATE,
)
from lock_manager import LockManager
from recovery import git_checkpoint, git_rollback


# ---------------------------------------------------------------------------
# Parsing (works with BOTH lean and fat backlog formats)
# ---------------------------------------------------------------------------

def parse_backlog(content: str) -> list[dict]:
    """
    Parse BACKLOG.md into a list of epics with their stories.

    Works with both lean (checkbox-only) and fat (with descriptions) formats.

    Returns:
        List of dicts: [{epic_num, epic_name, owner, model, stories: [{id, title, status, description}]}]
    """
    epics = []

    epic_pattern = re.compile(
        r"^##\s+Epic\s+(\d+):\s+(.+?)\s*(?:\[(?:P\d+)\])?\s*(?:\[OWNER:\s*(.+?)\])?\s*(?:\[MODEL:\s*(.+?)\])?\s*(?:[✅🔴⏳].*)?$",
        re.MULTILINE,
    )

    epic_matches = list(epic_pattern.finditer(content))

    for idx, match in enumerate(epic_matches):
        epic_num = int(match.group(1))
        epic_name = match.group(2).strip()
        epic_owner = match.group(3).strip() if match.group(3) else None
        epic_model = match.group(4).strip() if match.group(4) else None

        start_pos = match.end()
        end_pos = epic_matches[idx + 1].start() if idx + 1 < len(epic_matches) else len(content)
        epic_content = content[start_pos:end_pos]

        stories = _extract_stories(epic_content, epic_num)

        epics.append({
            "epic_num": epic_num,
            "epic_name": epic_name,
            "owner": epic_owner,
            "model": epic_model,
            "stories": stories,
        })

    return epics


def _extract_stories(epic_content: str, epic_num: int) -> list[dict]:
    """Extract stories from an epic's content block.

    Supports both formats:
      - Lean: - [ ] Story 1.1: Title
      - Fat:  - [ ] **Story 1.1:** Title (with description below)
    """
    stories = []

    # Match both lean and fat formats
    story_pattern = re.compile(
        r"^-\s*\[([ xX])\]\s*(?:\*\*)?Story\s+(\d+\.\d+):?\*?\*?\s*(.+?)$",
        re.MULTILINE,
    )

    story_matches = list(story_pattern.finditer(epic_content))

    for idx, match in enumerate(story_matches):
        checked = match.group(1).lower() == "x"
        story_id = match.group(2)
        story_title = match.group(3).strip()

        # Extract description (indented lines until next story or end)
        desc_start = match.end()
        desc_end = story_matches[idx + 1].start() if idx + 1 < len(story_matches) else len(epic_content)
        description = epic_content[desc_start:desc_end].strip()

        stories.append({
            "id": story_id,
            "title": story_title,
            "status": "done" if checked else "pending",
            "description": description,
        })

    return stories


# ---------------------------------------------------------------------------
# Content Generation (new format with agent/tool/dependencies)
# ---------------------------------------------------------------------------

def compute_spec_hash(description: str) -> str:
    """MD5 hash of normalized description for change detection."""
    normalized = re.sub(r"\s+", " ", description.strip().lower())
    return hashlib.md5(normalized.encode("utf-8")).hexdigest()[:12]


def _story_spec_payload(story: dict) -> str:
    """Build normalized payload from story fields for hash computation."""
    parts = []
    for key in ("id", "title", "description", "requirement", "acceptance_criteria"):
        value = story.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
    return "\n".join(parts)


def compute_story_spec_hash(story: dict) -> str:
    """Compute a spec hash using the most informative fields available."""
    payload = _story_spec_payload(story)
    if not payload.strip():
        payload = story.get("id", "")
    return compute_spec_hash(payload)


def _safe_filename(story_id: str, title: str) -> str:
    """
    Generate filename: STORY-{N-N}_{safe-title-30chars}.md

    Dots become hyphens, non-alphanum become hyphens, max 30 chars for title.
    """
    safe_id = story_id.replace(".", "-")
    safe_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:30]
    return f"STORY-{safe_id}_{safe_title}.md"


def generate_story_content(
    story: dict,
    epic: dict,
    existing_workspace: str = "",
    agent: str = "",
    tool: str = "",
    depends_on: list = None,
    unlocks: list = None,
    epic_context: str = "",
    dependency_context: str = "",
) -> str:
    """Generate markdown content for a story file using the new format."""

    if depends_on is None:
        depends_on = []
    if unlocks is None:
        unlocks = []

    # Determine agent and tool if not provided
    if not agent:
        agent = _detect_agent_from_title(story.get("title", ""))
    if not tool:
        tool = get_tool_for_agent(agent)

    workspace_text = (existing_workspace or "").strip()
    if not workspace_text:
        workspace_text = "> Notas do agente durante implementacao"

    depends_str = json.dumps(depends_on) if depends_on else "[]"
    unlocks_str = json.dumps(unlocks) if unlocks else "[]"

    # Build requirement from description or placeholder
    requirement = story.get("requirement", "") or story.get("description", "") or "(a definir)"
    acceptance = story.get("acceptance_criteria", "") or "(a definir)"

    if not epic_context:
        epic_context = epic.get("epic_name", "(sem contexto)")

    if not dependency_context:
        dependency_context = "> Sem dependencias anteriores" if not depends_on else "> (contexto sera injetado ao completar stories anteriores)"

    spec_hash = story.get("spec_hash") or compute_story_spec_hash(story)

    return STORY_TEMPLATE.format(
        story_id=story["id"],
        epic_num=epic.get("epic_num", 0),
        epic_name=epic.get("epic_name", "Unknown"),
        status=story.get("status", "pending"),
        agent=agent,
        tool=tool,
        depends_on=depends_str,
        unlocks=unlocks_str,
        priority=story.get("priority", "P0"),
        title=story.get("title", "Untitled"),
        epic_context=epic_context,
        requirement=requirement,
        acceptance_criteria=acceptance,
        dependency_context=dependency_context,
        spec_hash=spec_hash,
        workspace=workspace_text,
    )


def _detect_agent_from_title(title: str) -> str:
    """Detect likely agent from story title keywords."""
    title_lower = title.lower()

    agent_keywords = [
        ("security-auditor", ["auth", "seguranca", "security", "vulnerabilidade", "jwt", "token", "permiss"]),
        ("frontend-specialist", ["ui", "frontend", "componente", "pagina", "layout", "form", "tela", "dashboard", "css", "react", "canvas", "visualiza"]),
        ("backend-specialist", ["api", "endpoint", "backend", "servidor", "proxy", "middleware", "function", "server"]),
        ("database-architect", ["database", "schema", "query", "migra", "prisma", "sql", "tabela", "firestore", "firebase auth"]),
        ("ux-researcher", ["ux", "wireframe", "jornada", "usabilidade", "design"]),
        ("devops-engineer", ["deploy", "docker", "ci/cd", "infraestrutura", "pipeline", "kubernetes"]),
        ("test-engineer", ["test", "tdd", "cobertura", "jest", "vitest"]),
        ("mobile-developer", ["mobile", "ios", "android", "react native", "flutter", "ipad"]),
        ("performance-optimizer", ["performance", "otimiz", "cache", "lento", "bundle"]),
    ]

    for agent, keywords in agent_keywords:
        for kw in keywords:
            if kw in title_lower:
                return agent

    return "project-planner"  # default neutro quando não detectar domínio


def extract_agent_workspace(filepath: Path) -> str:
    """
    Extract Agent Workspace section from an existing story file.

    Tolerates both '## Agent Workspace' and '## Area Pessoal do Agente' (legacy).
    """
    if not filepath.exists():
        return ""

    content = filepath.read_text(encoding="utf-8")

    for header in ("## Agent Workspace", "## Area Pessoal do Agente"):
        idx = content.find(header)
        if idx != -1:
            after_header = content[idx + len(header):]
            if after_header.startswith("\n"):
                after_header = after_header[1:]
            return after_header.strip()

    return ""


# ---------------------------------------------------------------------------
# Story Update Functions (used by finish_task.py)
# ---------------------------------------------------------------------------

def update_story_status(story_id: str, new_status: str, output_dir: Path = None) -> bool:
    """
    Update the status field in a story file's YAML frontmatter.

    Args:
        story_id: Story ID like '1.1'
        new_status: 'done', 'pending', or 'in_progress'
        output_dir: Override stories directory

    Returns:
        True if updated, False if file not found.
    """
    story_file = find_story_file(story_id)
    if not story_file:
        if output_dir:
            safe_id = story_id.replace(".", "-")
            for f in output_dir.glob(f"STORY-{safe_id}_*.md"):
                story_file = f
                break
    if not story_file or not story_file.exists():
        return False

    content = story_file.read_text(encoding="utf-8")
    updated = re.sub(
        r'^status:\s*\S+',
        f'status: {new_status}',
        content,
        count=1,
        flags=re.MULTILINE,
    )

    if updated != content:
        story_file.write_text(updated, encoding="utf-8")
        return True
    return False


def inject_dependency_context(story_id: str, context_line: str, output_dir: Path = None) -> bool:
    """
    Inject a dependency context line into a story file.

    Appends to the '## Contexto de Dependencias' section.

    Args:
        story_id: Target story ID (the dependent story)
        context_line: Line to add (e.g., '> Story 0.1: Setup Vite/React base')
        output_dir: Override stories directory

    Returns:
        True if injected, False if file not found.
    """
    story_file = find_story_file(story_id)
    if not story_file:
        if output_dir:
            safe_id = story_id.replace(".", "-")
            for f in output_dir.glob(f"STORY-{safe_id}_*.md"):
                story_file = f
                break
    if not story_file or not story_file.exists():
        return False

    content = story_file.read_text(encoding="utf-8")

    # Find the dependency context section
    dep_header = "## Contexto de Dependencias"
    dep_idx = content.find(dep_header)
    if dep_idx == -1:
        return False

    # Find the next section header
    next_section = re.search(r'^## ', content[dep_idx + len(dep_header):], re.MULTILINE)
    if next_section:
        insert_pos = dep_idx + len(dep_header) + next_section.start()
    else:
        insert_pos = len(content)

    # Extract current dependency section
    dep_section = content[dep_idx + len(dep_header):insert_pos].strip()

    # Remove placeholder text if present
    cleaned = dep_section
    for placeholder in [
        "> Sem dependencias anteriores",
        "> (contexto sera injetado ao completar stories anteriores)",
    ]:
        cleaned = cleaned.replace(placeholder, "").strip()

    # Add new context line
    if context_line.strip() in cleaned:
        return False  # Already exists

    new_section = f"{cleaned}\n{context_line}" if cleaned else context_line

    # Rebuild file
    before = content[:dep_idx + len(dep_header)]
    after = content[insert_pos:]
    new_content = f"{before}\n{new_section}\n\n{after}"

    story_file.write_text(new_content, encoding="utf-8")
    return True


# ---------------------------------------------------------------------------
# File Discovery
# ---------------------------------------------------------------------------

def _find_existing_shard(output_dir: Path, story_id: str) -> Path | None:
    """Find an existing shard file for a given story ID, regardless of title slug."""
    safe_id = story_id.replace(".", "-")
    prefix = f"STORY-{safe_id}_"
    for f in output_dir.glob(f"{prefix}*.md"):
        return f
    return None


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def generate_command(args: argparse.Namespace) -> int:
    """Generate story files from backlog. Creates new format with agent/tool/dependencies."""
    lock_mgr = LockManager()
    agent = get_agent_source()

    backlog_path = Path(args.backlog) if args.backlog else find_backlog()
    if not backlog_path or not backlog_path.exists():
        print("BACKLOG.md nao encontrado.")
        print("   Execute /define primeiro para criar o backlog.")
        return 1

    output_dir = Path(args.output)

    if not lock_mgr.wait_for_lock("stories", agent, max_wait=30):
        print("Recurso 'stories' bloqueado por outro agente. Tente novamente.")
        return 1

    checkpoint_label = "shard-epic"
    had_checkpoint = False
    if not args.dry_run:
        had_checkpoint = git_checkpoint(checkpoint_label)

    try:
        content = backlog_path.read_text(encoding="utf-8")
        epics = parse_backlog(content)

        if not epics:
            print("Nenhum Epic encontrado no backlog.")
            return 1

        epics = _filter_epics(epics, args)

        if not args.dry_run:
            output_dir.mkdir(parents=True, exist_ok=True)

        created = 0
        updated = 0
        skipped = 0

        for epic in epics:
            for story in epic["stories"]:
                story = dict(story)
                filename = _safe_filename(story["id"], story["title"])
                target = output_dir / filename
                existing = _find_existing_shard(output_dir, story["id"])

                # Preserve Agent Workspace from existing file
                workspace = ""
                source_file = existing or target
                if source_file.exists() and not getattr(args, 'force', False):
                    workspace = extract_agent_workspace(source_file)

                story_hash = story.get("spec_hash") or compute_story_spec_hash(story)
                story["spec_hash"] = story_hash
                new_content = generate_story_content(story, epic, workspace)

                current_file = None
                if existing and existing.exists():
                    current_file = existing
                elif target.exists():
                    current_file = target

                needs_rename = bool(existing and existing.exists() and existing.name != filename)

                action = "create"
                if current_file and current_file.exists():
                    if needs_rename:
                        action = "update"
                    else:
                        old = current_file.read_text(encoding="utf-8")
                        old_hash = _extract_frontmatter_field(old, "spec_hash")
                        if old_hash == story_hash and not getattr(args, 'force', False):
                            action = "skip"
                        else:
                            action = "update"

                if args.dry_run:
                    print(f"  [DRY-RUN] {action.upper()}: {filename}")
                    if action == "create":
                        created += 1
                    elif action == "update":
                        updated += 1
                    else:
                        skipped += 1
                    continue

                if action == "skip":
                    skipped += 1
                    continue

                if existing and existing.exists() and existing.name != filename:
                    existing.unlink()

                if action == "update":
                    updated += 1
                else:
                    created += 1

                target.write_text(new_content, encoding="utf-8")

        total = created + updated + skipped
        print(f"\n📦 Generate {'(dry-run) ' if args.dry_run else ''}concluido!")
        print(f"   Criados:     {created}")
        print(f"   Atualizados: {updated}")
        print(f"   Inalterados: {skipped}")
        print(f"   Total:       {total}")
        print(f"   Diretorio:   {output_dir}/")
        return 0

    except Exception as e:
        print(f"Erro durante generate: {e}")
        if had_checkpoint and not args.dry_run:
            print("Rollback automatico...")
            git_rollback(checkpoint_label)
        return 1

    finally:
        lock_mgr.release_lock("stories", agent)


def migrate_command(args: argparse.Namespace) -> int:
    """Migrate fat backlog to lean backlog + story files.

    1. Reads fat BACKLOG.md (with descriptions, gherkin, etc.)
    2. Generates lean BACKLOG.md (checkboxes only)
    3. Generates story files with full detail in docs/stories/
    4. Backs up original BACKLOG.md to BACKLOG.md.bak
    """
    backlog_path = Path(args.backlog) if args.backlog else find_backlog()
    if not backlog_path or not backlog_path.exists():
        print("BACKLOG.md nao encontrado.")
        return 1

    output_dir = Path(args.output)

    # Read and parse fat backlog
    fat_content = backlog_path.read_text(encoding="utf-8")
    epics = parse_backlog(fat_content)

    if not epics:
        print("Nenhum Epic encontrado no backlog.")
        return 1

    epics = _filter_epics(epics, args)

    # Check if backlog is already lean (stories have no description)
    has_descriptions = any(
        s.get("description", "").strip()
        for e in epics
        for s in e["stories"]
    )

    if not has_descriptions:
        print("Backlog ja esta no formato lean. Nada a migrar.")
        print("Use 'generate' para criar story files a partir do backlog lean.")
        return 0

    if args.dry_run:
        print("[DRY-RUN] Migracao:")
        print(f"  Backup: {backlog_path} -> {backlog_path}.bak")
        print(f"  Lean backlog: {backlog_path}")
        for epic in epics:
            for story in epic["stories"]:
                filename = _safe_filename(story["id"], story["title"])
                print(f"  Story file: {output_dir / filename}")
        return 0

    # Git checkpoint
    had_checkpoint = git_checkpoint("migrate-backlog")

    try:
        # 1. Backup original
        backup_path = backlog_path.parent / f"{backlog_path.stem}.bak{backlog_path.suffix}"
        backup_path.write_text(fat_content, encoding="utf-8")
        print(f"  Backup: {backup_path}")

        # 2. Generate story files
        output_dir.mkdir(parents=True, exist_ok=True)
        story_count = 0
        for epic in epics:
            for story in epic["stories"]:
                story = dict(story)
                filename = _safe_filename(story["id"], story["title"])
                target = output_dir / filename

                # Preserve workspace from existing file
                existing = _find_existing_shard(output_dir, story["id"])
                workspace = ""
                if existing and existing.exists():
                    workspace = extract_agent_workspace(existing)
                    if existing.name != filename:
                        existing.unlink()

                story["spec_hash"] = story.get("spec_hash") or compute_story_spec_hash(story)
                new_content = generate_story_content(story, epic, workspace)
                target.write_text(new_content, encoding="utf-8")
                story_count += 1
                print(f"  Story: {filename}")

        # 3. Generate lean backlog
        lean_content = _generate_lean_backlog(epics, fat_content)
        backlog_path.write_text(lean_content, encoding="utf-8")
        print(f"  Lean backlog: {backlog_path}")

        print(f"\n✅ Migracao concluida!")
        print(f"   {story_count} story files gerados em {output_dir}/")
        print(f"   Backlog convertido para formato lean")
        print(f"   Original salvo em {backup_path}")
        return 0

    except Exception as e:
        print(f"Erro durante migracao: {e}")
        if had_checkpoint:
            print("Rollback automatico...")
            git_rollback("migrate-backlog")
        return 1


def _generate_lean_backlog(epics: list[dict], original_content: str = "") -> str:
    """Generate a lean backlog from parsed epics."""
    # Try to extract title from original content
    title_match = re.search(r'^#\s+(.+)$', original_content, re.MULTILINE)
    title = title_match.group(1) if title_match else "Backlog"

    lines = [f"# {title}", ""]

    for epic in epics:
        # Build epic header with metadata
        header = f"## Epic {epic['epic_num']}: {epic['epic_name']}"
        if epic.get("owner"):
            header += f" [OWNER: {epic['owner']}]"
        if epic.get("model"):
            header += f" [MODEL: {epic['model']}]"
        lines.append(header)

        for story in epic["stories"]:
            check = "x" if story["status"] == "done" else " "
            lines.append(f"- [{check}] Story {story['id']}: {story['title']}")

        lines.append("")

    return "\n".join(lines)


def status_command(args: argparse.Namespace) -> int:
    """Show story file health: coverage, orphans."""
    backlog_path = Path(args.backlog) if args.backlog else find_backlog()
    output_dir = Path(args.output)

    if not backlog_path or not backlog_path.exists():
        print("BACKLOG.md nao encontrado.")
        return 1

    content = backlog_path.read_text(encoding="utf-8")
    epics = parse_backlog(content)
    epics = _filter_epics(epics, args)

    # Collect all story IDs from backlog
    backlog_ids = set()
    for epic in epics:
        for story in epic["stories"]:
            backlog_ids.add(story["id"])

    # Collect all story IDs from files
    shard_ids = set()
    shard_files = {}
    if output_dir.exists():
        for f in output_dir.glob("STORY-*.md"):
            m = re.match(r"STORY-(\d+)-(\d+)_", f.name)
            if m:
                sid = f"{m.group(1)}.{m.group(2)}"
                shard_ids.add(sid)
                shard_files[sid] = f

    covered = backlog_ids & shard_ids
    missing = backlog_ids - shard_ids
    orphans = shard_ids - backlog_ids

    total = len(backlog_ids)
    coverage = (len(covered) / total * 100) if total > 0 else 0

    print(f"Story Status")
    print(f"   Backlog stories:   {total}")
    print(f"   Story files:       {len(shard_ids)}")
    print(f"   Cobertura:         {coverage:.0f}%")
    print()

    if missing:
        print(f"Sem story file ({len(missing)}):")
        for sid in sorted(missing):
            print(f"     - Story {sid}")
        print()

    if orphans:
        print(f"Orfaos ({len(orphans)}):")
        for sid in sorted(orphans):
            f = shard_files.get(sid)
            print(f"     - {f.name if f else sid}")
        print()

    # Check new format (agent/tool fields)
    missing_fields = []
    for sid, f in shard_files.items():
        fm = parse_story_frontmatter(f)
        if not fm.get("agent") or not fm.get("tool"):
            missing_fields.append(sid)

    if missing_fields:
        print(f"Formato antigo (sem agent/tool) ({len(missing_fields)}):")
        for sid in sorted(missing_fields):
            print(f"     - Story {sid}")
        print(f"   Execute 'migrate' ou 'generate' para atualizar.")
        print()

    if not missing and not orphans and not missing_fields:
        print("Todos os story files estao sincronizados e no formato correto.")

    return 0


def clean_command(args: argparse.Namespace) -> int:
    """Remove orphan story files (stories that no longer exist in backlog)."""
    backlog_path = Path(args.backlog) if args.backlog else find_backlog()
    output_dir = Path(args.output)

    if not backlog_path or not backlog_path.exists():
        print("BACKLOG.md nao encontrado.")
        return 1

    if not output_dir.exists():
        print("docs/stories/ nao existe. Nada a limpar.")
        return 0

    content = backlog_path.read_text(encoding="utf-8")
    epics = parse_backlog(content)

    backlog_ids = set()
    for epic in epics:
        for story in epic["stories"]:
            backlog_ids.add(story["id"])

    removed = 0
    for f in output_dir.glob("STORY-*.md"):
        m = re.match(r"STORY-(\d+)-(\d+)_", f.name)
        if m:
            sid = f"{m.group(1)}.{m.group(2)}"
            if sid not in backlog_ids:
                if args.dry_run:
                    print(f"  [DRY-RUN] REMOVE: {f.name}")
                else:
                    f.unlink()
                    print(f"  Removido: {f.name}")
                removed += 1

    if removed == 0:
        print("Nenhum story file orfao encontrado.")
    else:
        print(f"\n{removed} story file(s) orfao(s) {'seriam removidos' if args.dry_run else 'removidos'}.")

    return 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _filter_epics(epics: list[dict], args: argparse.Namespace) -> list[dict]:
    """Filter epics/stories based on --epic and --story flags."""
    if hasattr(args, 'story') and args.story:
        epic_num = int(args.story.split(".")[0])
        filtered = []
        for epic in epics:
            if epic["epic_num"] == epic_num:
                epic_copy = dict(epic)
                epic_copy["stories"] = [s for s in epic["stories"] if s["id"] == args.story]
                if epic_copy["stories"]:
                    filtered.append(epic_copy)
        return filtered

    if hasattr(args, 'epic') and args.epic:
        return [e for e in epics if e["epic_num"] == int(args.epic)]

    return epics


def _extract_frontmatter_field(content: str, field: str) -> str | None:
    """Extract a field value from YAML frontmatter."""
    m = re.search(rf'^{field}:\s*"?([^"\n]+)"?\s*$', content, re.MULTILINE)
    return m.group(1).strip() if m else None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="shard_epic",
        description="Manages story files in docs/stories/ as the single source of implementation context.",
    )

    sub = parser.add_subparsers(dest="command")

    # Commands
    gen_p = sub.add_parser("generate", help="Generate story files from backlog")
    shard_p = sub.add_parser("shard", help="Alias for 'generate' (backward compat)")
    migrate_p = sub.add_parser("migrate", help="Convert fat backlog to lean + stories")
    status_p = sub.add_parser("status", help="Story file health report")
    clean_p = sub.add_parser("clean", help="Remove orphan story files")

    # Common options
    for p in (gen_p, shard_p, migrate_p, status_p, clean_p):
        p.add_argument("--epic", type=str, default=None, help="Process only Epic N")
        p.add_argument("--story", type=str, default=None, help="Process only Story N.N")
        p.add_argument("--backlog", type=str, default=None, help="Override backlog path")
        p.add_argument("--output", type=str, default="docs/stories", help="Override stories dir")

    # Generate/Shard-specific
    for p in (gen_p, shard_p):
        p.add_argument("--force", action="store_true", help="Overwrite Agent Workspace")
        p.add_argument("--dry-run", action="store_true", help="Show actions without writing")

    # Migrate-specific
    migrate_p.add_argument("--dry-run", action="store_true", help="Show actions without writing")

    # Clean-specific
    clean_p.add_argument("--dry-run", action="store_true", help="Show actions without writing")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    # Backward compat: no subcommand = generate
    if args.command is None:
        sys.argv.insert(1, "generate")
        args = parser.parse_args()

    commands = {
        "generate": generate_command,
        "shard": generate_command,  # backward compat alias
        "migrate": migrate_command,
        "status": status_command,
        "clean": clean_command,
    }

    handler = commands.get(args.command)
    if handler:
        sys.exit(handler(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
