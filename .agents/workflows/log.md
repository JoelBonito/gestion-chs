---
description: Gerencia logs de sessão de trabalho. Sub-comandos: start, end, show, summary. Delega ao auto_session.py para automação completa.
---

# Workflow: /log

> **Propósito:** Registrar sessões de trabalho de forma automatizada e consistente.
> **Implementação:** Todas as operações delegam ao script `auto_session.py`.

## Regras Críticas

1. **FUSO HORÁRIO** — Sempre usar America/Sao_Paulo para registro de horários.
2. **FONTE ÚNICA** — SEMPRE usar `auto_session.py`. NUNCA criar/editar logs manualmente.
3. **ARQUIVO POR DIA** — Um único arquivo por dia no formato `AAAA-MM-DD.md`.
4. **AUTOMAÇÃO** — O script cuida do cabeçalho, cálculo de resumo e índice README.

## Sub-comandos

| Comando | Script Executado |
|---------|-----------------|
| `/log start` | `python3 .agents/scripts/auto_session.py start` |
| `/log end` | `python3 .agents/scripts/auto_session.py end --activities "{atividades}"` |
| `/log show` | `python3 .agents/scripts/auto_session.py status` |
| `/log summary` | `python3 .agents/scripts/metrics.py weekly` |

---

## Estrutura de Arquivos

```
docs/
└── 08-Logs-Sessoes/
    ├── README.md           <- Índice de logs (auto-gerado)
    └── {ANO}/
        └── {AAAA-MM-DD}.md <- Log diário (auto-gerado)
```

---

## Fluxo: `/log start`

```bash
python3 .agents/scripts/auto_session.py start
```

O script automaticamente:
1. Detecta data/hora atual
2. Cria ou abre o arquivo do dia
3. Adiciona nova entrada de sessão
4. Reporta confirmação

**Confirmar ao usuário:**
```
Sessao iniciada as HH:MM
Arquivo: docs/08-Logs-Sessoes/{ANO}/{AAAA-MM-DD}.md
```

---

## Fluxo: `/log end`

### Passo 1: Perguntar Atividades

```
O que foi feito nesta sessão?
Liste as atividades realizadas:
```

**AGUARDAR** a resposta do usuário.

### Passo 2: Executar Script

```bash
python3 .agents/scripts/auto_session.py end --activities "atividade1; atividade2; atividade3"
```

O script automaticamente:
1. Calcula hora de fim e duração
2. Formata atividades como bullets
3. Atualiza resumo do dia
4. Atualiza índice README

### Passo 3: Confirmar e Sugerir

```
Sessao encerrada as HH:MM (duracao: XX:XX)
Log atualizado: docs/08-Logs-Sessoes/{ANO}/{AAAA-MM-DD}.md

Dica: Execute /track para atualizar a barra de progresso.
```

---

## Fluxo: `/log show`

```bash
python3 .agents/scripts/auto_session.py status
```

Exibe sessão ativa (se houver) e resumo do dia.

---

## Fluxo: `/log summary`

```bash
python3 .agents/scripts/metrics.py weekly
```

Gera resumo semanal consolidado com tempo por dia e por agente.

---

## Formato do Log Diário (Referência)

```markdown
# LOG DIARIO -- AAAA-MM-DD
- Projeto: {nome}
- Fuso: America/Sao_Paulo

## Sessoes

1. HH:MM -- HH:MM (HH:MM) [agent_source]
   - Atividade 1
   - Atividade 2

## Resumo do Dia
- Inicio: HH:MM
- Fim: HH:MM
- Tempo total: HH:MM
- Sessoes: N
```

---

## Exemplo de Uso

```
Usuario: /log start
Claude:  Sessao iniciada as 16:30

[... trabalho acontece ...]

Usuario: /log end
Claude:  O que foi feito nesta sessao?
Usuario: Implementei login com Firebase; criei AuthForm; corrigi bug validacao
Claude:  Sessao encerrada as 18:45 (duracao: 02:15)
         Log atualizado.
```
