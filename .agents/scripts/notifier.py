#!/usr/bin/env python3
"""
Notifier - Inove AI Framework
Sistema de notificações nativas para macOS.

Uso:
    python3 .agents/scripts/notifier.py "Título" "Mensagem" [--sound]
    python3 .agents/scripts/notifier.py session-start
    python3 .agents/scripts/notifier.py session-end
    python3 .agents/scripts/notifier.py task-complete "3.1"
    python3 .agents/scripts/notifier.py reminder "Mensagem"

Casos de uso:
    - Sessão iniciada/encerrada
    - Tarefa completada
    - Lembrete de pausa
    - Conflito detectado
"""

import sys
import subprocess
from pathlib import Path
from typing import Optional


def _sanitize_applescript_string(text: str) -> str:
    """
    Sanitiza uma string para uso seguro em AppleScript.

    Escapa caracteres que podem causar injeção de comandos:
    - Backslashes
    - Aspas duplas
    - Caracteres de controle

    Args:
        text: String a ser sanitizada

    Returns:
        String segura para uso em AppleScript
    """
    if not isinstance(text, str):
        text = str(text)

    # Remove caracteres de controle que podem causar problemas
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')

    # Escapa backslashes primeiro, depois aspas
    text = text.replace('\\', '\\\\')
    text = text.replace('"', '\\"')

    # Limita o tamanho para evitar buffer issues
    max_length = 500
    if len(text) > max_length:
        text = text[:max_length] + "..."

    return text


def notify_mac(title: str, message: str, sound: bool = False):
    """
    Envia notificação no macOS usando osascript.

    Args:
        title: Título da notificação
        message: Mensagem da notificação
        sound: Se True, toca um som
    """
    # Security fix: Sanitiza strings para prevenir command injection
    title = _sanitize_applescript_string(title)
    message = _sanitize_applescript_string(message)

    # Monta comando AppleScript
    script = f'display notification "{message}" with title "{title}"'

    if sound:
        script += ' sound name "Glass"'

    try:
        subprocess.run(
            ["osascript", "-e", script],
            check=True,
            capture_output=True,
            timeout=10  # Security: Add timeout to prevent hangs
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Erro ao enviar notificação: {e}", file=sys.stderr)
        return False
    except subprocess.TimeoutExpired:
        print(f"⚠️ Timeout ao enviar notificação", file=sys.stderr)
        return False
    except FileNotFoundError:
        # osascript não disponível (não está no macOS)
        print(f"ℹ️ Notificações não disponíveis neste sistema", file=sys.stderr)
        return False


def get_agent_emoji(agent: str) -> str:
    """Retorna emoji do agente."""
    return "🤖" if agent == "antigravity" else "🔵"


def load_session() -> Optional[dict]:
    """Carrega sessão atual."""
    session_file = Path(".agents/.session_state.json")
    if session_file.exists():
        import json
        try:
            return json.loads(session_file.read_text())
        except json.JSONDecodeError:
            return None
    return None


def notify_session_start():
    """Notificação de início de sessão."""
    session = load_session()
    if not session:
        notify_mac(
            "📝 Sessão Iniciada",
            "Nova sessão de trabalho iniciada",
            sound=True
        )
        return

    agent = session.get('agent', 'antigravity')
    emoji = get_agent_emoji(agent)
    start_time = session.get('start_time', 'agora')

    notify_mac(
        "📝 Sessão Iniciada",
        f"{emoji} {agent} • Início: {start_time}",
        sound=True
    )


def notify_session_end():
    """Notificação de encerramento de sessão."""
    session = load_session()
    if not session:
        notify_mac(
            "✅ Sessão Encerrada",
            "Sessão de trabalho encerrada",
            sound=True
        )
        return

    agent = session.get('agent', 'antigravity')
    emoji = get_agent_emoji(agent)
    duration = session.get('duration', 'N/A')

    notify_mac(
        "✅ Sessão Encerrada",
        f"{emoji} {agent} • Duração: {duration}",
        sound=True
    )


def notify_task_complete(task_id: str):
    """Notificação de tarefa completada."""
    notify_mac(
        "✅ Tarefa Concluída",
        f"Story {task_id} marcada como completa!",
        sound=True
    )


def notify_reminder(message: str):
    """Notificação de lembrete."""
    notify_mac(
        "💡 Lembrete",
        message,
        sound=False  # Lembretes não precisam de som
    )


def notify_conflict(resource: str, locked_by: str):
    """Notificação de conflito/lock."""
    notify_mac(
        "⚠️ Recurso Bloqueado",
        f"{resource} está bloqueado por {locked_by}",
        sound=True
    )


def notify_long_session(hours: int):
    """Notificação de sessão longa."""
    notify_mac(
        "☕ Hora de uma Pausa",
        f"Você está trabalhando há {hours} horas. Que tal descansar?",
        sound=False
    )


def notify_end_of_day():
    """Notificação de fim de dia."""
    session = load_session()
    agent = "antigravity"
    if session:
        agent = session.get('agent', 'antigravity')

    emoji = get_agent_emoji(agent)

    notify_mac(
        "🌙 Fim do Dia",
        f"Sessão {emoji} {agent} ainda ativa. Encerrar?",
        sound=False
    )


def notify_progress_update(percentage: float):
    """Notificação de atualização de progresso."""
    notify_mac(
        "📊 Progresso Atualizado",
        f"Projeto agora está {percentage:.1f}% completo!",
        sound=True
    )


def cmd_custom(title: str, message: str, sound: bool = False):
    """Comando: Notificação customizada."""
    notify_mac(title, message, sound)


def cmd_session_start():
    """Comando: Notificação de início de sessão."""
    notify_session_start()


def cmd_session_end():
    """Comando: Notificação de fim de sessão."""
    notify_session_end()


def cmd_task_complete(task_id: str):
    """Comando: Notificação de tarefa completada."""
    notify_task_complete(task_id)


def cmd_reminder(message: str):
    """Comando: Notificação de lembrete."""
    notify_reminder(message)


def cmd_conflict(resource: str, locked_by: str):
    """Comando: Notificação de conflito."""
    notify_conflict(resource, locked_by)


def cmd_long_session(hours: int):
    """Comando: Notificação de sessão longa."""
    notify_long_session(hours)


def cmd_end_of_day():
    """Comando: Notificação de fim de dia."""
    notify_end_of_day()


def cmd_progress(percentage: float):
    """Comando: Notificação de progresso."""
    notify_progress_update(percentage)


def cmd_test():
    """Comando: Testa notificações."""
    print("🧪 Testando notificações...\n")

    tests = [
        ("📝 Teste", "Esta é uma notificação de teste", False),
        ("✅ Teste com Som", "Esta notificação tem som", True),
    ]

    for title, message, sound in tests:
        print(f"Enviando: {title}")
        if notify_mac(title, message, sound):
            print("  ✅ Sucesso")
        else:
            print("  ❌ Falhou")
        print()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  session-start              Notifica início de sessão")
        print("  session-end                Notifica fim de sessão")
        print("  task-complete <task_id>    Notifica conclusão de tarefa")
        print("  reminder <message>         Envia lembrete")
        print("  conflict <resource> <agent> Notifica conflito")
        print("  long-session <hours>       Notifica sessão longa")
        print("  end-of-day                 Notifica fim de dia")
        print("  progress <percentage>      Notifica atualização de progresso")
        print("  test                       Testa notificações")
        print()
        print("Uso customizado:")
        print("  notifier.py <título> <mensagem> [--sound]")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    sound = "--sound" in sys.argv

    if cmd == "session-start":
        cmd_session_start()

    elif cmd == "session-end":
        cmd_session_end()

    elif cmd == "task-complete":
        if len(sys.argv) < 3:
            print("❌ Uso: notifier.py task-complete <task_id>")
            sys.exit(1)
        task_id = sys.argv[2]
        cmd_task_complete(task_id)

    elif cmd == "reminder":
        if len(sys.argv) < 3:
            print("❌ Uso: notifier.py reminder <message>")
            sys.exit(1)
        message = " ".join(sys.argv[2:])
        cmd_reminder(message)

    elif cmd == "conflict":
        if len(sys.argv) < 4:
            print("❌ Uso: notifier.py conflict <resource> <locked_by>")
            sys.exit(1)
        resource = sys.argv[2]
        locked_by = sys.argv[3]
        cmd_conflict(resource, locked_by)

    elif cmd == "long-session":
        if len(sys.argv) < 3:
            print("❌ Uso: notifier.py long-session <hours>")
            sys.exit(1)
        hours = int(sys.argv[2])
        cmd_long_session(hours)

    elif cmd == "end-of-day":
        cmd_end_of_day()

    elif cmd == "progress":
        if len(sys.argv) < 3:
            print("❌ Uso: notifier.py progress <percentage>")
            sys.exit(1)
        percentage = float(sys.argv[2])
        cmd_progress(percentage)

    elif cmd == "test":
        cmd_test()

    else:
        # Modo customizado: título e mensagem
        if len(sys.argv) < 3:
            print("❌ Uso: notifier.py <título> <mensagem> [--sound]")
            sys.exit(1)

        title = sys.argv[1]
        message = sys.argv[2]
        cmd_custom(title, message, sound)


if __name__ == "__main__":
    main()
