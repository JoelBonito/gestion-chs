#!/usr/bin/env python3
"""
Metrics System - Inove AI Framework
Sistema de métricas e análise de produtividade.

Uso:
    python3 .agents/scripts/metrics.py collect [--days N]
    python3 .agents/scripts/metrics.py weekly
    python3 .agents/scripts/metrics.py insights

Métricas coletadas:
    - Tempo por Epic/Story
    - Velocidade (stories/semana)
    - Score de foco
    - Padrões de sessão
    - Distribuição por agente
"""

import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict
import re

sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import find_backlog, find_logs_dir


def extract_story_ids(text: str) -> List[str]:
    """Extrai IDs de Stories/Epics de texto."""
    patterns = [
        r'(?:Story|Epic)\s+(\d+(?:\.\d+)?)',
        r'(?:Story|Epic)-(\d+(?:\.\d+)?)',
        r'#(\d+\.\d+)',
    ]

    story_ids = set()
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            story_ids.add(match.group(1))

    return sorted(list(story_ids))


def parse_session_log(filepath: Path) -> List[dict]:
    """Extrai sessões de um arquivo de log."""
    content = filepath.read_text(encoding="utf-8")

    # Extrair data
    date_match = re.search(r"LOG DIÁRIO — (\d{4}-\d{2}-\d{2})", content)
    if not date_match:
        return []

    date = date_match.group(1)

    sessions = []

    # Regex para sessões
    session_pattern = re.compile(
        r"^\d+\.\s+(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})\s*\((\d{1,2}:\d{2})\)\s*(?:\[.*?([a-z_]+)\])?",
        re.MULTILINE | re.IGNORECASE
    )

    for match in session_pattern.finditer(content):
        start = match.group(1)
        end = match.group(2)
        duration_str = match.group(3)
        agent = match.group(4) if match.group(4) else "antigravity"

        # Parse duration
        dur_match = re.match(r"(\d{1,2}):(\d{2})", duration_str)
        if dur_match:
            hours, minutes = int(dur_match.group(1)), int(dur_match.group(2))
            duration_minutes = hours * 60 + minutes
        else:
            duration_minutes = 0

        # Extrair atividades
        start_pos = match.end()
        next_session = session_pattern.search(content, start_pos)
        end_pos = next_session.start() if next_session else len(content)

        section = content[start_pos:end_pos]
        activities = re.findall(r"^\s+-\s+(.+)$", section, re.MULTILINE)

        sessions.append({
            'date': date,
            'start': start,
            'end': end,
            'duration_minutes': duration_minutes,
            'agent': agent,
            'activities': activities
        })

    return sessions


def get_sessions_in_range(days_back: int = 7) -> List[dict]:
    """Obtém todas as sessões dos últimos N dias."""
    logs_dir = find_logs_dir()
    if not logs_dir:
        return []

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    all_sessions = []

    for year_dir in logs_dir.iterdir():
        if not year_dir.is_dir():
            continue

        for log_file in year_dir.glob("*.md"):
            try:
                file_date = datetime.strptime(log_file.stem, "%Y-%m-%d")
            except ValueError:
                continue

            if start_date.date() <= file_date.date() <= end_date.date():
                sessions = parse_session_log(log_file)
                all_sessions.extend(sessions)

    return sorted(all_sessions, key=lambda s: (s['date'], s['start']))


def calculate_time_per_epic(sessions: List[dict]) -> Dict[str, int]:
    """
    Calcula tempo total gasto por Epic.

    Returns:
        Dict com epic_id -> minutos totais
    """
    epic_time = defaultdict(int)

    for session in sessions:
        # Analisa atividades para identificar Epics
        for activity in session['activities']:
            story_ids = extract_story_ids(activity)

            for story_id in story_ids:
                # Extrai Epic ID (ex: "3.1" -> "Epic 3")
                epic_match = re.match(r'^(\d+)', story_id)
                if epic_match:
                    epic_id = f"Epic {epic_match.group(1)}"

                    # Divide tempo da sessão entre Epics mencionados
                    # (simplificado: assume distribuição igual)
                    epic_pattern = re.compile(r'^(\d+)')
                    unique_epics = len(set(
                        "Epic " + epic_pattern.match(sid).group(1)
                        for sid in story_ids
                        if epic_pattern.match(sid)
                    ))

                    if unique_epics > 0:
                        epic_time[epic_id] += session['duration_minutes'] // unique_epics

    return dict(epic_time)


def calculate_velocity(sessions: List[dict], backlog_path: Optional[Path]) -> Dict[str, float]:
    """
    Calcula velocidade (stories concluídas por semana).

    Returns:
        Dict com métricas de velocidade
    """
    if not backlog_path:
        return {'stories_per_week': 0.0, 'completion_rate': 0.0}

    # Conta stories concluídas mencionadas nas atividades
    completed_stories = set()

    for session in sessions:
        for activity in session['activities']:
            # Detecta conclusão
            if re.search(r'\b(?:conclu[íi]d[oa]|done|finished|✅)\b', activity, re.IGNORECASE):
                story_ids = extract_story_ids(activity)
                completed_stories.update(story_ids)

    # Calcula stories por semana
    total_days = len(set(s['date'] for s in sessions))
    weeks = total_days / 7.0 if total_days > 0 else 1

    stories_per_week = len(completed_stories) / weeks if weeks > 0 else 0

    return {
        'stories_completed': len(completed_stories),
        'stories_per_week': round(stories_per_week, 2),
        'total_weeks': round(weeks, 2)
    }


def calculate_focus_score(sessions: List[dict], epic_time: Dict[str, int]) -> float:
    """
    Calcula score de foco (% tempo em Epics prioritários).

    Assume que Epics com maior tempo são prioritários.
    """
    if not epic_time:
        return 0.0

    total_time = sum(s['duration_minutes'] for s in sessions)
    if total_time == 0:
        return 0.0

    # Considera os top 3 Epics como prioritários
    sorted_epics = sorted(epic_time.items(), key=lambda x: x[1], reverse=True)
    top_epics_time = sum(time for _, time in sorted_epics[:3])

    focus_score = (top_epics_time / total_time) * 100
    return round(focus_score, 2)


def analyze_session_patterns(sessions: List[dict]) -> Dict[str, any]:
    """
    Analisa padrões de sessão (horários produtivos, duração média, etc.).

    Returns:
        Dict com análise de padrões
    """
    if not sessions:
        return {}

    # Horários de início
    start_hours = []
    session_durations = []
    hourly_productivity = defaultdict(int)  # hora -> minutos trabalhados

    for session in sessions:
        # Parse hora de início
        start_match = re.match(r'(\d{1,2}):\d{2}', session['start'])
        if start_match:
            hour = int(start_match.group(1))
            start_hours.append(hour)
            hourly_productivity[hour] += session['duration_minutes']

        session_durations.append(session['duration_minutes'])

    # Encontra horário mais produtivo
    most_productive_hour = max(hourly_productivity.items(), key=lambda x: x[1])[0] if hourly_productivity else None

    # Duração média
    avg_duration = sum(session_durations) / len(session_durations) if session_durations else 0

    # Horário de início mais comum
    most_common_start = max(set(start_hours), key=start_hours.count) if start_hours else None

    return {
        'avg_session_duration_minutes': round(avg_duration, 2),
        'most_productive_hour': most_productive_hour,
        'most_common_start_hour': most_common_start,
        'total_sessions': len(sessions),
        'hourly_distribution': dict(hourly_productivity)
    }


def calculate_agent_distribution(sessions: List[dict]) -> Dict[str, any]:
    """
    Calcula distribuição de trabalho por agente.

    Returns:
        Dict com agente -> {sessions, minutes, percentage}
    """
    agent_stats = defaultdict(lambda: {'sessions': 0, 'minutes': 0})
    total_minutes = 0

    for session in sessions:
        agent = session['agent']
        agent_stats[agent]['sessions'] += 1
        agent_stats[agent]['minutes'] += session['duration_minutes']
        total_minutes += session['duration_minutes']

    # Calcula percentuais
    for agent, stats in agent_stats.items():
        stats['percentage'] = round((stats['minutes'] / total_minutes * 100), 2) if total_minutes > 0 else 0

    return dict(agent_stats)


def collect_metrics(days_back: int = 7) -> Dict[str, any]:
    """
    Coleta todas as métricas do período.

    Args:
        days_back: Número de dias para analisar

    Returns:
        Dict com todas as métricas
    """
    sessions = get_sessions_in_range(days_back)

    if not sessions:
        return {
            'error': 'Nenhuma sessão encontrada no período',
            'days_back': days_back
        }

    backlog = find_backlog()
    epic_time = calculate_time_per_epic(sessions)
    velocity = calculate_velocity(sessions, backlog)
    focus_score = calculate_focus_score(sessions, epic_time)
    patterns = analyze_session_patterns(sessions)
    agent_dist = calculate_agent_distribution(sessions)

    total_minutes = sum(s['duration_minutes'] for s in sessions)

    return {
        'period': {
            'days_back': days_back,
            'start_date': sessions[0]['date'],
            'end_date': sessions[-1]['date'],
            'total_sessions': len(sessions)
        },
        'time_metrics': {
            'total_minutes': total_minutes,
            'total_hours': round(total_minutes / 60, 2),
            'time_per_epic': epic_time
        },
        'velocity': velocity,
        'focus_score': focus_score,
        'session_patterns': patterns,
        'agent_distribution': agent_dist,
        'generated_at': datetime.now().isoformat()
    }


def generate_weekly_insights(metrics: Dict[str, any]) -> str:
    """Gera insights em texto baseado nas métricas."""
    if 'error' in metrics:
        return f"❌ {metrics['error']}"

    lines = [
        "# 📊 Insights Semanais de Produtividade",
        "",
        f"**Período:** {metrics['period']['start_date']} a {metrics['period']['end_date']}",
        f"**Gerado em:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "---",
        "",
        "## 🎯 Resumo Geral",
        "",
        f"- **Total de Horas:** {metrics['time_metrics']['total_hours']}h",
        f"- **Sessões:** {metrics['period']['total_sessions']}",
        f"- **Velocidade:** {metrics['velocity']['stories_per_week']} stories/semana",
        f"- **Score de Foco:** {metrics['focus_score']}%",
        "",
        "---",
        "",
        "## ⏱️ Tempo por Epic",
        ""
    ]

    if metrics['time_metrics']['time_per_epic']:
        for epic, minutes in sorted(
            metrics['time_metrics']['time_per_epic'].items(),
            key=lambda x: x[1],
            reverse=True
        ):
            hours = minutes / 60
            lines.append(f"- **{epic}:** {hours:.1f}h ({minutes} min)")
    else:
        lines.append("- Nenhum Epic rastreado no período")

    lines.extend([
        "",
        "---",
        "",
        "## 📈 Padrões de Sessão",
        ""
    ])

    patterns = metrics['session_patterns']
    if patterns.get('most_productive_hour') is not None:
        lines.append(f"- **Horário mais produtivo:** {patterns['most_productive_hour']}:00h")
    if patterns.get('most_common_start_hour') is not None:
        lines.append(f"- **Horário de início mais comum:** {patterns['most_common_start_hour']}:00h")
    if patterns.get('avg_session_duration_minutes'):
        avg_hours = patterns['avg_session_duration_minutes'] / 60
        lines.append(f"- **Duração média de sessão:** {avg_hours:.1f}h")

    lines.extend([
        "",
        "---",
        "",
        "## 🤖 Distribuição por Agente",
        ""
    ])

    for agent, stats in metrics['agent_distribution'].items():
        emoji = "🤖" if agent == "antigravity" else "🔵"
        hours = stats['minutes'] / 60
        lines.append(f"- **{emoji} {agent}:** {hours:.1f}h ({stats['percentage']}%) - {stats['sessions']} sessões")

    lines.extend([
        "",
        "---",
        "",
        "## 💡 Recomendações",
        ""
    ])

    # Gera recomendações baseadas nas métricas
    if patterns.get('most_productive_hour'):
        lines.append(f"✨ Seu horário mais produtivo é às **{patterns['most_productive_hour']}:00h**. Agende tarefas importantes para este horário.")

    if metrics['focus_score'] < 70:
        lines.append(f"⚠️ Score de foco baixo ({metrics['focus_score']}%). Considere trabalhar em menos Epics simultaneamente.")
    elif metrics['focus_score'] > 85:
        lines.append(f"✅ Excelente foco! ({metrics['focus_score']}%) Continue concentrando em poucos Epics.")

    velocity_value = metrics['velocity'].get('stories_per_week', 0)
    if velocity_value > 0:
        lines.append(f"📊 Velocidade atual: **{velocity_value} stories/semana**. Mantenha o ritmo!")

    lines.extend([
        "",
        "---",
        "",
        "*Gerado automaticamente pelo sistema de métricas*"
    ])

    return "\n".join(lines)


def save_metrics(metrics: Dict[str, any]):
    """Salva métricas em arquivo JSON."""
    metrics_dir = Path(".agents/metrics/weekly")
    metrics_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{datetime.now().strftime('%Y-%m-%d')}.json"
    filepath = metrics_dir / filename

    filepath.write_text(json.dumps(metrics, indent=2), encoding='utf-8')
    return filepath


def cmd_collect(days_back: int = 7):
    """Comando: Coleta e exibe métricas."""
    print(f"📊 Coletando métricas dos últimos {days_back} dias...\n")

    metrics = collect_metrics(days_back)

    # Salva métricas
    filepath = save_metrics(metrics)
    print(f"✅ Métricas salvas em: {filepath}\n")

    # Exibe resumo
    if 'error' not in metrics:
        print("📈 Resumo:")
        print(f"  • Total de horas: {metrics['time_metrics']['total_hours']}h")
        print(f"  • Sessões: {metrics['period']['total_sessions']}")
        print(f"  • Velocidade: {metrics['velocity']['stories_per_week']} stories/semana")
        print(f"  • Score de foco: {metrics['focus_score']}%")
    else:
        print(f"❌ {metrics['error']}")


def cmd_weekly():
    """Comando: Gera relatório semanal com insights."""
    print("📊 Gerando relatório semanal...\n")

    metrics = collect_metrics(days_back=7)
    insights = generate_weekly_insights(metrics)

    # Salva insights
    reports_dir = Path("docs/metrics")
    reports_dir.mkdir(parents=True, exist_ok=True)

    filename = f"weekly-insights-{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = reports_dir / filename

    filepath.write_text(insights, encoding='utf-8')

    # Exibe insights
    print(insights)
    print()
    print(f"✅ Relatório salvo em: {filepath}")


def cmd_insights():
    """Comando: Exibe apenas insights sem salvar."""
    metrics = collect_metrics(days_back=7)
    insights = generate_weekly_insights(metrics)
    print(insights)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  collect [--days N]  Coleta métricas dos últimos N dias (padrão: 7)")
        print("  weekly              Gera relatório semanal com insights")
        print("  insights            Exibe insights sem salvar")
        sys.exit(0)

    cmd = sys.argv[1].lower()

    if cmd == "collect":
        days_back = 7
        if "--days" in sys.argv:
            idx = sys.argv.index("--days")
            if idx + 1 < len(sys.argv):
                days_back = int(sys.argv[idx + 1])
        cmd_collect(days_back)

    elif cmd == "weekly":
        cmd_weekly()

    elif cmd == "insights":
        cmd_insights()

    else:
        print(f"❌ Comando desconhecido: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
