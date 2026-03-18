#!/usr/bin/env python3
"""
Dashboard Unificado - Inove AI Framework
Combina progresso, sessões e métricas em uma única visualização.

Uso:
    python3 .agents/scripts/dashboard.py
"""

import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

# Importar módulos necessários
sys.path.insert(0, str(Path(__file__).parent))
import progress_tracker
import auto_session
from lock_manager import LockManager
from platform_compat import find_logs_dir, get_logs_in_range, get_last_activity_by_agent, ensure_docs_structure


def format_duration(minutes: int) -> str:
    """Formata minutos em HH:MM."""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}h {mins:02d}m"


def load_current_session() -> Optional[dict]:
    """Carrega informações da sessão atual."""
    session = auto_session.load_session()

    if not session or session.get("ended"):
        return None

    # Calcula tempo decorrido
    start = datetime.fromisoformat(session["start_datetime"])
    elapsed = datetime.now() - start
    hours, remainder = divmod(int(elapsed.total_seconds()), 3600)
    minutes = remainder // 60

    return {
        "start": session["start_time"],
        "elapsed": f"{hours:02d}h {minutes:02d}m",
        "agent": session["agent"],
        "project": session.get("project", "Unknown"),
    }


def load_progress() -> dict:
    """Carrega dados de progresso do projeto."""
    backlog_path = progress_tracker.find_backlog()

    if not backlog_path or not backlog_path.exists():
        return {
            "bar": "N/A",
            "percent": 0,
            "done": 0,
            "total": 0,
            "next_tasks": []
        }

    content = backlog_path.read_text(encoding="utf-8")
    epics = progress_tracker.parse_backlog(content)

    if not epics:
        return {
            "bar": "N/A",
            "percent": 0,
            "done": 0,
            "total": 0,
            "next_tasks": []
        }

    total = sum(e.total for e in epics)
    done = sum(e.done for e in epics)
    percent = (done / total * 100) if total > 0 else 0

    # Encontra próximas tarefas (primeiros 3 Epics não completos)
    next_tasks = []
    for epic in epics:
        if epic.percent < 100:
            owner_text = ""
            if epic.owner:
                owner_emoji = "🤖" if epic.owner == "antigravity" else "🔵"
                owner_text = f" [{owner_emoji} {epic.owner}]"
            next_tasks.append(f"{epic.name}{owner_text}")
            if len(next_tasks) >= 3:
                break

    return {
        "bar": progress_tracker.generate_bar(percent),
        "percent": percent,
        "done": done,
        "total": total,
        "next_tasks": next_tasks,
        "epics": epics
    }


def load_weekly_stats() -> dict:
    """Carrega estatísticas da semana."""
    logs_dir = find_logs_dir()

    if not logs_dir:
        return {
            "total_time": "00h 00m",
            "sessions": 0,
            "avg_per_day": "00h 00m"
        }

    # Últimos 7 dias
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    sessions = get_logs_in_range(logs_dir, start_date, end_date)

    if not sessions:
        return {
            "total_time": "00h 00m",
            "sessions": 0,
            "avg_per_day": "00h 00m"
        }

    total_minutes = sum(s.duration_minutes for s in sessions)
    avg_per_day = total_minutes // 7

    return {
        "total_time": format_duration(total_minutes),
        "sessions": len(sessions),
        "avg_per_day": format_duration(avg_per_day)
    }


def load_sync_status() -> dict:
    """Carrega status de sincronização dos agentes."""
    logs_dir = find_logs_dir()

    if not logs_dir:
        return {}

    try:
        agent_stats = get_last_activity_by_agent(logs_dir, days_back=7)
    except Exception:
        return {}

    # Detecta conflitos (locks ativos)
    lock_mgr = LockManager()
    active_locks = lock_mgr.list_active_locks()

    conflicts = []
    if active_locks:
        for resource, lock_info in active_locks.items():
            locked_by = lock_info['locked_by']
            locked_at = datetime.fromisoformat(lock_info['locked_at'])
            elapsed = datetime.now() - locked_at
            minutes = int(elapsed.total_seconds() / 60)
            conflicts.append(f"⚠️ {resource} bloqueado por {locked_by} há {minutes} min")

    return {
        "agents": agent_stats,
        "conflicts": conflicts
    }


def format_next_tasks(tasks: list) -> str:
    """Formata lista de próximas tarefas."""
    if not tasks:
        return "Nenhuma tarefa pendente"

    return "\n".join([f"{i+1}. {task}" for i, task in enumerate(tasks)])


def generate_dashboard() -> str:
    """Gera dashboard consolidado."""

    # 0. Detect docs structure (never creates — detect only)
    bootstrap = ensure_docs_structure(create_if_missing=False)
    if bootstrap["missing"]:
        for m in bootstrap["missing"]:
            print(f"   Aviso: {m} ausente. Use 'auto_session.py start' para criar baseline.")

    # 1. Carregar dados
    progress = load_progress()
    session = load_current_session()
    weekly = load_weekly_stats()
    sync = load_sync_status()

    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    # 2. Construir output
    lines = [
        f"# 📊 Dashboard - {now}",
        "",
        "## 🎯 Progresso do Projeto",
        "",
        f"{progress['bar']} {progress['percent']:.1f}%",
        f"Tarefas: {progress['done']}/{progress['total']}",
        "",
    ]

    # Sessão atual
    lines.extend([
        "## ⏱️ Sessão Atual",
        "",
    ])

    if session:
        agent_emoji = "🤖" if session['agent'] == "antigravity" else "🔵"
        lines.extend([
            f"🟢 Ativa desde {session['start']} ({session['elapsed']} decorridos)",
            f"   {agent_emoji} Agente: {session['agent']}",
            f"   📁 Projeto: {session['project']}",
        ])
    else:
        lines.append("🔴 Nenhuma sessão ativa")
        lines.append("   💡 Use: python3 .agents/scripts/auto_session.py start")

    lines.extend(["", ""])

    # Estatísticas da semana
    lines.extend([
        "## 📅 Esta Semana (últimos 7 dias)",
        "",
        f"- Tempo total: {weekly['total_time']}",
        f"- Sessões: {weekly['sessions']}",
        f"- Média/dia: {weekly['avg_per_day']}",
        "",
    ])

    # Sync Status (se houver múltiplos agentes)
    if sync.get('agents') and len(sync['agents']) > 1:
        lines.extend([
            "## 🔄 Sync Status (Dual-Agent)",
            "",
            "| Agente | Última Atividade | Tempo (7 dias) | Sessões |",
            "|--------|------------------|----------------|---------|",
        ])

        for agent_name, stats in sync['agents'].items():
            agent_emoji = "🤖" if agent_name == "antigravity" else "🔵"
            last_session = stats['last_session']
            last_activity = stats['last_activity'][:50] + "..." if len(stats['last_activity']) > 50 else stats['last_activity']
            time_str = format_duration(stats['total_time_week'])

            lines.append(
                f"| {agent_emoji} {agent_name} | "
                f"{last_session.date} {last_session.start}<br/>*{last_activity}* | "
                f"{time_str} | "
                f"{stats['sessions_count']} |"
            )

        lines.extend(["", ""])

        # Conflitos
        if sync.get('conflicts'):
            lines.extend([
                "**Conflitos Detectados:**",
                ""
            ])
            for conflict in sync['conflicts']:
                lines.append(f"- {conflict}")
        else:
            lines.append("**Conflitos:** Nenhum ✅")

        lines.extend(["", ""])

    # Próximas tarefas
    if progress['next_tasks']:
        lines.extend([
            "## 🔥 Próximas Tarefas",
            "",
            format_next_tasks(progress['next_tasks']),
            "",
        ])

    # Rodapé
    lines.extend([
        "---",
        "",
        "**Comandos disponíveis:**",
        "- `python3 .agents/scripts/auto_session.py start` - Iniciar sessão",
        "- `python3 .agents/scripts/auto_session.py end` - Encerrar sessão",
        "- `python3 .agents/scripts/finish_task.py <id>` - Marcar tarefa como concluída",
        "- `python3 .agents/scripts/progress_tracker.py` - Atualizar progresso",
        "- `python3 .agents/scripts/lock_manager.py list` - Ver locks ativos",
    ])

    return "\n".join(lines)


def main():
    """Executa o dashboard."""
    try:
        output = generate_dashboard()
        print(output)
        print()

        # Salva em arquivo opcional
        output_path = Path("docs/dashboard.md")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")

        print(f"✅ Dashboard salvo em: {output_path}")

    except Exception as e:
        print(f"❌ Erro ao gerar dashboard: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
