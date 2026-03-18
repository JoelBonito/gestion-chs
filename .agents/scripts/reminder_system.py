#!/usr/bin/env python3
"""
Reminder System - Inove AI Framework
Sistema de lembretes para gerenciamento de sessões e tarefas.

Uso:
    python3 .agents/scripts/reminder_system.py check
    python3 .agents/scripts/reminder_system.py session-check
    python3 .agents/scripts/reminder_system.py end-of-day

Lembretes implementados:
    1. Sessão longa (> 4 horas)
    2. Fim de dia (após 18:00)
    3. Após conclusão de tarefa
"""

import sys
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional


SESSION_FILE = Path(".agents/.session_state.json")
REMINDER_STATE_FILE = Path(".agents/.reminder_state.json")


def load_session() -> Optional[dict]:
    """Carrega estado da sessão atual."""
    if SESSION_FILE.exists():
        try:
            return json.loads(SESSION_FILE.read_text())
        except json.JSONDecodeError:
            return None
    return None


def load_reminder_state() -> dict:
    """Carrega estado dos lembretes."""
    if REMINDER_STATE_FILE.exists():
        try:
            return json.loads(REMINDER_STATE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_reminder_state(state: dict):
    """Salva estado dos lembretes."""
    REMINDER_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    REMINDER_STATE_FILE.write_text(json.dumps(state, indent=2))


def get_session_duration(session: dict) -> timedelta:
    """Calcula duração da sessão atual."""
    start = datetime.fromisoformat(session['start_datetime'])
    now = datetime.now()
    return now - start


def should_remind_long_session(session: dict, state: dict) -> bool:
    """
    Verifica se deve lembrar sobre sessão longa.

    Lembra a cada 4 horas de sessão contínua.
    """
    duration = get_session_duration(session)
    hours = duration.total_seconds() / 3600

    # Só lembra se passou de 4 horas
    if hours < 4:
        return False

    # Verifica último lembrete de sessão longa
    last_long_session_reminder = state.get('last_long_session_reminder')

    if last_long_session_reminder:
        last_reminder_time = datetime.fromisoformat(last_long_session_reminder)
        time_since_last = datetime.now() - last_reminder_time

        # Lembra novamente apenas se passou 1 hora desde último lembrete
        if time_since_last.total_seconds() < 3600:
            return False

    return True


def should_remind_end_of_day(session: dict, state: dict) -> bool:
    """
    Verifica se deve lembrar sobre fim de dia.

    Lembra apenas uma vez por dia após as 18:00.
    """
    now = datetime.now()
    hour = now.hour

    # Só lembra após 18:00
    if hour < 18:
        return False

    # Verifica se já lembrou hoje
    last_eod_reminder = state.get('last_end_of_day_reminder')

    if last_eod_reminder:
        last_reminder_date = datetime.fromisoformat(last_eod_reminder).date()
        today = now.date()

        # Já lembrou hoje
        if last_reminder_date == today:
            return False

    return True


def check_session_reminders():
    """Verifica e mostra lembretes relacionados à sessão."""
    session = load_session()

    if not session or session.get('ended'):
        return  # Nenhuma sessão ativa

    state = load_reminder_state()
    reminders_shown = []

    # 1. Lembrete de sessão longa
    if should_remind_long_session(session, state):
        duration = get_session_duration(session)
        hours = int(duration.total_seconds() / 3600)
        minutes = int((duration.total_seconds() % 3600) / 60)

        print("💡 **Lembrete: Sessão Longa**")
        print()
        print(f"   Você está trabalhando há {hours}h {minutes}m sem parar.")
        print("   Que tal fazer uma pausa? ☕")
        print()

        # Atualiza estado
        state['last_long_session_reminder'] = datetime.now().isoformat()
        reminders_shown.append('long_session')

    # 2. Lembrete de fim de dia
    if should_remind_end_of_day(session, state):
        now = datetime.now()
        agent_emoji = "🤖" if session['agent'] == "antigravity" else "🔵"

        print("🌙 **Lembrete: Fim do Dia**")
        print()
        print(f"   Já são {now.strftime('%H:%M')}. Sessão ainda ativa desde {session['start_time']}.")
        print(f"   Agente: {agent_emoji} {session['agent']}")
        print()
        print("   Quer encerrar a sessão?")
        print("   → python3 .agents/scripts/auto_session.py end")
        print()

        # Atualiza estado
        state['last_end_of_day_reminder'] = datetime.now().isoformat()
        reminders_shown.append('end_of_day')

    # Salva estado atualizado se houve lembretes
    if reminders_shown:
        save_reminder_state(state)


def check_completion_reminder():
    """
    Verifica se há tarefas candidatas a conclusão.

    Usa o auto_finish.py para sugerir tarefas.
    """
    script_dir = Path(__file__).parent
    auto_finish = script_dir / "auto_finish.py"

    if not auto_finish.exists():
        return

    try:
        result = subprocess.run(
            [sys.executable, str(auto_finish), "--suggest"],
            capture_output=True,
            text=True
        )

        # Se encontrou candidatos, mostra
        if "candidatas a conclusão:" in result.stdout:
            print("📊 **Lembrete: Tarefas Candidatas**")
            print()
            print(result.stdout)
            print()
            print("💡 Use: python3 .agents/scripts/auto_finish.py --check-context")
            print()

    except Exception:
        pass  # Silenciosamente ignora erros


def cmd_check():
    """Comando principal: verifica todos os lembretes."""
    check_session_reminders()
    # Pode adicionar outros checks aqui


def cmd_session_check():
    """Comando: verifica apenas lembretes de sessão."""
    check_session_reminders()


def cmd_end_of_day():
    """Comando: força verificação de fim de dia."""
    session = load_session()

    if not session or session.get('ended'):
        print("📭 Nenhuma sessão ativa.")
        return

    state = load_reminder_state()

    # Força lembrete de fim de dia
    now = datetime.now()
    agent_emoji = "🤖" if session['agent'] == "antigravity" else "🔵"

    print("🌙 **Fim do Dia**")
    print()
    print(f"   Sessão ativa desde {session['start_time']} ({now.strftime('%H:%M')} agora).")
    print(f"   Agente: {agent_emoji} {session['agent']}")
    print()

    response = input("   Encerrar sessão agora? (s/N): ").strip().lower()

    if response == 's':
        script_dir = Path(__file__).parent
        auto_session = script_dir / "auto_session.py"

        if auto_session.exists():
            subprocess.run([sys.executable, str(auto_session), "end"])
        else:
            print("⚠️ Script auto_session.py não encontrado.")


def cmd_completion_check():
    """Comando: verifica lembretes de conclusão."""
    check_completion_reminder()


def cmd_reset():
    """Comando: reseta estado dos lembretes."""
    if REMINDER_STATE_FILE.exists():
        REMINDER_STATE_FILE.unlink()
    print("✅ Estado dos lembretes resetado.")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  check              Verifica todos os lembretes")
        print("  session-check      Verifica apenas lembretes de sessão")
        print("  end-of-day         Verifica fim de dia e oferece encerramento")
        print("  completion-check   Verifica tarefas candidatas a conclusão")
        print("  reset              Reseta estado dos lembretes")
        sys.exit(0)

    cmd = sys.argv[1].lower()

    if cmd == "check":
        cmd_check()

    elif cmd == "session-check":
        cmd_session_check()

    elif cmd == "end-of-day":
        cmd_end_of_day()

    elif cmd == "completion-check":
        cmd_completion_check()

    elif cmd == "reset":
        cmd_reset()

    else:
        print(f"❌ Comando desconhecido: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
