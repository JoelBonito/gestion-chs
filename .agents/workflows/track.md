---
description: Analisa o backlog de tarefas e gera/atualiza a barra de progresso visual do projeto.
---

# Workflow: /track

> **Propósito:** Atualizar a visualização de progresso do projeto com base nas tarefas concluídas no backlog.

## Regras Críticas

1. **LEITURA** — Este workflow apenas lê e gera relatórios.
2. **AUTOMÁTICO** — Pode ser executado a qualquer momento.
3. **IDEMPOTENTE** — Rodar múltiplas vezes sempre gera o mesmo resultado.

## Fluxo de Execução

### Passo 1: Localizar Backlog

Procure pelo arquivo de tarefas em ordem de prioridade:

1. `docs/BACKLOG.md`
2. `docs/*/global-task-list.md`
3. `docs/**/task-list.md`

Se não encontrar, informe:
```
❌ Nenhum arquivo de backlog encontrado.
   Execute /define primeiro para criar a estrutura do projeto.
```

---

### Passo 2: Executar Script

```bash
python3 .agents/scripts/progress_tracker.py
```

O script irá:
1. Ler o arquivo de backlog
2. Contar tarefas `[x]` (concluídas) vs `[ ]` (pendentes)
3. Calcular % global e por Epic
4. Gerar `docs/PROJECT_STATUS.md`

---

### Passo 3: Exibir Resultado

Mostre um resumo no terminal:

```markdown
📊 **Progresso Atualizado!**

██████████████░░░░░░ 70%

| Métrica | Valor |
|---------|-------|
| Concluídas | 21 |
| Total | 30 |

Arquivo gerado: `docs/PROJECT_STATUS.md`
```

---

## Integração com Sessões de Trabalho

Este workflow pode ser invocado automaticamente ao final de sessões:

```markdown
# No seu log de sessão ou ao usar /log-end:
> Executando /track para atualizar progresso...
```

---

## Exemplo de Uso

```
Usuário: /track
```

Output esperado:
```
📊 Progresso do Projeto

Geral: ████████████████░░░░ 80% (24/30 tarefas)

Por Epic:
• Epic 1: Auth        ████████████████████ 100%
• Epic 2: API         ████████████████░░░░ 80%
• Epic 3: Dashboard   ████████████░░░░░░░░ 60%

✅ Arquivo atualizado: docs/PROJECT_STATUS.md
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Script não encontrado | Verifique se `.agents/scripts/progress_tracker.py` existe |
| Backlog não encontrado | Execute `/define` primeiro |
| Percentual incorreto | Verifique formato das tarefas (`- [x]` ou `- [ ]`) |
