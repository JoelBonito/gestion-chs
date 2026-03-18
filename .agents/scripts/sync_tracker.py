#!/usr/bin/env python3
"""
Sync Tracker - Inove AI Framework
Detecta e reporta conflitos entre agentes trabalhando simultaneamente.

Uso:
    python3 .agents/scripts/sync_tracker.py
    python3 .agents/scripts/sync_tracker.py --detailed

Funcionalidades:
    - Verifica locks ativos
    - Detecta múltiplos agentes trabalhando no mesmo Epic
    - Analisa git log para edições recentes no BACKLOG
    - Gera relatório de sincronização
"""

import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional

# Importa módulos do sistema
sys.path.insert(0, str(Path(__file__).parent))
from lock_manager import LockManager
from platform_compat import find_logs_dir, get_last_activity_by_agent


def get_active_locks() -> Dict[str, dict]:
    """Obtém locks ativos no sistema."""
    lock_mgr = LockManager()
    return lock_mgr.list_active_locks()


def get_active_session() -> Optional[dict]:
    """Obtém sessão ativa atual."""
    import json
    session_file = Path(".agents/.session_state.json")

    if session_file.exists():
        try:
            session = json.loads(session_file.read_text())
            if not session.get('ended'):
                return session
        except json.JSONDecodeError:
            pass

    return None


def get_recent_backlog_commits(days_back: int = 7) -> List[dict]:
    """
    Obtém commits recentes que modificaram o BACKLOG.

    Returns:
        Lista de commits com author, date, message
    """
    try:
        result = subprocess.run(
            [
                "git", "log",
                f"--since={days_back} days ago",
                "--pretty=format:%H|%an|%ai|%s",
                "--", "docs/BACKLOG.md", "BACKLOG.md"
            ],
            capture_output=True,
            text=True,
            check=True
        )

        commits = []
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue

            parts = line.split('|', 3)
            if len(parts) == 4:
                commits.append({
                    'hash': parts[0],
                    'author': parts[1],
                    'date': parts[2],
                    'message': parts[3]
                })

        return commits

    except subprocess.CalledProcessError:
        return []


def detect_concurrent_epic_work(days_back: int = 7) -> List[dict]:
    """
    Detecta se múltiplos agentes estão trabalhando no mesmo Epic.

    Returns:
        Lista de conflitos potenciais
    """
    logs_dir = find_logs_dir()
    if not logs_dir:
        return []

    # Obtém atividades por agente
    agent_stats = get_last_activity_by_agent(logs_dir, days_back)

    # Analisa atividades para detectar Epics sobrepostos
    from metrics import extract_story_ids
    import re

    epic_work: Dict[str, List[str]] = {}  # epic_id -> [agents]

    for agent, stats in agent_stats.items():
        activities = stats.get('last_activity', '')

        # Extrai IDs de stories
        story_ids = extract_story_ids(activities)

        for story_id in story_ids:
            # Extrai Epic ID
            epic_match = re.match(r'^(\d+)', story_id)
            if epic_match:
                epic_id = f"Epic {epic_match.group(1)}"

                if epic_id not in epic_work:
                    epic_work[epic_id] = []

                if agent not in epic_work[epic_id]:
                    epic_work[epic_id].append(agent)

    # Detecta conflitos (mais de um agente no mesmo Epic)
    conflicts = []
    for epic_id, agents in epic_work.items():
        if len(agents) > 1:
            conflicts.append({
                'epic': epic_id,
                'agents': agents,
                'severity': 'warning'
            })

    return conflicts


def generate_sync_report(detailed: bool = False) -> str:
    """
    Gera relatório de sincronização.

    Args:
        detailed: Se True, inclui informações detalhadas

    Returns:
        Relatório formatado em markdown
    """
    lines = [
        "# 🔄 Sync Status",
        "",
    ]

    # 1. Sessão ativa
    active_session = get_active_session()

    if active_session:
        agent = active_session['agent']
        emoji = "🤖" if agent == "antigravity" else "🔵"
        start_time = active_session['start_time']

        # Calcula duração
        start_dt = datetime.fromisoformat(active_session['start_datetime'])
        duration = datetime.now() - start_dt
        hours = int(duration.total_seconds() / 3600)
        minutes = int((duration.total_seconds() % 3600) / 60)

        lines.extend([
            "## 📝 Sessão Ativa",
            "",
            f"- **Agente:** {emoji} {agent}",
            f"- **Início:** {start_time}",
            f"- **Duração:** {hours:02d}:{minutes:02d}",
            "",
        ])
    else:
        lines.extend([
            "## 📝 Sessão Ativa",
            "",
            "Nenhuma sessão ativa no momento.",
            "",
        ])

    # 2. Atividades recentes por agente
    logs_dir = find_logs_dir()

    if logs_dir:
        agent_stats = get_last_activity_by_agent(logs_dir, days_back=7)

        if agent_stats:
            lines.extend([
                "## 📊 Atividades da Semana",
                "",
                "| Agente | Última Atividade | Tempo Esta Semana | Sessões |",
                "|--------|------------------|-------------------|---------|",
            ])

            for agent, stats in sorted(agent_stats.items()):
                emoji = "🤖" if agent == "antigravity" else "🔵"
                last_session = stats['last_session']
                last_activity = stats['last_activity'][:50]  # Trunca para caber na tabela

                total_time = stats['total_time_week']
                hours = total_time // 60
                minutes = total_time % 60
                time_str = f"{hours:02d}:{minutes:02d}"

                date_time = f"{last_session.date} {last_session.start}"

                lines.append(
                    f"| {emoji} **{agent}** | {date_time}<br/>*{last_activity}* | {time_str} | {stats['sessions_count']} |"
                )

            lines.append("")

    # 3. Locks ativos
    active_locks = get_active_locks()

    if active_locks:
        lines.extend([
            "## 🔒 Locks Ativos",
            "",
        ])

        for resource, lock_info in active_locks.items():
            locked_by = lock_info['locked_by']
            emoji = "🤖" if locked_by == "antigravity" else "🔵"
            locked_at = datetime.fromisoformat(lock_info['locked_at'])
            elapsed = datetime.now() - locked_at
            minutes_ago = int(elapsed.total_seconds() / 60)

            lines.append(f"- **{resource}** bloqueado por {emoji} {locked_by} (há {minutes_ago} min)")

        lines.append("")

    # 4. Conflitos detectados
    conflicts = detect_concurrent_epic_work(days_back=7)

    if conflicts:
        lines.extend([
            "## ⚠️ Conflitos Potenciais",
            "",
        ])

        for conflict in conflicts:
            epic = conflict['epic']
            agents = conflict['agents']

            agents_str = ", ".join([
                f"{'🤖' if a == 'antigravity' else '🔵'} {a}"
                for a in agents
            ])

            lines.append(f"- **{epic}:** Múltiplos agentes ({agents_str})")

        lines.append("")
    else:
        lines.extend([
            "## ✅ Conflitos",
            "",
            "Nenhum conflito detectado.",
            "",
        ])

    # 5. Commits recentes no BACKLOG (se detailed)
    if detailed:
        recent_commits = get_recent_backlog_commits(days_back=7)

        if recent_commits:
            lines.extend([
                "## 📝 Commits Recentes no BACKLOG",
                "",
            ])

            for commit in recent_commits[:5]:  # Limita a 5
                date = commit['date'][:10]  # YYYY-MM-DD
                author = commit['author']
                message = commit['message'][:60]  # Trunca

                lines.append(f"- **{date}** - {author}: {message}")

            lines.append("")

    # Timestamp
    lines.extend([
        "---",
        f"*Atualizado em {datetime.now().strftime('%Y-%m-%d %H:%M')}*"
    ])

    return "\n".join(lines)


def cmd_report(detailed: bool = False):
    """Comando: Gera e exibe relatório de sincronização."""
    report = generate_sync_report(detailed)
    print(report)


def cmd_check_conflicts():
    """Comando: Verifica apenas conflitos."""
    conflicts = detect_concurrent_epic_work(days_back=7)

    if not conflicts:
        print("✅ Nenhum conflito detectado.")
        return

    print("⚠️ Conflitos potenciais detectados:\n")
    for conflict in conflicts:
        epic = conflict['epic']
        agents = conflict['agents']

        agents_str = ", ".join([
            f"{'🤖' if a == 'antigravity' else '🔵'} {a}"
            for a in agents
        ])

        print(f"  • {epic}: {agents_str}")


def cmd_locks():
    """Comando: Lista locks ativos."""
    locks = get_active_locks()

    if not locks:
        print("📭 Nenhum lock ativo.")
        return

    print("🔒 Locks ativos:\n")
    for resource, lock_info in locks.items():
        locked_by = lock_info['locked_by']
        emoji = "🤖" if locked_by == "antigravity" else "🔵"
        locked_at = datetime.fromisoformat(lock_info['locked_at'])
        elapsed = datetime.now() - locked_at
        minutes_ago = int(elapsed.total_seconds() / 60)

        print(f"  • {resource}")
        print(f"    Bloqueado por: {emoji} {locked_by}")
        print(f"    Há {minutes_ago} minuto(s)")
        print()


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ["-h", "--help"]:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  (sem argumentos)   Gera relatório de sincronização")
        print("  --detailed         Gera relatório detalhado com commits")
        print("  --check-conflicts  Verifica apenas conflitos")
        print("  --locks            Lista locks ativos")
        sys.exit(0)

    detailed = "--detailed" in sys.argv

    if "--check-conflicts" in sys.argv:
        cmd_check_conflicts()
    elif "--locks" in sys.argv:
        cmd_locks()
    else:
        cmd_report(detailed)


if __name__ == "__main__":
    main()
