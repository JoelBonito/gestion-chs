---
description: Marca uma tarefa do backlog como concluída. Uso: /finish {ID}
---

# Workflow: /finish

> **Propósito:** Automatizar a baixa de tarefas no backlog. Usado por agentes ao finalizar suas tarefas ou pelo usuário manualmente.

## Argumentos

- `task_id`: O identificador da tarefa (ex: "3.1", "Epic 2").

## Regras Críticas

1. **ID OBRIGATÓRIO** — O `task_id` deve ser fornecido; não inferir automaticamente.
2. **IDEMPOTENTE** — Marcar a mesma tarefa múltiplas vezes não causa erro.
3. **PROGRESSO ATUALIZADO** — Sempre executar o progress_tracker após marcar a tarefa.

## Fluxo de Execução

// turbo
1. Executar o script de atualização
   Run: python3 .agents/scripts/finish_task.py "{task_id}"

// turbo
2. Atualizar a barra de progresso visual
   Run: python3 .agents/scripts/progress_tracker.py

// turbo
3. Story file e PROJECT_STATUS atualizados automaticamente pelo finish_task.py

## Exemplos de Uso

- **Manual:** `/finish 3.1`
- **Agente:** `run_command: /finish "Story 5.2"`
