#!/usr/bin/env python3
"""
Lock Manager - Inove AI Framework
Sistema de locks para coordenar edições concorrentes entre agentes.

Uso:
    from lock_manager import LockManager

    lock_mgr = LockManager()
    if lock_mgr.acquire_lock("backlog", "antigravity"):
        try:
            # Modificar BACKLOG.md
            ...
        finally:
            lock_mgr.release_lock("backlog", "antigravity")
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent))
from platform_compat import get_agent_source as _platform_get_agent_source


class LockManager:
    """Gerencia locks de recursos para prevenir edições concorrentes."""

    def __init__(self, locks_dir: Path = None, default_timeout: int = 300):
        """
        Inicializa o LockManager.

        Args:
            locks_dir: Diretório onde os locks serão armazenados
            default_timeout: Timeout padrão em segundos (5 minutos)
        """
        self.locks_dir = locks_dir or Path(".agents/locks")
        self.locks_dir.mkdir(parents=True, exist_ok=True)
        self.default_timeout = default_timeout

    def _get_lock_file(self, resource: str) -> Path:
        """Retorna o caminho do arquivo de lock para um recurso."""
        return self.locks_dir / f"{resource}.lock"

    def _get_agent_source(self) -> str:
        """Detecta qual agente está executando."""
        return _platform_get_agent_source()

    def _is_stale(self, lock_data: dict) -> bool:
        """
        Verifica se um lock está expirado (stale).

        Args:
            lock_data: Dados do lock

        Returns:
            True se o lock está expirado
        """
        try:
            locked_at = datetime.fromisoformat(lock_data['locked_at'])
            timeout = lock_data.get('timeout', self.default_timeout)
            expiration = locked_at + timedelta(seconds=timeout)
            return datetime.now() > expiration
        except (KeyError, ValueError):
            return True  # Se dados inválidos, considera stale

    def get_lock_info(self, resource: str) -> Optional[dict]:
        """
        Obtém informações sobre um lock existente.

        Args:
            resource: Nome do recurso

        Returns:
            Dict com informações do lock ou None se não existir
        """
        lock_file = self._get_lock_file(resource)

        if not lock_file.exists():
            return None

        try:
            lock_data = json.loads(lock_file.read_text())

            # Verifica se está stale
            if self._is_stale(lock_data):
                # Remove lock expirado
                lock_file.unlink()
                return None

            return lock_data
        except (json.JSONDecodeError, IOError):
            # Se arquivo corrompido, remove
            lock_file.unlink()
            return None

    def _atomic_create_file(self, file_path: Path, content: str) -> bool:
        """
        Cria um arquivo de forma atômica usando O_CREAT | O_EXCL.

        Esta operação é atômica no sistema de arquivos - se dois processos
        tentarem criar o mesmo arquivo simultaneamente, apenas um terá sucesso.

        Args:
            file_path: Caminho do arquivo
            content: Conteúdo a escrever

        Returns:
            True se criou o arquivo, False se já existia
        """
        try:
            # O_CREAT | O_EXCL é atômico - falha se arquivo já existe
            fd = os.open(str(file_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
            try:
                os.write(fd, content.encode('utf-8'))
            finally:
                os.close(fd)
            return True
        except FileExistsError:
            return False
        except OSError:
            return False

    def acquire_lock(
        self,
        resource: str,
        agent: str = None,
        timeout: int = None,
        **metadata
    ) -> bool:
        """
        Tenta adquirir um lock para um recurso.

        Usa operações atômicas (O_CREAT | O_EXCL) para prevenir race conditions.

        Args:
            resource: Nome do recurso a bloquear
            agent: Nome do agente (detectado automaticamente se não fornecido)
            timeout: Timeout em segundos (usa default_timeout se não fornecido)
            **metadata: Metadados adicionais para o lock

        Returns:
            True se conseguiu adquirir o lock, False caso contrário
        """
        lock_file = self._get_lock_file(resource)
        agent = agent or self._get_agent_source()
        timeout = timeout or self.default_timeout

        # Verifica se já existe lock (e se está stale)
        existing_lock = self.get_lock_info(resource)

        if existing_lock:
            # Verifica se é o mesmo agente
            if existing_lock['locked_by'] == agent:
                # Renova o lock (reescrita é segura para o mesmo agente)
                existing_lock['locked_at'] = datetime.now().isoformat()
                lock_file.write_text(json.dumps(existing_lock, indent=2))
                return True

            # Lock pertence a outro agente e não está stale
            return False

        # Cria novo lock usando operação atômica
        lock_data = {
            "locked_by": agent,
            "locked_at": datetime.now().isoformat(),
            "pid": os.getpid(),
            "timeout": timeout,
            **metadata
        }

        content = json.dumps(lock_data, indent=2)

        # Security fix: Usa criação atômica para prevenir race condition (TOCTOU)
        if self._atomic_create_file(lock_file, content):
            return True

        # Se falhou, pode ser que outro processo criou o lock entre nossa verificação
        # e a tentativa de criação. Verificamos novamente.
        existing_lock = self.get_lock_info(resource)
        if existing_lock and existing_lock['locked_by'] == agent:
            # É nosso lock (caso raro de retry)
            return True

        return False

    def release_lock(self, resource: str, agent: str = None) -> bool:
        """
        Libera um lock de um recurso.

        Args:
            resource: Nome do recurso
            agent: Nome do agente (detectado automaticamente se não fornecido)

        Returns:
            True se conseguiu liberar, False caso contrário
        """
        lock_file = self._get_lock_file(resource)
        agent = agent or self._get_agent_source()

        if not lock_file.exists():
            return True  # Já liberado

        lock_info = self.get_lock_info(resource)

        if not lock_info:
            return True  # Lock expirado ou inválido

        # Verifica se o lock pertence a este agente
        if lock_info['locked_by'] != agent:
            return False  # Não pode liberar lock de outro agente

        try:
            lock_file.unlink()
            return True
        except IOError:
            return False

    def wait_for_lock(
        self,
        resource: str,
        agent: str = None,
        max_wait: int = 30,
        check_interval: float = 0.5
    ) -> bool:
        """
        Aguarda até conseguir adquirir um lock.

        Args:
            resource: Nome do recurso
            agent: Nome do agente
            max_wait: Tempo máximo de espera em segundos
            check_interval: Intervalo entre tentativas em segundos

        Returns:
            True se conseguiu adquirir, False se timeout
        """
        agent = agent or self._get_agent_source()
        start_time = time.time()

        while time.time() - start_time < max_wait:
            if self.acquire_lock(resource, agent):
                return True

            # Mostra mensagem informativa
            lock_info = self.get_lock_info(resource)
            if lock_info:
                locked_by = lock_info['locked_by']
                print(f"⏳ Recurso '{resource}' bloqueado por '{locked_by}'. Aguardando...")

            time.sleep(check_interval)

        return False

    def force_release(self, resource: str) -> bool:
        """
        Força a liberação de um lock (use com cuidado!).

        Args:
            resource: Nome do recurso

        Returns:
            True se conseguiu liberar
        """
        lock_file = self._get_lock_file(resource)

        if not lock_file.exists():
            return True

        try:
            lock_file.unlink()
            return True
        except IOError:
            return False

    def list_active_locks(self) -> dict:
        """
        Lista todos os locks ativos.

        Returns:
            Dict com resource -> lock_info
        """
        active_locks = {}

        for lock_file in self.locks_dir.glob("*.lock"):
            resource = lock_file.stem
            lock_info = self.get_lock_info(resource)

            if lock_info:  # Ignora locks stale
                active_locks[resource] = lock_info

        return active_locks

    def cleanup_stale_locks(self) -> int:
        """
        Remove todos os locks expirados.

        Returns:
            Número de locks removidos
        """
        count = 0

        for lock_file in self.locks_dir.glob("*.lock"):
            try:
                lock_data = json.loads(lock_file.read_text())
                if self._is_stale(lock_data):
                    lock_file.unlink()
                    count += 1
            except (json.JSONDecodeError, IOError):
                lock_file.unlink()
                count += 1

        return count


def main():
    """CLI para gerenciar locks manualmente."""
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nComandos disponíveis:")
        print("  list     - Lista locks ativos")
        print("  cleanup  - Remove locks expirados")
        print("  force-release <resource> - Força liberação de um lock")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    lock_mgr = LockManager()

    if cmd == "list":
        locks = lock_mgr.list_active_locks()
        if not locks:
            print("📭 Nenhum lock ativo")
        else:
            print("🔒 Locks ativos:\n")
            for resource, info in locks.items():
                locked_at = datetime.fromisoformat(info['locked_at'])
                elapsed = datetime.now() - locked_at
                minutes = int(elapsed.total_seconds() / 60)

                print(f"  • {resource}")
                print(f"    Bloqueado por: {info['locked_by']}")
                print(f"    Há {minutes} minuto(s)")
                print()

    elif cmd == "cleanup":
        count = lock_mgr.cleanup_stale_locks()
        print(f"✅ {count} lock(s) expirado(s) removido(s)")

    elif cmd == "force-release":
        if len(sys.argv) < 3:
            print("❌ Uso: lock_manager.py force-release <resource>")
            sys.exit(1)

        resource = sys.argv[2]
        if lock_mgr.force_release(resource):
            print(f"✅ Lock '{resource}' liberado")
        else:
            print(f"❌ Falha ao liberar lock '{resource}'")

    else:
        print(f"❌ Comando desconhecido: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
