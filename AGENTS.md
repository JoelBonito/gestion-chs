# AGENTS.md - Instruções para OpenAI Codex CLI

> **Papel principal:** Implementação de código
> **Papel standalone:** Autônomo (planning + implementação)
> **Fonte canônica:** `.agents/INSTRUCTIONS.md`

---

## Papel do Codex CLI

O Codex CLI é primariamente um **implementador de código**. Quando usado junto com o Gemini (Flow B), recebe contexto via `HANDOFF.md`. Quando usado **sozinho** (Standalone Mode), opera de forma autônoma com todos os 22 agentes.

```
┌──────────────────────────────────────┐
│  CODEX CLI                           │
│                                      │
│  Flow B (com Gemini):                │
│  - Input: HANDOFF.md + Backlog       │
│  - Foco: Implementação               │
│                                      │
│  Standalone (sem Gemini):            │
│  - Todos os 22 agentes disponíveis   │
│  - Todos os 25 workflows             │
│  - Planning + Implementação          │
│                                      │
│  MCP: Context7 + Shadcn              │
│  Output: src/ (código)               │
└──────────────────────────────────────┘
```

### O Que NÃO Fazer (quando HANDOFF.md existir)
- **NÃO** alterar documentos de planejamento em `docs/01-Planejamento/` (ou `docs/planning/`)
- **NÃO** replanear ou refazer decisões já tomadas no HANDOFF.md
- **NÃO** alterar o `docs/BACKLOG.md` manualmente (usar scripts)

---

## Input Protocol (OBRIGATÓRIO)

**ANTES de começar qualquer implementação:**

0. **Ler silenciosamente** `docs/PROJECT_STATUS.md` (se existir) para saber **onde** estamos (branch, próxima story, alertas de roteamento).
1. **Verificar** se `docs/HANDOFF.md` existe:
   - **Se existir:** Ler para entender prioridades e decisões (contexto rico)
   - **Se não existir:** Prosseguir sem ele (ver Standalone Mode abaixo)
2. **Abrir** o arquivo da próxima story listado em `PROJECT_STATUS.md` (sempre em `docs/stories/`). Esse arquivo é a **fonte total de contexto** (requisito, critérios, dependências, agente, ferramenta e Agent Workspace).
3. **Validar dependências** (`depends_on`): se alguma story estiver pendente, finalize-a antes de prosseguir.
4. **Ativar o agente/ferramenta** especificados no frontmatter (`agent`, `tool`). Só troque manualmente se o usuário instruir.
5. **Registrar descobertas** no bloco **Agent Workspace** da própria story (fonte única de notas e links).
6. **Auto-finish obrigatório:** ao concluir, rode `finish_task.py` + `progress_tracker.py` para sincronizar backlog, story e PROJECT_STATUS.
7. **Usar** `docs/BACKLOG.md` apenas como índice/checkbox para saber o panorama geral ou confirmar que a story existe. **Nunca** usar o backlog para absorver contexto detalhado.

> **Regra adicional:** STORY FILE é a única fonte de contexto. Se precisar de detalhes extra, documente-os no Agent Workspace do próprio arquivo.

---

## Standalone Mode (sem Gemini)

Quando o Codex CLI é usado **sem o Gemini** (sem `docs/HANDOFF.md`):

1. **Leia `docs/PROJECT_STATUS.md`:** ele aponta a próxima story e traz alertas de roteamento (p. ex., “próxima story exige antigravity”).
2. **Abra o story file listado:** todo requisito, critério, dependência, agente e ferramenta estão em `docs/stories/STORY-*.md`. Nenhum outro arquivo fornece esse contexto.
3. **Use** `docs/BACKLOG.md` apenas como índice leve (checkbox). Se o projeto não tiver status/story definidos, gere-os via `/define` ou `shard_epic.py migrate`.
4. **Planejamento adicional:** Só consulte `docs/01-Planejamento/` se precisar de decisões de arquitetura/stack/design específicas para a story atual.
5. **Se nada disso existir:** use o Socratic Gate para descobrir requisitos com o usuário e documente um story antes de implementar.

### Agentes Adicionais (Standalone)

No modo standalone, além dos 14 agentes de implementação, ficam disponíveis os 7 agentes de planning:

| Agente | Quando Usar |
|--------|-------------|
| `project-planner` | `/define`, `/plan` — planning de projetos |
| `product-manager` | Requisitos, user stories |
| `product-owner` | Backlog, MVP, GAP analysis |
| `ux-researcher` | User flows, wireframes, UX research |
| `security-auditor` (planning) | Threat modeling, security planning |
| `explorer-agent` | Análise de codebase |
| `orchestrator` | Coordenação multi-agente |

### Workflows Adicionais (Standalone)

| Comando | Descrição |
|---------|-----------|
| `/define` | Planejamento completo em 9 fases |
| `/brainstorm` | Exploração Socrática |
| `/journeys` | Documentar jornadas de usuário |
| `/context` | Criar Project Context |
| `/readiness` | Validar prontidão |
| `/plan` | Planejamento rápido |
| `/squad` | Gerenciar squads |
| `/ui-ux-pro-max` | Design system |

> **Resumo:** Codex standalone = todos os 22 agentes + 25 workflows. Funciona como agente autônomo completo.

---

## Stitch MCP (OBRIGATÓRIO para UI)

Para TODOS os projetos com interface visual (HAS_UI=true):

| Cenário | Comportamento |
|---------|---------------|
| Stitch MCP **disponível** + HAS_UI=true | **OBRIGATÓRIO** gerar protótipos via Stitch para **TODAS** as telas do sistema |
| Stitch MCP **não disponível** + HAS_UI=true | **PARAR** e informar usuário para configurar Stitch |
| HAS_UI=false | Fase 3.5 ignorada |

**Regras de Cobertura Total:**
- `/define` Fase 3.5: Prototipar **TODAS** as telas do UX Concept (não apenas 1 ou 2)
- `/ui-ux-pro-max` Step 2c: Preview visual obrigatório para cada tela mencionada
- `/readiness` valida cobertura Stitch antes de liberar implementação
- **Gate de Bloqueio:** Fase 4 BLOQUEADA até cobertura 100%

---

## Estrutura do Framework

```
.agents/
├── agents/           # 22 agentes especializados (core)
├── skills/           # 42 skills modulares (core)
├── workflows/        # 25 workflows (slash commands)
├── scripts/          # Automação Python
├── config/           # Configurações por plataforma
└── ARCHITECTURE.md   # Documentação técnica
```

---

## REGRAS INVIOLÁVEIS

### Regra Zero — NUNCA Editar Sem Aprovação (ABSOLUTO)

1. **NUNCA usar ferramentas de modificação sem aprovação EXPLÍCITA do usuário.**
2. **"Analisar" ≠ "Editar".** Responder com DIAGNÓSTICO TEXTUAL apenas.
3. **Fluxo obrigatório:** LER → ANALISAR → PROPOR → ESPERAR aprovação → EDITAR.

### Classificação de Requisição (STEP 0)

| Tipo                 | Palavras-chave                                | Resultado                      |
| -------------------- | --------------------------------------------- | ------------------------------ |
| **PERGUNTA**         | "o que é", "como funciona", "explique"        | Resposta textual               |
| **EDIT SIMPLES**     | "corrige", "adiciona", "muda" (1 arquivo)     | Edição inline                  |
| **CÓDIGO COMPLEXO**  | "construa", "crie", "implemente", "refatore"  | Ler contexto + implementar     |
| **SLASH CMD**        | /create, /debug, /enhance, /test              | Fluxo do comando               |

### Socratic Gate (OBRIGATÓRIO)

| Tipo de Requisição        | Estratégia       | Ação Obrigatória                                          |
| ------------------------- | ---------------- | --------------------------------------------------------- |
| **Nova Feature / Build**  | Deep Discovery   | Perguntar no mínimo 3 questões estratégicas               |
| **Edit / Bug Fix**        | Context Check    | Confirmar entendimento e perguntar impactos/regressões    |
| **Vago / Simples**        | Clarificação     | Perguntar Propósito, Usuários e Escopo                    |
| **Orquestração Full**     | Gatekeeper       | Parar subagentes até o plano ser confirmado               |
| **"Prossiga" direto**     | Validação        | Mesmo assim perguntar 2 edge cases antes de codar         |

**Protocolo:** Nunca assumir (qualquer dúvida → perguntar), responder em listas objetivas, esperar autorização explícita antes de editar, e usar `.agents/skills/brainstorming/SKILL.md` como referência.

### Read → Understand → Apply

```
ERRADO: Ler agente → Começar a codar
CORRETO: Ler contexto (PROJECT_STATUS → Story file → HANDOFF/docs de apoio) → Ler agente → Entender PORQUÊ → Aplicar PRINCÍPIOS → Codar
```

---

## Agentes Disponíveis (Implementação)

| Agente | Arquivo | Foco |
|--------|---------|------|
| `frontend-specialist` | `.agents/agents/frontend-specialist.md` | Web UI/UX, React, Next.js |
| `backend-specialist` | `.agents/agents/backend-specialist.md` | APIs, Node.js, Python |
| `database-architect` | `.agents/agents/database-architect.md` | Schemas, queries, migrations |
| `mobile-developer` | `.agents/agents/mobile-developer.md` | iOS, Android, React Native |
| `devops-engineer` | `.agents/agents/devops-engineer.md` | CI/CD, Docker, infra |
| `test-engineer` | `.agents/agents/test-engineer.md` | Estratégias de teste |
| `qa-automation-engineer` | `.agents/agents/qa-automation-engineer.md` | E2E, automação |
| `debugger` | `.agents/agents/debugger.md` | Root cause analysis |
| `performance-optimizer` | `.agents/agents/performance-optimizer.md` | Otimizações |
| `security-auditor` | `.agents/agents/security-auditor.md` | Code review de segurança |
| `code-archaeologist` | `.agents/agents/code-archaeologist.md` | Refatoração legacy |
| `documentation-writer` | `.agents/agents/documentation-writer.md` | Docs técnicos |
| `seo-specialist` | `.agents/agents/seo-specialist.md` | SEO, visibilidade |
| `game-developer` | `.agents/agents/game-developer.md` | Game logic |

### Roteamento Inteligente

| Palavras-chave | Domínio | Agente |
|----------------|---------|--------|
| "UI", "componente", "página", "frontend" | Frontend | `frontend-specialist` |
| "API", "endpoint", "backend", "servidor" | Backend | `backend-specialist` |
| "database", "schema", "query", "migração" | Database | `database-architect` |
| "mobile", "iOS", "Android", "React Native" | Mobile | `mobile-developer` |
| "auth", "segurança", "vulnerabilidade" | Security | `security-auditor` |
| "bug", "erro", "não funciona", "debug" | Debug | `debugger` |
| "unit test", "TDD", "cobertura", "jest", "vitest", "pytest" | Unit/Integration Testing | `test-engineer` |
| "e2e", "playwright", "cypress", "pipeline", "regressão", "automated test" | E2E/QA Pipeline | `qa-automation-engineer` |
| "deploy", "docker", "infraestrutura" | DevOps | `devops-engineer` |

---

## Workflows Disponíveis (Implementação)

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/create` | Criar novas features | Implementação guiada |
| `/debug` | Debug sistemático | Resolução de bugs |
| `/enhance` | Melhorar código existente | Refatoração |
| `/test` | Gerar e rodar testes | Quality assurance |
| `/deploy` | Deploy de aplicação | Publicação |
| `/review` | Revisão de código pós-sprint | Qualidade |
| `/preview` | Gerenciar servidor de preview | Dev server |

### Workflows Partilhados (Ambos os fluxos)

| Comando | Descrição |
|---------|-----------|
| `/track` | Atualizar progresso |
| `/status` | Dashboard consolidado |
| `/finish` | Marcar tarefas completas |
| `/log` | Registrar sessões |
| `/orchestrate` | Coordenação multi-agente |
| `/test-book` | Gerar caderno de testes |
| `/release` | Preparar release |

---

## Auto-Finish Protocol (OBRIGATÓRIO)

Após completar QUALQUER tarefa do `docs/BACKLOG.md`:

```bash
python3 .agents/scripts/finish_task.py "{task_id}"
python3 .agents/scripts/progress_tracker.py
```

Informar ao usuário:
```
Task {task_id} marcada como completa
Progresso atualizado: {percentual}%
Próxima tarefa: {nome_proxima_tarefa}
```

> **Regras adicionais:** O `finish_task.py` valida se o story file existe antes de marcar o checkbox, atualiza o frontmatter da story e injeta contexto nas dependências desbloqueadas. Nunca marque manualmente.

---

## Registro de Sessões de Trabalho (OBRIGATÓRIO)

### Objetivo
Rastrear sessões de trabalho e gerar um relatório diário consolidado em Markdown.

### Regras de Operação
1. **Fonte Única:** SEMPRE use `auto_session.py` para gerir sessões. NUNCA edite os logs manualmente.
2. **Abertura:** Use o comando start no início de cada sessão de trabalho.
3. **Encerramento:** Ao concluir entregas ou terminar a interação, use o comando end passando a lista exata do que construiu/modificou.
4. **Fechamento Automático:** O script cuida do cabeçalho, cálculo do resumo do dia e índice do README.

### Comandos

```bash
python3 .agents/scripts/auto_session.py start --agent codex             # Abrir sessão
python3 .agents/scripts/auto_session.py end --activities "ativ1; ativ2" # Fechar sessão
python3 .agents/scripts/auto_session.py status                          # Ver sessão ativa
```

### Critérios de Qualidade
A saída da descrição das atividades enviadas à flag `--activities` deve ser curta e objetiva. Abstê-se de logar dados sensíveis.

### Tratamento de Idioma

- **Prompt em PT-BR** → Responder em PT-BR
- **Comentários de código** → Sempre em inglês
- **Variáveis/funções** → Sempre em inglês

---

## Final Checklist Protocol

```bash
python3 .agents/scripts/checklist.py .
python3 .agents/scripts/checklist.py . --url <URL>
```

**Ordem:** Security → Lint → Schema → Tests → UX → SEO → Perf

---

## Scripts Úteis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Dashboard | `python3 .agents/scripts/dashboard.py` | Visão consolidada |
| Progresso | `python3 .agents/scripts/progress_tracker.py` | Atualizar barra |
| Sessão | `python3 .agents/scripts/auto_session.py start` | Iniciar sessão |
| Finish | `python3 .agents/scripts/finish_task.py "Epic-1"` | Marcar completo |
| Checklist | `python3 .agents/scripts/checklist.py .` | Auditoria do projeto |
| Validar | `python3 .agents/scripts/validate_installation.py` | Verificar setup |
| Squads | `python3 .agents/scripts/squad_manager.py list` | Gerenciar squads |
| Story Ops | `python3 .agents/scripts/shard_epic.py generate` | Gerar/atualizar story files (novo fluxo) |
| Story Migrate | `python3 .agents/scripts/shard_epic.py migrate` | Converter backlog antigo em backlog lean + stories |

---

## Sistema Multi-Agent

```bash
export AGENT_SOURCE=codex
python3 .agents/scripts/lock_manager.py list
python3 .agents/scripts/lock_manager.py cleanup
```

Ownership no BACKLOG.md: `## Epic 1 [OWNER: codex] [MODEL: gpt-4]`

---

## Compatibilidade Multi-Plataforma

| Ferramenta | Arquivo | Papel |
|------------|---------|-------|
| Claude Code | `CLAUDE.md` | Autônomo (planning + implementação) |
| Gemini CLI | `GEMINI.md` | Planning (+ implementação em standalone) |
| Codex CLI | `AGENTS.md` | Implementação (+ planning em standalone) |

> **Todas as ferramentas funcionam sozinhas.** Flow B (Gemini + Codex) é opcional.

---

## Instruções Completas

📄 **[.agents/INSTRUCTIONS.md](.agents/INSTRUCTIONS.md)** — Regras detalhadas
📄 **[.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md)** — Documentação técnica

<!--
IMPORTANT: The actual full instructions are in .agents/INSTRUCTIONS.md
This file serves as the implementation-focused interface for Codex CLI.
Codex reads AGENTS.md files automatically.
-->
