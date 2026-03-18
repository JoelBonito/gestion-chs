#!/usr/bin/env python3
"""
Finish Task - Inove AI Framework (v2)
Marks a task as complete in BACKLOG.md AND updates the story file.

Usage:
    python3 .agents/scripts/finish_task.py <TASK_ID> [--force]
    python3 .agents/scripts/finish_task.py "1.1"
    python3 .agents/scripts/finish_task.py "Epic 1" --force

Changes (v2):
    - GUARD: Refuses to mark [x] if story file does not exist
    - Updates story file frontmatter status to 'done'
    - Injects dependency context into downstream stories
    - Triggers progress_tracker.py to update PROJECT_STATUS.md
"""

import sys
import re
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lock_manager import LockManager
from platform_compat import get_agent_source, find_backlog, find_story_file, parse_story_frontmatter
from recovery import git_checkpoint, git_rollback
from shard_epic import update_story_status, inject_dependency_context, extract_agent_workspace


def check_epic_ownership(content: str, task_id: str, agent_source: str, force: bool) -> tuple[bool, str]:
    """
    Check if the agent has permission to modify the task based on Epic ownership.

    Returns:
        (allow, message) - allow=True if can proceed, message with warning if any
    """
    clean_id = task_id.lower().replace("story", "").replace("epic", "").strip()

    epic_num_match = re.match(r'^(\d+)', clean_id)
    if not epic_num_match:
        return True, ""

    epic_num = epic_num_match.group(1)

    epic_pattern = re.compile(
        rf"^##\s+Epic\s+{epic_num}:\s+(.+?)\s*(?:\[OWNER:\s*(.+?)\])?\s*(?:[✅🔴⏳].*)?$",
        re.MULTILINE,
    )

    epic_match = epic_pattern.search(content)
    if not epic_match:
        return True, ""

    epic_owner = epic_match.group(2).strip() if epic_match.group(2) else None

    if not epic_owner:
        return True, ""

    if epic_owner == agent_source:
        return True, ""

    if force:
        return True, f"Epic {epic_num} pertence a '{epic_owner}', mas prosseguindo com --force."
    else:
        return False, f"Epic {epic_num} pertence a '{epic_owner}'. Use --force para sobrescrever."


def _is_epic_task(task_id: str) -> bool:
    """Check if task_id refers to an Epic (not a Story)."""
    clean_id = task_id.lower().strip()
    return "epic" in clean_id or "." not in clean_id


def mark_task_complete(backlog_path: Path, task_id: str, force: bool = False) -> tuple[bool, str]:
    """Mark a task as complete in the lean backlog (flip [ ] to [x])."""
    lock_mgr = LockManager()
    agent_source = get_agent_source()

    if not lock_mgr.wait_for_lock("backlog", agent_source, max_wait=30):
        return False, "BACKLOG bloqueado por outro agente. Tente novamente."

    try:
        content = backlog_path.read_text(encoding="utf-8")
    except Exception as e:
        lock_mgr.release_lock("backlog", agent_source)
        return False, f"Erro ao ler o arquivo: {e}"

    # Check ownership
    allow, ownership_msg = check_epic_ownership(content, task_id, agent_source, force)
    if not allow:
        lock_mgr.release_lock("backlog", agent_source)
        return False, ownership_msg

    clean_id = task_id.lower().replace("story", "").replace("epic", "").strip()

    # Patterns for lean and fat formats
    patterns = [
        # Lean: - [ ] Story 1.1: Title
        (rf"(-\s*\[)\s*(\]\s*Story\s+{re.escape(clean_id)}:)", r"\1x\2"),
        # Fat: - [ ] **Story 1.1:** Title
        (rf"(-\s*\[)\s*(\]\s*\*\*(?:Story|Epic)\s+{re.escape(clean_id)}:)", r"\1x\2"),
        # Fallback: - [ ] **1.1:**
        (rf"(-\s*\[)\s*(\]\s*\*\*{re.escape(clean_id)}:)", r"\1x\2"),
    ]

    new_content = content
    found = False

    for pattern, replacement in patterns:
        if re.search(pattern, new_content, re.IGNORECASE):
            new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
            found = True
            break

    if not found:
        lock_mgr.release_lock("backlog", agent_source)
        return False, f"Tarefa '{task_id}' nao encontrada ou ja concluida."

    try:
        backlog_path.write_text(new_content, encoding="utf-8")
        success_msg = f"Tarefa '{task_id}' marcada como concluida em {backlog_path.name}."
        if ownership_msg:
            success_msg = f"{ownership_msg}\n{success_msg}"
        return True, success_msg
    except Exception as e:
        return False, f"Erro ao salvar arquivo: {e}"
    finally:
        lock_mgr.release_lock("backlog", agent_source)


def _update_story_file(task_id: str) -> tuple[bool, str]:
    """Update story file frontmatter status to 'done'."""
    clean_id = task_id.lower().replace("story", "").replace("epic", "").strip()

    if update_story_status(clean_id, "done"):
        return True, f"Story file {clean_id} atualizado para 'done'."
    return False, f"Story file para {clean_id} nao encontrado (status nao atualizado)."


def _inject_downstream(task_id: str) -> list[str]:
    """Inject dependency context into stories that depend on the completed story."""
    clean_id = task_id.lower().replace("story", "").replace("epic", "").strip()
    messages = []

    # Read completed story metadata
    story_file = find_story_file(clean_id)
    if not story_file:
        return messages

    fm = parse_story_frontmatter(story_file)
    unlocks = fm.get("unlocks", [])
    if not unlocks:
        return messages

    # Get workspace summary for context injection
    workspace = extract_agent_workspace(story_file)
    title = fm.get("story", clean_id)

    # Build context line from workspace (first meaningful lines or fallback)
    if workspace and workspace != "> Notas do agente durante implementacao":
        # Extract first 2 non-empty lines as summary
        ws_lines = [l.strip() for l in workspace.split("\n") if l.strip() and not l.strip().startswith(">")]
        summary = "; ".join(ws_lines[:2]) if ws_lines else "implementada"
    else:
        summary = "implementada"
    summary = summary[:200]

    # Read the story title from the file
    content = story_file.read_text(encoding="utf-8")
    title_match = re.search(r'^# Story .+?: (.+)$', content, re.MULTILINE)
    story_title = title_match.group(1) if title_match else f"Story {clean_id}"

    context_line = f"> Story {clean_id} ({story_title}): {summary}"

    for unlock_id in unlocks:
        if isinstance(unlock_id, str):
            success = inject_dependency_context(unlock_id, context_line)
            if success:
                messages.append(f"Contexto injetado em Story {unlock_id}")

    return messages


def main():
    if len(sys.argv) < 2:
        print("Uso: python finish_task.py <TASK_ID> [--force]")
        print("Exemplo: python finish_task.py '1.1'")
        sys.exit(1)

    task_id = sys.argv[1]
    force = "--force" in sys.argv
    root = Path.cwd()

    backlog_file = find_backlog(root_path=root)
    if not backlog_file:
        print("BACKLOG.md nao encontrado.")
        sys.exit(1)

    # GUARD: Story file must exist (Codex rule)
    if not _is_epic_task(task_id):
        clean_id = task_id.lower().replace("story", "").replace("epic", "").strip()
        story_file = find_story_file(clean_id)
        if not story_file:
            print(f"Story file nao encontrado para '{clean_id}'.")
            print(f"   Crie o story file em docs/stories/ antes de marcar como completo.")
            print(f"   Execute: python3 .agents/scripts/shard_epic.py generate --story {clean_id}")
            sys.exit(1)

    # Git checkpoint
    checkpoint_label = f"finish-task-{task_id}"
    had_changes = git_checkpoint(checkpoint_label)

    # Step 1: Mark [x] in backlog
    success, message = mark_task_complete(backlog_file, task_id, force)

    if not success:
        print(f"{message}")
        if had_changes:
            git_rollback(checkpoint_label)
        sys.exit(1)

    print(f"Backlog: {message}")

    # Step 2: Update story file status
    if not _is_epic_task(task_id):
        sf_success, sf_msg = _update_story_file(task_id)
        print(f"Story: {sf_msg}")

        # Step 3: Inject downstream context
        downstream_msgs = _inject_downstream(task_id)
        for msg in downstream_msgs:
            print(f"Downstream: {msg}")

    # Step 4: Trigger progress tracker
    try:
        subprocess.run(
            [sys.executable, str(Path(__file__).parent / "progress_tracker.py")],
            check=True,
            capture_output=True,
            text=True,
        )
        print("PROJECT_STATUS.md atualizado.")
    except subprocess.CalledProcessError as e:
        print(f"Aviso: progress_tracker falhou: {e.stderr[:200] if e.stderr else 'unknown error'}")
    except FileNotFoundError:
        print("Aviso: progress_tracker.py nao encontrado.")


if __name__ == "__main__":
    main()
