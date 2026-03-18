#!/usr/bin/env python3
"""
Auto-Finish - Inove AI Framework
Detecta automaticamente conclusão de tarefas e atualiza o BACKLOG.

Uso:
    python3 .agents/scripts/auto_finish.py [--check-context] [--commit-msg "message"]
    python3 .agents/scripts/auto_finish.py --suggest

Funcionalidades:
    - Detecta padrões de conclusão (palavras-chave, commits)
    - Cruza com BACKLOG.md para identificar Story/Epic
    - Auto-executa finish_task.py quando apropriado
    - Sugere tarefas candidatas a conclusão
"""

import os
import re
import sys
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple

# Ensure the scripts directory is in sys.path for sibling imports
sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import get_agent_source, find_backlog


def extract_task_ids_from_text(text: str) -> List[str]:
    """
    Extrai IDs de tarefas mencionadas em texto.

    Formatos reconhecidos:
        - Story 3.1
        - Epic 2
        - Task 3.1
        - #3.1
        - feat(Story-3.1)
    """
    patterns = [
        r'(?:Story|Epic|Task)\s+(\d+(?:\.\d+)?)',  # Story 3.1, Epic 2
        r'(?:Story|Epic|Task)-(\d+(?:\.\d+)?)',     # Story-3.1
        r'#(\d+\.\d+)',                             # #3.1
        r'\((\d+\.\d+)\)',                          # (3.1)
    ]

    task_ids = set()
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            task_ids.add(match.group(1))

    return sorted(list(task_ids))


def detect_completion_keywords(text: str) -> bool:
    """
    Detecta palavras-chave que indicam conclusão.

    Palavras-chave: Pronto, Feito, Implementado, Completado, Done, Finished
    """
    keywords = [
        r'\b(?:pronto|feito|implementado|completado|concluído)\b',
        r'\b(?:done|finished|completed|implemented)\b',
        r'✅',
        r'\b(?:fix|feat|complete):\s',  # Conventional commits
    ]

    text_lower = text.lower()
    for pattern in keywords:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False


def get_recent_commit_messages(count: int = 1) -> List[str]:
    """Obtém mensagens dos commits recentes."""
    try:
        result = subprocess.run(
            ["git", "log", f"-{count}", "--pretty=%B"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split('\n\n')
    except subprocess.CalledProcessError:
        return []


def get_pending_tasks(backlog_path: Path) -> List[Tuple[str, str]]:
    """
    Obtém lista de tarefas pendentes do BACKLOG.

    Returns:
        Lista de tuplas (task_id, task_title)
    """
    content = backlog_path.read_text(encoding='utf-8')

    # Regex para tarefas pendentes: "- [ ] **Story X.X:** Título"
    pattern = re.compile(
        r'-\s*\[\s*\]\s*\*\*(?:Story|Epic)\s+(\d+(?:\.\d+)?):\*\*\s*(.+?)(?:\n|$)',
        re.IGNORECASE
    )

    tasks = []
    for match in pattern.finditer(content):
        task_id = match.group(1)
        task_title = match.group(2).strip()
        tasks.append((task_id, task_title))

    return tasks


def suggest_completion_candidates(
    mentioned_ids: List[str],
    pending_tasks: List[Tuple[str, str]]
) -> List[Tuple[str, str]]:
    """
    Sugere tarefas candidatas a conclusão baseado em IDs mencionados.

    Args:
        mentioned_ids: IDs extraídos de commits/contexto
        pending_tasks: Lista de tarefas pendentes

    Returns:
        Lista de tarefas candidatas (task_id, task_title)
    """
    candidates = []
    pending_ids = {task_id for task_id, _ in pending_tasks}

    for mentioned_id in mentioned_ids:
        if mentioned_id in pending_ids:
            # Encontra a tarefa correspondente
            for task_id, task_title in pending_tasks:
                if task_id == mentioned_id:
                    candidates.append((task_id, task_title))
                    break

    return candidates


def mark_task_as_done(task_id: str, force: bool = False) -> bool:
    """
    Marca uma tarefa como concluída usando finish_task.py.

    Args:
        task_id: ID da tarefa (ex: "3.1")
        force: Força conclusão mesmo com aviso de ownership

    Returns:
        True se sucesso, False caso contrário
    """
    script_dir = Path(__file__).parent
    finish_script = script_dir / "finish_task.py"

    if not finish_script.exists():
        print(f"⚠️ Script finish_task.py não encontrado em {script_dir}")
        return False

    cmd = [sys.executable, str(finish_script), task_id]
    if force:
        cmd.append("--force")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(result.stdout)
            return True
        else:
            print(result.stderr or result.stdout)
            return False
    except Exception as e:
        print(f"❌ Erro ao executar finish_task.py: {e}")
        return False


def update_progress() -> Optional[str]:
    """
    Atualiza a barra de progresso usando progress_tracker.py.

    Returns:
        Output do progress_tracker ou None se falhar
    """
    script_dir = Path(__file__).parent
    tracker_script = script_dir / "progress_tracker.py"

    if not tracker_script.exists():
        return None

    try:
        result = subprocess.run(
            [sys.executable, str(tracker_script)],
            capture_output=True,
            text=True
        )
        return result.stdout
    except Exception:
        return None


def cmd_suggest():
    """Comando: Sugere tarefas candidatas a conclusão."""
    backlog = find_backlog()
    if not backlog:
        print("❌ BACKLOG.md não encontrado.")
        sys.exit(1)

    # Obtém commits recentes
    recent_commits = get_recent_commit_messages(count=5)

    # Extrai IDs mencionados
    all_mentioned = set()
    for commit_msg in recent_commits:
        task_ids = extract_task_ids_from_text(commit_msg)
        all_mentioned.update(task_ids)

    # Obtém tarefas pendentes
    pending_tasks = get_pending_tasks(backlog)

    # Sugere candidatos
    candidates = suggest_completion_candidates(list(all_mentioned), pending_tasks)

    if not candidates:
        print("📭 Nenhuma tarefa candidata a conclusão detectada.")
        print()
        print("💡 Dica: Mencione o ID da tarefa nos commits (ex: 'feat(Story-3.1): ...')")
        sys.exit(0)

    print("🔍 Tarefas candidatas a conclusão:")
    print()
    for task_id, task_title in candidates:
        print(f"  • Story {task_id}: {task_title}")
    print()
    print("💡 Use: python auto_finish.py --mark <task_id>")


def cmd_check_context(assume_yes: bool = False):
    """Comando: Verifica contexto atual e sugere auto-conclusão."""
    backlog = find_backlog()
    if not backlog:
        print("❌ BACKLOG.md não encontrado.")
        sys.exit(1)

    # Verifica último commit
    recent_commits = get_recent_commit_messages(count=1)

    if not recent_commits or not recent_commits[0]:
        print("📭 Nenhum commit recente encontrado.")
        sys.exit(0)

    last_commit = recent_commits[0]

    # Detecta conclusão
    has_completion = detect_completion_keywords(last_commit)
    mentioned_ids = extract_task_ids_from_text(last_commit)

    if not has_completion or not mentioned_ids:
        print("📭 Nenhum padrão de conclusão detectado no último commit.")
        print()
        print("💡 Use palavras-chave: 'Pronto', 'Feito', 'Implementado', '✅'")
        sys.exit(0)

    # Obtém tarefas pendentes
    pending_tasks = get_pending_tasks(backlog)
    candidates = suggest_completion_candidates(mentioned_ids, pending_tasks)

    if not candidates:
        print("⚠️ IDs mencionados não correspondem a tarefas pendentes.")
        sys.exit(0)

    print("✨ Conclusão detectada!")
    print()
    print(f"📝 Commit: {last_commit[:60]}...")
    print()
    print("🎯 Tarefas detectadas:")
    for task_id, task_title in candidates:
        print(f"  • Story {task_id}: {task_title}")
    print()

    # Pergunta se deve marcar automaticamente
    if assume_yes:
        print("⚡ Modo não-interativo: Auto-confirmando marcação.")
        response = 's'
    else:
        response = input("Marcar como concluída? (s/N): ").strip().lower()

    if response == 's':
        for task_id, _ in candidates:
            if mark_task_as_done(task_id):
                print(f"✅ Story {task_id} marcada como concluída!")

        # Atualiza progresso
        print()
        print("📊 Atualizando progresso...")
        progress_output = update_progress()
        if progress_output:
            print(progress_output)


def cmd_mark(task_id: str, force: bool = False):
    """Comando: Marca uma tarefa específica como concluída."""
    if mark_task_as_done(task_id, force):
        print()
        print("📊 Atualizando progresso...")
        progress_output = update_progress()
        if progress_output:
            print(progress_output)
    else:
        sys.exit(1)


def cmd_commit_msg(commit_msg: str):
    """Comando: Analisa mensagem de commit e auto-completa se apropriado."""
    # Detecta conclusão
    has_completion = detect_completion_keywords(commit_msg)
    mentioned_ids = extract_task_ids_from_text(commit_msg)

    if not has_completion or not mentioned_ids:
        sys.exit(0)  # Silenciosamente não faz nada

    backlog = find_backlog()
    if not backlog:
        sys.exit(0)

    # Obtém tarefas pendentes
    pending_tasks = get_pending_tasks(backlog)
    candidates = suggest_completion_candidates(mentioned_ids, pending_tasks)

    if not candidates:
        sys.exit(0)

    # Auto-marca (sem perguntar, já que foi chamado via hook)
    for task_id, task_title in candidates:
        print(f"🔄 Auto-finish detectado: Story {task_id}")
        if mark_task_as_done(task_id, force=False):
            print(f"✅ Story {task_id} marcada como concluída automaticamente!")

    # Atualiza progresso
    update_progress()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  --suggest           Sugere tarefas candidatas baseado em commits recentes")
        print("  --check-context     Verifica último commit e sugere auto-conclusão")
        print("  --mark <task_id>    Marca tarefa específica como concluída")
        print("  --commit-msg <msg>  Analisa mensagem de commit (para uso em hooks)")
        print()
        print("Opções:")
        print("  --force             Força marcação mesmo com aviso de ownership")
        print("  --yes               Auto-confirma prompts (para uso não-interativo)")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    force = "--force" in sys.argv
    assume_yes = "--yes" in sys.argv

    if cmd == "--suggest":
        cmd_suggest()

    elif cmd == "--check-context":
        cmd_check_context(assume_yes)

    elif cmd == "--mark":
        if len(sys.argv) < 3:
            print("❌ Uso: auto_finish.py --mark <task_id>")
            sys.exit(1)
        task_id = sys.argv[2]
        cmd_mark(task_id, force)

    elif cmd == "--commit-msg":
        if len(sys.argv) < 3:
            print("❌ Uso: auto_finish.py --commit-msg <message>")
            sys.exit(1)
        commit_msg = " ".join(sys.argv[2:])
        cmd_commit_msg(commit_msg)

    else:
        print(f"❌ Comando desconhecido: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
