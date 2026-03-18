#!/usr/bin/env python3
"""
Progress Tracker - Inove AI Framework (v2)
Generates unified PROJECT_STATUS.md with progress bar, next story routing, and alerts.

Usage:
    python3 .agents/scripts/progress_tracker.py [backlog_path]

Outputs:
    - docs/PROJECT_STATUS.md (primary — pointer + progress + routing)
    - docs/progress-bar.md (redirect to PROJECT_STATUS.md for backward compat)
"""

import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import NamedTuple, Optional

sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import (
    find_backlog,
    find_stories_dir,
    find_story_file,
    parse_story_frontmatter,
    _PROJECT_STATUS_TEMPLATE,
)


class Epic(NamedTuple):
    """Represents an Epic with its metrics."""
    num: Optional[int] = None
    name: str = ""
    total: int = 0
    done: int = 0
    owner: Optional[str] = None
    model: Optional[str] = None

    @property
    def percent(self) -> float:
        return (self.done / self.total * 100) if self.total > 0 else 0


def parse_backlog(content: str) -> list[Epic]:
    """
    Parse backlog content and extract Epics with task counts.

    Works with both lean and fat backlog formats.
    Only counts top-level story checkboxes (- [x] / - [ ]).
    """
    epics: list[Epic] = []

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

        # Count only top-level story checkboxes (not indented subtasks)
        done = len(re.findall(r"^-\s*\[(?:x|X)\]", epic_content, re.MULTILINE))
        pending = len(re.findall(r"^-\s*\[\s\]", epic_content, re.MULTILINE))
        total = done + pending

        if total > 0:
            epics.append(Epic(
                num=epic_num, name=epic_name,
                total=total, done=done,
                owner=epic_owner, model=epic_model,
            ))

    return epics


def generate_bar(percent: float, width: int = 10) -> str:
    """Generate ASCII progress bar."""
    filled = int(width * percent / 100)
    empty = width - filled
    return "█" * filled + "░" * empty


def _get_git_info() -> dict:
    """Get current git branch and recent commits."""
    info = {"branch": "unknown", "commits": "(nenhum commit registrado)"}
    try:
        info["branch"] = subprocess.check_output(
            ["git", "branch", "--show-current"],
            text=True, stderr=subprocess.DEVNULL,
        ).strip() or "unknown"
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass
    try:
        info["commits"] = subprocess.check_output(
            ["git", "log", "-3", "--oneline"],
            text=True, stderr=subprocess.DEVNULL,
        ).strip() or "(nenhum commit registrado)"
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass
    return info


def _find_next_pending_story(content: str) -> Optional[dict]:
    """Find the first unchecked story in the backlog and read its story file metadata."""
    # Match lean or fat format
    pattern = re.compile(
        r"^-\s*\[\s\]\s*(?:\*\*)?Story\s+(\d+\.\d+):?\*?\*?\s*(.+?)$",
        re.MULTILINE,
    )
    match = pattern.search(content)
    if not match:
        return None

    story_id = match.group(1)
    story_title = match.group(2).strip()

    result = {
        "id": story_id,
        "title": story_title,
        "agent": "unknown",
        "tool": "unknown",
        "depends_on": [],
    }

    # Try to read story file for richer metadata
    story_file = find_story_file(story_id)
    if story_file:
        fm = parse_story_frontmatter(story_file)
        result["agent"] = fm.get("agent", "unknown")
        result["tool"] = fm.get("tool", "unknown")
        result["depends_on"] = fm.get("depends_on", [])

    return result


def _find_story_after(content: str, current_story_id: str) -> Optional[dict]:
    """Find the story immediately after the given story ID in the backlog."""
    pattern = re.compile(
        r"^-\s*\[[ xX]\]\s*(?:\*\*)?Story\s+(\d+\.\d+):?\*?\*?\s*(.+?)$",
        re.MULTILINE,
    )
    matches = list(pattern.finditer(content))

    found_current = False
    for match in matches:
        sid = match.group(1)
        if found_current:
            # Return the next unchecked story
            check_line = content[match.start():match.end()]
            if "[ ]" in check_line:
                result = {"id": sid, "title": match.group(2).strip()}
                story_file = find_story_file(sid)
                if story_file:
                    fm = parse_story_frontmatter(story_file)
                    result["agent"] = fm.get("agent", "unknown")
                    result["tool"] = fm.get("tool", "unknown")
                return result
        if sid == current_story_id:
            found_current = True

    return None


def _check_dependency_status(depends_on: list) -> list[dict]:
    """Check completion status of dependency stories."""
    results = []
    for dep_id in depends_on:
        story_file = find_story_file(dep_id)
        if story_file:
            fm = parse_story_frontmatter(story_file)
            status = fm.get("status", "unknown")
        else:
            status = "unknown"
        done = status == "done"
        results.append({"id": dep_id, "done": done, "label": "done" if done else "pending"})
    return results


def _validate_coverage(content: str) -> list[str]:
    """Validate bidirectional coverage: backlog checkboxes <-> story files."""
    warnings = []

    # Extract all story IDs from backlog
    pattern = re.compile(
        r"^-\s*\[[ xX]\]\s*(?:\*\*)?Story\s+(\d+\.\d+)",
        re.MULTILINE,
    )
    backlog_ids = set(m.group(1) for m in pattern.finditer(content))

    # Extract all story IDs from files
    stories_dir = find_stories_dir()
    file_ids = set()
    if stories_dir.exists():
        for f in stories_dir.glob("STORY-*.md"):
            m = re.match(r"STORY-(\d+)-(\d+)_", f.name)
            if m:
                file_ids.add(f"{m.group(1)}.{m.group(2)}")

    missing_files = backlog_ids - file_ids
    orphan_files = file_ids - backlog_ids

    if missing_files:
        warnings.append(f"Stories sem arquivo: {', '.join(sorted(missing_files))}")
    if orphan_files:
        warnings.append(f"Arquivos orfaos: {', '.join(sorted(orphan_files))}")

    return warnings


def generate_project_status(epics: list[Epic], backlog_content: str) -> str:
    """Generate unified PROJECT_STATUS.md content."""

    total_tasks = sum(e.total for e in epics)
    done_tasks = sum(e.done for e in epics)
    global_percent = (done_tasks / total_tasks * 100) if total_tasks > 0 else 0

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    git_info = _get_git_info()

    # Next story
    next_story = _find_next_pending_story(backlog_content)
    if next_story:
        deps_info = ""
        if next_story.get("depends_on"):
            dep_statuses = _check_dependency_status(next_story["depends_on"])
            deps_parts = [f"Story {d['id']} ({'done' if d['done'] else 'pending'})" for d in dep_statuses]
            deps_info = f"\n- **Depende de:** {', '.join(deps_parts)}"

        next_story_block = (
            f"**Story {next_story['id']}:** {next_story['title']}\n"
            f"- **Agente:** {next_story.get('agent', 'unknown')}\n"
            f"- **Ferramenta:** {next_story.get('tool', 'unknown')}"
            f"{deps_info}"
        )
    else:
        if total_tasks > 0 and done_tasks >= total_tasks:
            next_story_block = "Projeto 100% finalizado!"
        else:
            next_story_block = "Nenhuma story pendente."

    # Routing alert
    routing_alert = ""
    if next_story:
        story_after = _find_story_after(backlog_content, next_story["id"])
        if story_after and story_after.get("tool") and next_story.get("tool"):
            if story_after["tool"] != next_story["tool"]:
                routing_alert = (
                    f"## Alerta de Roteamento\n"
                    f"> Proxima story apos {next_story['id']} e Story {story_after['id']} "
                    f"(agent: {story_after.get('agent', '?')}, tool: {story_after['tool']}).\n"
                    f"> Considere trocar de {next_story['tool']} para {story_after['tool']}."
                )

    # Epic table
    epic_lines = []
    for epic in epics:
        if epic.percent >= 100:
            status_icon = "done"
        elif epic.done > 0:
            status_icon = "in_progress"
        else:
            status_icon = "pending"
        epic_lines.append(
            f"| Epic {epic.num}: {epic.name} | {status_icon} | {epic.percent:.0f}% ({epic.done}/{epic.total}) |"
        )
    epic_table = "\n".join(epic_lines) if epic_lines else "| (nenhum epic) | - | - |"

    # Coverage validation warnings
    coverage_warnings = _validate_coverage(backlog_content)
    if coverage_warnings:
        routing_alert += "\n\n## Avisos de Cobertura\n"
        for w in coverage_warnings:
            routing_alert += f"> {w}\n"

    return _PROJECT_STATUS_TEMPLATE.format(
        timestamp=now,
        branch=git_info["branch"],
        progress_bar=generate_bar(global_percent),
        percent=f"{global_percent:.0f}",
        done=done_tasks,
        total=total_tasks,
        next_story_block=next_story_block,
        routing_alert=routing_alert,
        epic_table=epic_table,
        commits=git_info["commits"],
    )


def main():
    # Determine backlog path
    if len(sys.argv) > 1:
        backlog_path = Path(sys.argv[1])
    else:
        backlog_path = find_backlog()

    if not backlog_path or not backlog_path.exists():
        print("Nenhum arquivo de backlog encontrado.")
        print("   Execute /define primeiro para criar a estrutura do projeto.")
        sys.exit(1)

    print(f"Lendo: {backlog_path}")

    content = backlog_path.read_text(encoding="utf-8")
    epics = parse_backlog(content)

    if not epics:
        print("Nenhum Epic encontrado no backlog.")
        print("   Verifique se o formato esta correto (## Epic N: Nome)")
        sys.exit(1)

    # Generate unified PROJECT_STATUS.md
    status_content = generate_project_status(epics, content)
    status_path = Path("docs/PROJECT_STATUS.md")
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(status_content, encoding="utf-8")

    # Backward compat: progress-bar.md as redirect
    progress_path = Path("docs/progress-bar.md")
    progress_path.write_text(
        "# Progresso\n\n> Este arquivo foi movido. Ver [PROJECT_STATUS.md](./PROJECT_STATUS.md)\n",
        encoding="utf-8",
    )

    # Console output
    total = sum(e.total for e in epics)
    done = sum(e.done for e in epics)
    percent = (done / total * 100) if total > 0 else 0

    print()
    print(f"Progresso: {generate_bar(percent)} {percent:.0f}% ({done}/{total})")
    print()
    for epic in epics:
        status = "done" if epic.percent == 100 else "in_progress" if epic.done > 0 else "pending"
        print(f"  {status} Epic {epic.num}: {epic.name} — {epic.percent:.0f}% ({epic.done}/{epic.total})")
    print()
    print(f"Atualizado: {status_path}")


if __name__ == "__main__":
    main()
