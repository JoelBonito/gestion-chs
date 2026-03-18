#!/usr/bin/env python3
"""
Auto Session Manager - Inove AI Framework
Gerencia sessoes automaticamente com deteccao inteligente.

Uso:
    python3 .agents/scripts/auto_session.py start [--agent antigravity|claude_code] [--no-bootstrap]
    python3 .agents/scripts/auto_session.py end [--quick] [--activities "..."]
    python3 .agents/scripts/auto_session.py status
"""

import os
import re
import sys
import json
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import get_agent_source, find_logs_dir, ensure_docs_structure

SESSION_PATHS = [
    Path(".agents/.session_state.json"),
    Path("docs/.session_state.json"),
]


def _session_paths():
    """Retorna paths de sessao em ordem de prioridade."""
    return SESSION_PATHS


def load_session():
    """Carrega estado da sessao atual (tenta todos os paths)."""
    for path in _session_paths():
        if path.exists():
            try:
                return json.loads(path.read_text())
            except json.JSONDecodeError:
                continue
    return None


def save_session(data):
    """Salva estado da sessao (fallback se sem permissao)."""
    for path in _session_paths():
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, indent=2))
            return
        except PermissionError:
            continue
    print("   Erro: sem permissao para gravar sessao em nenhum path.")


def clear_session():
    """Limpa sessao atual (remove de todos os paths)."""
    for path in _session_paths():
        if path.exists():
            try:
                path.unlink()
            except PermissionError:
                pass


def get_project_name() -> str:
    """Detecta o nome do projeto a partir do diretorio."""
    return Path.cwd().name


def _agent_badge(agent: str) -> str:
    """Returns the badge string for a given agent."""
    if agent == "antigravity":
        return "\U0001f916 antigravity"
    return f"\U0001f535 {agent}"


def _parse_sessions(content: str) -> list:
    """
    Parses all session entries from the log content.

    Returns a list of dicts with keys:
        number, start, end (or None), duration (or None), badge, activities
    """
    sessions = []

    # Match both completed and in-progress sessions
    # Completed: 1. 14:30 -- 15:45 (01:15) [badge]
    # In progress: 2. 16:00 -- *(em andamento)* [badge]
    entry_pattern = re.compile(
        r'^(\d+)\.\s+'
        '(\\d{1,2}:\\d{2})\\s+\u2014\\s+'
        r'(?:(\d{1,2}:\d{2})\s+\((\d{2}:\d{2})\)|'
        r'\*\(em andamento\)\*)'
        r'\s+\[(.+?)\]',
        re.MULTILINE
    )

    for match in entry_pattern.finditer(content):
        number = int(match.group(1))
        start = match.group(2)
        end = match.group(3)  # None if in progress
        duration = match.group(4)  # None if in progress
        badge = match.group(5)

        # Extract activities block following this entry
        entry_end = match.end()
        next_entry = entry_pattern.search(content, entry_end)
        # Also stop before "## Resumo do Dia"
        resumo_match = re.search(r'^## Resumo do Dia', content[entry_end:], re.MULTILINE)

        if next_entry:
            block_end = next_entry.start()
        elif resumo_match:
            block_end = entry_end + resumo_match.start()
        else:
            block_end = len(content)

        activities_block = content[entry_end:block_end]
        activities = []
        for line in activities_block.split('\n'):
            stripped = line.strip()
            if stripped.startswith('- ') and stripped != '- Atividades:':
                activity = stripped[2:].strip()
                if activity:
                    activities.append(activity)

        sessions.append({
            'number': number,
            'start': start,
            'end': end,
            'duration': duration,
            'badge': badge,
            'activities': activities
        })

    return sessions


def _build_resumo(sessions: list) -> str:
    """
    Builds the 'Resumo do Dia' section from parsed sessions.

    Only completed sessions (with end time and duration) contribute
    to the summary.
    """
    completed = [s for s in sessions if s['end'] is not None]
    if not completed:
        return ""

    all_starts = [s['start'] for s in sessions]
    all_ends = [s['end'] for s in completed]

    earliest = min(all_starts)
    latest = max(all_ends)

    total_minutes = 0
    for s in completed:
        if s['duration']:
            parts = s['duration'].split(':')
            total_minutes += int(parts[0]) * 60 + int(parts[1])

    total_h = total_minutes // 60
    total_m = total_minutes % 60

    lines = [
        "",
        "## Resumo do Dia",
        f"- Inicio do dia: {earliest}",
        f"- Fim do dia: {latest}",
        f"- Tempo total: {total_h:02d}:{total_m:02d}",
        ""
    ]
    return '\n'.join(lines)


def update_daily_log_start(session: dict):
    """Atualiza o log diario com inicio de sessao."""
    logs_dir = find_logs_dir(auto_create=True)
    year_dir = logs_dir / session['date'][:4]
    year_dir.mkdir(parents=True, exist_ok=True)

    log_file = year_dir / f"{session['date']}.md"

    badge = _agent_badge(session['agent'])

    if log_file.exists():
        content = log_file.read_text(encoding='utf-8')

        # Remove existing "Resumo do Dia" section (will be rebuilt on end)
        content = re.sub(
            r'\n## Resumo do Dia\n.*',
            '',
            content,
            flags=re.DOTALL
        )

        # Find next session number
        session_numbers = re.findall(r'^(\d+)\.\s+\d{1,2}:\d{2}', content, re.MULTILINE)
        next_number = max([int(n) for n in session_numbers], default=0) + 1

        # Strip trailing whitespace
        content = content.rstrip('\n')

        new_entry = (
            f"\n\n{next_number}. {session['start_time']}"
            f" \u2014 *(em andamento)* [{badge}]\n"
            f"   - Atividades:\n"
            f"     - *(sessao ativa)*\n"
        )
        content += new_entry

    else:
        content = (
            f"# LOG DI\u00c1RIO \u2014 {session['date']}\n"
            f"- Projeto: {session['project']}\n"
            f"- Fuso: America/Sao_Paulo\n"
            f"\n"
            f"## Sessoes\n"
            f"\n"
            f"1. {session['start_time']}"
            f" \u2014 *(em andamento)* [{badge}]\n"
            f"   - Atividades:\n"
            f"     - *(sessao ativa)*\n"
        )

    log_file.write_text(content, encoding='utf-8')


def update_daily_log_end(session: dict):
    """Atualiza o log diario com fim de sessao e gera Resumo do Dia."""
    logs_dir = find_logs_dir(auto_create=True)
    year_dir = logs_dir / session['date'][:4]
    log_file = year_dir / f"{session['date']}.md"

    if not log_file.exists():
        print(f"Arquivo de log nao encontrado: {log_file}")
        return

    content = log_file.read_text(encoding='utf-8')

    badge = _agent_badge(session['agent'])

    # Remove existing "Resumo do Dia" section before editing
    content = re.sub(
        r'\n## Resumo do Dia\n.*',
        '',
        content,
        flags=re.DOTALL
    )

    # Build pattern to find the in-progress session entry
    escaped_badge = re.escape(badge)
    pattern = (
        rf'(\d+\.\s+{re.escape(session["start_time"])})'
        '\\s+\u2014\\s+\\*\\(em andamento\\)\\*'
        rf'\s+\[{escaped_badge}\]'
        r'\s+- Atividades:\s+- \*\(sess[aã]o ativa\)\*'
    )

    if re.search(pattern, content):
        activities_list = session.get('activities', ['Nenhuma atividade registrada'])
        activities_text = "\n     - ".join(activities_list)

        replacement = (
            f'\\1 \u2014 {session["end_time"]}'
            f' ({session["duration"]}) [{badge}]\n'
            f'   - Atividades:\n'
            f'     - {activities_text}'
        )

        content = re.sub(pattern, replacement, content)
    else:
        print(f"Sessao iniciada as {session['start_time']} nao encontrada no log")
        return

    # Parse all sessions and build Resumo do Dia
    parsed = _parse_sessions(content)
    resumo = _build_resumo(parsed)

    # Fetch progress tracking data
    try:
        from progress_tracker import find_backlog, parse_backlog
        backlog_path = find_backlog()
        if backlog_path and backlog_path.exists():
            backlog_content = backlog_path.read_text(encoding="utf-8")
            epics = parse_backlog(backlog_content)
            
            total = sum(e.total for e in epics)
            done = sum(e.done for e in epics)
            percent = (done / total * 100) if total > 0 else 0
            
            # Inject Burn-down into the Resumo do Dia
            if resumo:
                # Insert the velocity metric right before the end
                resumo_lines = resumo.split('\n')
                # Find the location of "- Tempo total: "
                for i, line in enumerate(resumo_lines):
                    if line.startswith("- Tempo total: "):
                        resumo_lines.insert(i + 1, f"- Velocidade Atual (Burn-down): {percent:.1f}%")
                        break
                resumo = '\n'.join(resumo_lines)
    except Exception as e:
        # Silently fail or log to keep zero-breakage parity for Claude Code
        print(f"Nota: Não foi possível anexar o Burn-down ao Log: {e}")

    content = content.rstrip('\n') + '\n'
    if resumo:
        content += resumo

    log_file.write_text(content, encoding='utf-8')


def start_session(agent_override: str = None, bootstrap: bool = True) -> bool:
    """Inicia nova sessao."""
    existing = load_session()
    if existing and not existing.get("ended"):
        print(f"Sessao ja em andamento desde {existing['start_time']}")
        print(f"   Agente: {existing['agent']}")
        print(f"   Use 'auto_session.py status' para ver detalhes")
        return False

    # Bootstrap: ensure docs baseline exists
    if bootstrap:
        result = ensure_docs_structure(create_if_missing=True)
        if result["created"]:
            for path in result["created"]:
                print(f"   Bootstrap: criado {path}")
        for warning in result["warnings"]:
            print(f"   Bootstrap: {warning}")

    now = datetime.now()
    agent = agent_override if agent_override else get_agent_source()

    session = {
        "start_time": now.strftime("%H:%M"),
        "start_datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "agent": agent,
        "project": get_project_name(),
        "ended": False,
        "activities": []
    }
    save_session(session)

    update_daily_log_start(session)

    badge = _agent_badge(agent)
    print(f"Sessao iniciada as {session['start_time']}")
    print(f"   [{badge}]")
    print(f"   Projeto: {session['project']}")
    return True


def end_session(activities: str = None, quick: bool = False) -> bool:
    """Encerra sessao atual."""
    session = load_session()
    if not session or session.get("ended"):
        print("Nenhuma sessao ativa para encerrar.")
        return False

    now = datetime.now()
    session["end_time"] = now.strftime("%H:%M")
    session["end_datetime"] = now.isoformat()
    session["ended"] = True

    if activities:
        session["activities"] = [a.strip() for a in activities.split(";") if a.strip()]
    elif not quick:
        session["activities"] = ["Nenhuma atividade especifica registrada"]

    # Calculate duration
    start = datetime.fromisoformat(session["start_datetime"])
    duration = now - start
    hours, remainder = divmod(int(duration.total_seconds()), 3600)
    minutes = remainder // 60
    session["duration"] = f"{hours:02d}:{minutes:02d}"

    update_daily_log_end(session)

    clear_session()

    badge = _agent_badge(session['agent'])
    print(f"Sessao encerrada as {session['end_time']}")
    print(f"   [{badge}]")
    print(f"   Duracao: {session['duration']}")
    if session.get('activities'):
        print(f"   Atividades registradas: {len(session['activities'])}")
    return True


def get_status():
    """Retorna status da sessao atual."""
    session = load_session()
    if not session or session.get("ended"):
        print("Nenhuma sessao ativa.")
        print()
        print("Para iniciar: python3 .agents/scripts/auto_session.py start")
        return None

    now = datetime.now()
    start = datetime.fromisoformat(session["start_datetime"])
    elapsed = now - start
    hours, remainder = divmod(int(elapsed.total_seconds()), 3600)
    minutes = remainder // 60

    badge = _agent_badge(session['agent'])

    print("Sessao Ativa")
    print()
    print(f"   [{badge}]")
    print(f"   Projeto: {session['project']}")
    print(f"   Inicio: {session['start_time']}")
    print(f"   Tempo decorrido: {hours:02d}:{minutes:02d}")
    print()
    print("Para encerrar: python3 .agents/scripts/auto_session.py end")

    return session


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower()

    if cmd == "start":
        agent_override = None
        if "--agent" in sys.argv:
            idx = sys.argv.index("--agent")
            if idx + 1 < len(sys.argv):
                agent_override = sys.argv[idx + 1]
        bootstrap = "--no-bootstrap" not in sys.argv
        start_session(agent_override, bootstrap=bootstrap)

    elif cmd == "end":
        quick = "--quick" in sys.argv
        activities = None
        if "--activities" in sys.argv:
            idx = sys.argv.index("--activities")
            if idx + 1 < len(sys.argv):
                activities = sys.argv[idx + 1]
        end_session(activities, quick)

    elif cmd == "status":
        get_status()

    else:
        print(f"Comando desconhecido: {cmd}")
        print()
        print("Comandos disponiveis: start, end, status")
        sys.exit(1)


if __name__ == "__main__":
    main()
