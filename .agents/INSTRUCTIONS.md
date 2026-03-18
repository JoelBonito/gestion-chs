# INSTRUCTIONS.md - Instruções Compartilhadas do Inove AI Framework

> Este arquivo contém as instruções compartilhadas para Claude Code e Codex CLI.
> É carregado automaticamente por ambas as ferramentas.

## Sobre Este Projeto

**Inove AI Framework** é um kit de desenvolvimento AI com sistema multi-agent (Claude Code + Codex CLI + Antigravity/Gemini) que fornece:

- **22 Agentes Especializados** para diferentes domínios
- **42 Skills Modulares** carregadas sob demanda
- **25 Workflows** (slash commands) para processos estruturados
- **Sistema Multi-Agent** com sincronização de locks e ownership

---

## Estrutura do Framework

```
.agents/
├── agents/           # 22 agentes especializados
├── skills/           # 41 módulos de conhecimento
├── workflows/        # 25 workflows (slash commands)
├── scripts/          # Automação Python
├── config/           # Configurações por plataforma
└── ARCHITECTURE.md   # Documentação técnica
```

---

## Protocolo de Roteamento Inteligente

### 1. Detecção de Domínio (AUTOMÁTICO)

| Palavras-chave | Domínio | Agente Primário |
|----------------|---------|-----------------|
| "UI", "componente", "página", "frontend" | Frontend | `frontend-specialist` |
| "API", "endpoint", "backend", "servidor" | Backend | `backend-specialist` |
| "database", "schema", "query", "migração" | Database | `database-architect` |
| "mobile", "iOS", "Android", "React Native" | Mobile | `mobile-developer` |
| "auth", "segurança", "vulnerabilidade" | Security | `security-auditor` |
| "bug", "erro", "não funciona", "debug" | Debug | `debugger` |
| "unit test", "TDD", "cobertura", "jest", "vitest", "pytest" | Unit/Integration Testing | `test-engineer` |
| "e2e", "playwright", "cypress", "pipeline", "regressão", "automated test" | E2E/QA Pipeline | `qa-automation-engineer` |
| "deploy", "docker", "infraestrutura" | DevOps | `devops-engineer` |
| "requisitos", "user story", "backlog", "MVP" | Product | `product-owner` |
| "UX", "user flow", "wireframe", "jornada", "usabilidade" | UX Research | `ux-researcher` |

### 2. Ativação de Agente (OBRIGATÓRIO)

Quando um domínio for detectado:

1. **Ler arquivo do agente:** `.agents/agents/{agent}.md`
2. **Anunciar ativação:**
   ```
   🤖 Ativando @{nome-do-agente}...
   📖 Carregando regras e protocolos
   ```
3. **Carregar skills** do frontmatter do agente
4. **Aplicar persona e regras** do agente

---

## Workflows Disponíveis (Slash Commands)

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/define` | Planejamento completo em 9 fases com GAP Analysis | Novos projetos do zero |
| `/journeys` | Documentar jornadas de usuário | Contextualizar requisitos |
| `/context` | Criar Project Context | Padronizar convenções técnicas |
| `/readiness` | Validar prontidão para implementação | Antes de começar a codar |
| `/brainstorm` | Exploração Socrática | Ideação e descoberta |
| `/create` | Criar novas features | Implementação guiada |
| `/debug` | Debug sistemático | Resolução de bugs |
| `/enhance` | Melhorar código existente | Refatoração |
| `/deploy` | Deploy de aplicação | Publicação |
| `/test` | Gerar e rodar testes | Quality assurance |
| `/track` | Atualizar progresso | Tracking de tarefas |
| `/status` | Dashboard consolidado | Visão geral |
| `/log` | Registrar sessões | Documentação |
| `/finish` | Marcar tarefas completas | Conclusão |
| `/orchestrate` | Coordenação multi-agente | Tarefas que requerem múltiplos agentes |
| `/plan` | Planejamento rápido de tarefas | Plano leve (alternativa ao /define) |
| `/preview` | Gerenciar servidor de preview | Start/stop/restart do dev server |
| `/ui-ux-pro-max` | Design system avançado com base de dados | UI/UX com paletas, tipografia, estilos |
| `/review` | Revisão de código pós-sprint | Após implementação, antes de /finish |
| `/test-book` | Gerar/atualizar Caderno de Testes | Antes de finalizar MVP ou release |
| `/release` | Finalizar projeto e gerar release | Conclusão de MVP ou Produção |
| `/squad` | Gerenciar squads de agentes | Criação e ativação de squads |

**Como usar:**
```
/define App de gestão de tarefas
/debug O login não está funcionando
/track
```

---

## Protocolo Auto-Finish (OBRIGATÓRIO)

Após completar QUALQUER tarefa do `docs/BACKLOG.md`:

```bash
python3 .agents/scripts/finish_task.py "{task_id}"
python3 .agents/scripts/progress_tracker.py
```

Informar ao usuário:
```
✅ Task {task_id} marcada como completa
📊 Progresso atualizado: {percentual}%
🎯 Próxima tarefa: {nome_proxima_tarefa}
```

> **Guardas automáticos:** `finish_task.py` só marca o checkbox se o story file correspondente existir, atualiza o frontmatter e injeta o resumo nas histórias desbloqueadas. Nunca marque manualmente.

---

## Integração com Backlog / Stories / Status

Quando o usuário disser "implementar Epic X" ou "implementar Story Y.Z", siga SEMPRE esta ordem:

1. **PROJECT_STATUS primeiro:** Abra `docs/PROJECT_STATUS.md` para saber a próxima story, branch atual, progresso e alertas (ex.: “próxima task é UI/antigravity”).
2. **Story file = fonte única:** Abrir o arquivo indicado em `docs/stories/STORY-Y.Z_*.md`. Todo o contexto (requisito, critérios, dependências, agente, ferramenta, workspace) vive nele. Não use o backlog para isso.
3. **Validar dependências:** Checar `depends_on`. Se alguma story estiver pendente, pare e finalize-a antes de avançar.
4. **Ativar agente/ferramenta:** Utilize os campos `agent`/`tool` do story para rotear automaticamente (ex.: `frontend-specialist` + `codex`, `ux-researcher` + `antigravity`).
5. **Backlog = índice:** Use `docs/BACKLOG.md` apenas como checklist global. Se uma story no backlog não tiver arquivo correspondente, gere-o com `/define` ou `python3 .agents/scripts/shard_epic.py generate|migrate` antes de marcar qualquer progresso.
6. **Registrar no Agent Workspace:** Documente decisões, anotações e links diretamente no story file para manter o contexto vivo.
7. **Auto-finish obrigatório:** Execute `finish_task.py` + `progress_tracker.py` para atualizar backlog, story files e PROJECT_STATUS. Nunca marque manualmente.

---

## Regras Universais (TIER 0)

### Clean Code (Mandatório Global)

Todo código DEVE seguir `.agents/skills/clean-code/SKILL.md`:

- Código conciso e auto-documentado
- Sem over-engineering
- Testes obrigatórios (Unit > Integration > E2E)
- Performance medida antes de otimizar

### Tratamento de Idioma

- **Prompt do usuário** em PT-BR → Responder em PT-BR
- **Comentários de código** → Sempre em inglês
- **Variáveis/funções** → Sempre em inglês


### Socratic Gate

Para requisições complexas, PERGUNTAR antes de implementar:

- Propósito e escopo
- Casos de borda
- Implicações de performance
- Considerações de segurança

---

## Registro de Sessoes de Trabalho (OBRIGATORIO)

### Objetivo
Rastrear sessões de trabalho e gerar um relatório diário consolidado em Markdown.

### Regras de Operação
1. **Fonte Única:** SEMPRE use `auto_session.py` para gerir sessões. NUNCA edite os logs manualmente.
2. **Abertura:** Use o comando start no início de cada sessão de trabalho.
3. **Encerramento:** Ao concluir entregas ou terminar a interação, use o comando end passando a lista exata do que construiu/modificou.
4. **Fechamento Automático:** O script cuida do cabeçalho, cálculo do resumo do dia e índice do README.

### Comandos

```bash
python3 .agents/scripts/auto_session.py start --agent <claude_code|codex|antigravity>  # Abrir sessão
python3 .agents/scripts/auto_session.py end --activities "ativ1; ativ2"                 # Fechar sessão
python3 .agents/scripts/auto_session.py status                                          # Ver sessão ativa
```

### Critérios de Qualidade
A saída da descrição das atividades enviadas à flag `--activities` deve ser curta e objetiva. Abstê-se de logar dados sensíveis.

---

## 📂 Organização de Documentação (OBRIGATÓRIO)

A documentação DEVE seguir esta estrutura de pastas. Não crie arquivos soltos na raiz de `docs/` (exceto BACKLOG.md).

**Padrão oficial** (criado pelo `/define`):

```bash
docs/
├── 00-Contexto/        # Contexto do projeto e regras
│   ├── CONTEXT.md      # Gerado por /context
│   └── READINESS.md    # Gerado por /readiness
├── 01-Planejamento/    # Artefatos executivos do /define
│   ├── 01-product-brief.md
│   ├── 02-prd.md
│   ├── 03-design-system.md
│   ├── 04-database-schema.md
│   └── 05-roadmap-backlog.md
├── 02-Requisitos/      # Detalhamento funcional
│   ├── User-Stories.md
│   └── Jornadas.md     # Gerado por /journeys
├── 03-Arquitetura/     # Técnicos e Decisões
│   ├── ADRs/           # Architecture Decision Records
│   └── Diagramas/      # Mermaid/PlantUML (fluxos, classes)
├── 04-API/            # Contratos de Interface
│   └── Endpoints.md    # OpenAPI ou Docs REST
├── 08-Logs-Sessoes/    # Logs de Sessão de Trabalho
│   └── {ANO}/{DATA}.md # Logs diários
└── BACKLOG.md          # Backlog Mestre (Raiz)
```

**Aliases aceitos** (fallback legado / projetos sem `/define`):

| Oficial (padrão)     | Alias aceito          |
|----------------------|-----------------------|
| `docs/01-Planejamento/` | `docs/planning/`   |
| `docs/00-Contexto/`     | `docs/context/`    |
| `docs/02-Requisitos/`   | `docs/requirements/` |
| `docs/03-Arquitetura/`  | `docs/architecture/` |
| `docs/04-API/`          | `docs/api/`        |
| `docs/08-Logs-Sessoes/` | `docs/logs/`       |

> **Resolução:** Ao procurar documentos, tente primeiro o caminho oficial. Se não existir, tente o alias. Use `resolve_doc_path()` / `resolve_doc_file()` de `platform_compat.py` em scripts Python.

**Regra:** Ao criar documentos, sempre verifique se a pasta existe. Se não existir, crie-a.

---

## Compatibilidade Multi-Plataforma

Este framework suporta **três ferramentas AI simultaneamente**:

| Ferramenta | Arquivo de Instrução | Skills Location | Config |
|------------|---------------------|-----------------|--------|
| Claude Code | `CLAUDE.md` | `.agents/skills/` | N/A |
| Codex CLI | `AGENTS.md` | `.codex/skills/` (symlink) | `.agents/config/codex.toml` |
| Antigravity/Gemini | `GEMINI.md` | `.agents/skills/` | N/A |

### Symlinks Nativos

Cada plataforma acessa os mesmos recursos via caminhos nativos (symlinks para `.agents/`):

| Plataforma | Agents | Skills | Workflows |
|------------|--------|--------|-----------|
| Claude Code | `.claude/agents/` | `.claude/skills/` | `.agents/workflows/` |
| Codex CLI | `.codex/agents/` | `.codex/skills/` | `.codex/prompts/` |
| Antigravity | `.agents/agents/` | `.agents/skills/` | `.agents/workflows/` |

> **Fonte canônica:** `.agents/` — todos os symlinks apontam para lá.

### Detecção Automática de Plataforma

Os scripts Python detectam automaticamente qual ferramenta está executando:

```python
from platform_compat import get_agent_source
source = get_agent_source()  # 'claude_code', 'codex', ou 'unknown'
```

## Sistema Multi-Agent

Este framework suporta múltiplos agentes AI trabalhando simultaneamente:

### Identificação de Fonte
```bash
# Para Antigravity/Gemini
export AGENT_SOURCE=antigravity

# Para Claude Code
export AGENT_SOURCE=claude_code

# Para Codex CLI
export AGENT_SOURCE=codex
```

### Lock Manager
```bash
python3 .agents/scripts/lock_manager.py list      # Ver locks ativos
python3 .agents/scripts/lock_manager.py cleanup   # Limpar locks expirados
```

### Ownership e Modelo Preferencial de Epics

Formato no BACKLOG.md:
```markdown
## Epic 1: Nome [OWNER: claude_code] [MODEL: opus-4-5]
```

| Campo | Descrição | Valores |
|-------|-----------|---------|
| `OWNER` | Agente/ferramenta responsável | `claude_code`, `antigravity`, `codex` |
| `MODEL` | Modelo AI preferencial | `opus-4-5`, `sonnet`, `haiku`, `gemini-2.0` |

---

## Scripts Úteis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Dashboard | `python3 .agents/scripts/dashboard.py` | Visão consolidada |
| Progresso | `python3 .agents/scripts/progress_tracker.py` | Atualizar barra |
| Sessão | `python3 .agents/scripts/auto_session.py start` | Iniciar sessão |
| Finish | `python3 .agents/scripts/finish_task.py "Epic-1"` | Marcar completo |
| Métricas | `python3 .agents/scripts/metrics.py` | Insights |
| Validar | `python3 .agents/scripts/validate_installation.py` | Verificar setup |
| Rastreabilidade | `python3 .agents/scripts/validate_traceability.py` | Validar cobertura |
| Projeto | `python3 .agents/scripts/project_analyzer.py status` | Analisar tech stack |
| Web Data | `python3 .agents/scripts/generate_web_data.py` | Gerar JSONs do site |
| Checklist | `python3 .agents/scripts/checklist.py .` | Validação incremental |
| Verificar Tudo | `python3 .agents/scripts/verify_all.py .` | Verificação completa |
| Squad Manager | `python3 .agents/scripts/squad_manager.py list` | Gerenciar squads |
| Recovery | `python3 .agents/scripts/recovery.py checkpoint <label>` | Retry + rollback |
| Story Ops | `python3 .agents/scripts/shard_epic.py generate` | Gerar/atualizar story files |
| Story Migrate | `python3 .agents/scripts/shard_epic.py migrate` | Converter backlog antigo em lean + stories |

---

## Sistema de Squads

Squads são pacotes reutilizáveis de agentes+skills+workflows para domínios específicos.
Squads ficam em `squads/<nome>/` com manifesto `squad.yaml`. Detalhes em `squads/README.md`.

| Comando | Descrição |
|---------|-----------|
| `/squad create <name>` | Criar novo squad |
| `/squad list` | Listar squads |
| `/squad activate <name>` | Ativar no framework |
| `/squad deactivate <name>` | Desativar |

---

### Stitch MCP (Projetos com UI)

Para TODOS os projetos com interface visual (HAS_UI=true):

| Cenário | Comportamento |
|---------|---------------|
| Stitch MCP **disponível** + HAS_UI=true | **OBRIGATÓRIO** gerar protótipos via Stitch para **TODAS** as telas do sistema |
| Stitch MCP **não disponível** + HAS_UI=true | **PARAR** e informar usuário para configurar Stitch antes de continuar |
| HAS_UI=false | Fase 3.5 ignorada |

**Regras de Cobertura Total:**
- `/define` Fase 3.5: Prototipar **TODAS** as telas identificadas no UX Concept (não apenas 1 ou 2)
- `/ui-ux-pro-max` Step 2c: Preview visual é OBRIGATÓRIO
- `/readiness`: Valida existência de mockups E cobertura completa
- **Gate de Bloqueio:** Fase 4 (Architecture) é BLOQUEADA até cobertura 100% das telas

Projetos sem UI (API, CLI, backend-only): Stitch é ignorado.

---

### Recovery System

Scripts críticos usam retry automático e git checkpoint para operações seguras.
Módulo: `.agents/scripts/recovery.py`

---

## Inicialização de Sessão

> **PULO DO GATO (Context State):** Sempre que iniciar o trabalho com o usuário, **leia silenciosamente o arquivo `docs/PROJECT_STATUS.md`** (se existir). Dessa forma, você saberá exatamente em qual Epic estamos, a branch atual e os últimos commits, evitando perguntar "onde paramos?".

Toda conversa começa com:

```
✅ Project Instructions carregadas
✅ Protocolo Inove AI Framework ativo
✅ 22 agentes disponíveis
✅ 42 skills disponíveis
✅ 25 workflows disponíveis
✅ Roteamento inteligente habilitado

🎯 Pronto para trabalhar. O que devo fazer?
```

---

## Referência Rápida de Agentes

| Agente | Arquivo | Skills Primárias |
|--------|---------|------------------|
| `orchestrator` | `.agents/agents/orchestrator.md` | Coordenação multi-agente |
| `project-planner` | `.agents/agents/project-planner.md` | Planejamento, discovery |
| `product-manager` | `.agents/agents/product-manager.md` | Requisitos, user stories |
| `frontend-specialist` | `.agents/agents/frontend-specialist.md` | React, UI/UX, Tailwind |
| `backend-specialist` | `.agents/agents/backend-specialist.md` | APIs, Node.js, lógica |
| `database-architect` | `.agents/agents/database-architect.md` | Schemas, Prisma, queries |
| `mobile-developer` | `.agents/agents/mobile-developer.md` | iOS, Android, RN |
| `security-auditor` | `.agents/agents/security-auditor.md` | Auth, OWASP, compliance |
| `debugger` | `.agents/agents/debugger.md` | Root cause analysis |
| `devops-engineer` | `.agents/agents/devops-engineer.md` | CI/CD, Docker, infra |
| `test-engineer` | `.agents/agents/test-engineer.md` | Estratégias de teste |
| `qa-automation-engineer` | `.agents/agents/qa-automation-engineer.md` | E2E, automação |
| `documentation-writer` | `.agents/agents/documentation-writer.md` | Manuais, docs |
| `code-archaeologist` | `.agents/agents/code-archaeologist.md` | Refatoração legacy |
| `performance-optimizer` | `.agents/agents/performance-optimizer.md` | Otimizações |
| `seo-specialist` | `.agents/agents/seo-specialist.md` | SEO, visibilidade |
| `penetration-tester` | `.agents/agents/penetration-tester.md` | Security testing |
| `game-developer` | `.agents/agents/game-developer.md` | Game logic |
| `product-owner` | `.agents/agents/product-owner.md` | Requisitos, backlog, MVP |
| `explorer-agent` | `.agents/agents/explorer-agent.md` | Análise de codebase |
| `ux-researcher` | `.agents/agents/ux-researcher.md` | UX research, user flows, wireframes |

---

## Exemplo de Fluxo Completo

**Usuário:** "Implementar Epic 1: Autenticação de Usuários"

**Claude:**
1. 🔍 Domínio detectado: Security + Backend
2. 🤖 Ativando agentes:
   - @security-auditor (líder)
   - @backend-specialist (suporte)
3. 📖 Carregando skills: vulnerability-scanner, api-patterns
4. [Implementa código seguindo regras dos agentes]
5. ✅ Implementação completa
6. 🔧 Executando: `python3 .agents/scripts/finish_task.py "Epic 1"`
7. 📊 Progresso: 25% (1/4 epics concluídos)

**Usuário:** `/define App de gestão de tarefas`

**Claude (ou Antigravity):**
1. Fase 0: Discovery (12 perguntas estruturadas)
2. Fase 1: Brief (`product-manager`)
3. Fase 2: PRD + GAP Produto (`product-owner`)
4. Fase 3: UX Concept + GAP UX (`ux-researcher`)
5. Fase 4: Architecture + DB + GAP Infra (`project-planner`)
6. Fase 5: Security + GAP Segurança (`security-auditor`)
7. Fase 6: Stack + GAP Tech (`project-planner`)
8. Fase 7: Design System + GAP Design (`frontend-specialist`)
9. Fase 8: Backlog + GAPs consolidados (`product-owner`)
10. Revisão: Claude Code/Codex valida com skill `doc-review`
