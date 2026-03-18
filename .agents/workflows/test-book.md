---
description: Gera ou atualiza o Caderno de Testes a partir do backlog e codigo implementado. Cria cenarios de teste para validacao de MVP/producao.
---

# Workflow: /test-book

> **Proposito:** Gerar automaticamente um Caderno de Testes estruturado baseado no backlog, requisitos e codigo implementado. Usado antes de finalizar MVP ou release de producao.

## Argumentos

```
/test-book                 - Gerar caderno completo
/test-book --update        - Atualizar caderno existente com novas stories
/test-book --epic [N]      - Gerar testes apenas para Epic especifico
/test-book --validate      - Executar testes do caderno e marcar resultados
```

---

## Regras Criticas

1. **BACKLOG OBRIGATORIO** — O caderno e gerado a partir de `docs/BACKLOG.md`.
2. **COBERTURA COMPLETA** — Cada Story deve ter pelo menos 1 cenario de teste.
3. **PRIORIDADES RESPEITADAS** — P0 primeiro, depois P1, depois P2.
4. **RASTREABILIDADE** — Cada teste deve referenciar a Story de origem.
5. **EXECUTAVEL** — Testes devem ter passos claros e verificaveis.

---

## Estrutura do Caderno

```markdown
# Caderno de Testes - {Nome do Projeto}

> Versao: X.Y | Data: YYYY-MM-DD | Status: Draft/Em Execucao/Aprovado

## Sumario
1. [Estrutura e Integridade](#1-estrutura)
2. [Funcionalidades Core](#2-core)
3. [Integracao](#3-integracao)
4. [Edge Cases](#4-edge-cases)
5. [Performance](#5-performance)
6. [Seguranca](#6-seguranca)
7. [Acessibilidade](#7-acessibilidade)
8. [Regressao](#8-regressao)

## Convencoes
| Simbolo | Significado |
|---------|-------------|
| [ ] | Teste pendente |
| [x] | Teste aprovado |
| [!] | Teste com falha |
| [-] | Teste nao aplicavel |
```

---

## Fluxo de Execucao

### Fase 1: Analisar Backlog

1. Ler `docs/BACKLOG.md`
2. Extrair todos os Epics e Stories
3. Identificar criterios de aceite de cada Story
4. Mapear dependencias entre Stories

```markdown
### Matriz de Cobertura

| Epic | Story | Criterios de Aceite | Testes Gerados |
|------|-------|---------------------|----------------|
| 1 | 1.1 | 3 | 5 |
| 1 | 1.2 | 2 | 4 |
```

---

### Fase 2: Gerar Cenarios por Story

Para cada Story, criar cenarios de teste:

**Template por Story:**

```markdown
## Story {X.Y}: {Titulo}

> **Origem:** Epic {X}
> **Criterios de Aceite:** {N}

### Testes Funcionais

| # | Cenario | Pre-condicao | Passos | Resultado Esperado | Status |
|---|---------|--------------|--------|-------------------|--------|
| {X.Y}.1 | Happy path | [Setup] | 1. [Acao] | [Resultado] | [ ] |
| {X.Y}.2 | Erro: [cenario] | [Setup] | 1. [Acao] | [Erro esperado] | [ ] |
| {X.Y}.3 | Edge: [cenario] | [Setup] | 1. [Acao] | [Comportamento] | [ ] |
```

**Regras de Geracao:**

1. **Happy Path:** Fluxo principal funcionando
2. **Error Cases:** Pelo menos 1 cenario de erro por Story
3. **Edge Cases:** Limites, valores vazios, caracteres especiais
4. **Integracao:** Se depende de outra Story, testar juntas

---

### Fase 3: Categorizar Testes

Organizar testes por categoria:

#### Categorias Obrigatorias

| Categoria | Descricao | Prioridade |
|-----------|-----------|------------|
| **Estrutura** | Arquivos, configs, dependencias | P0 |
| **Core** | Funcionalidades principais do MVP | P0 |
| **Auth** | Autenticacao e autorizacao | P0 |
| **Integracao** | APIs externas, banco, servicos | P1 |
| **Edge Cases** | Limites e comportamentos especiais | P1 |
| **Performance** | Tempo de resposta, carga | P1 |
| **Seguranca** | OWASP, injection, XSS | P0 |
| **Acessibilidade** | WCAG AA, navegacao teclado | P2 |
| **Regressao** | Funcionalidades existentes | P1 |

---

### Fase 4: Gerar Caderno Final

Criar/Atualizar `docs/CADERNO_DE_TESTES.md`:

```markdown
# Caderno de Testes - {Projeto}

> **Versao:** 1.0
> **Data:** {YYYY-MM-DD}
> **Gerado por:** {Claude Code / Codex / Antigravity}
> **Baseado em:** docs/BACKLOG.md

---

## Resumo de Cobertura

| Categoria | Total | Pendentes | Aprovados | Falhas | N/A |
|-----------|-------|-----------|-----------|--------|-----|
| Estrutura | [N] | [N] | [N] | [N] | [N] |
| Core | [N] | [N] | [N] | [N] | [N] |
| ... | ... | ... | ... | ... | ... |
| **TOTAL** | **[N]** | **[N]** | **[N]** | **[N]** | **[N]** |

---

## 1. Estrutura e Integridade

### 1.1 Arquivos de Configuracao (P0)

| # | Teste | Comando/Acao | Esperado | Status |
|---|-------|--------------|----------|--------|
| 1.1.1 | Package.json existe | `test -f package.json` | OK | [ ] |

[... continua para cada categoria ...]

---

## Historico de Execucao

| Data | Executor | Pass | Fail | N/A | Notas |
|------|----------|------|------|-----|-------|
| {YYYY-MM-DD} | {Agente} | [N] | [N] | [N] | Execucao inicial |
```

---

### Fase 5: Validar Cobertura

Verificar que todos os criterios de aceite estao cobertos:

```markdown
### Rastreabilidade: Criterios -> Testes

| Story | Criterio de Aceite | Teste(s) | Coberto? |
|-------|-------------------|----------|----------|
| 1.1 | Login com email valido | 1.1.1, 1.1.2 | [x] |
| 1.1 | Erro para senha incorreta | 1.1.3 | [x] |
| 1.2 | Logout limpa sessao | 1.2.1 | [x] |
```

**Alerta:** Se algum criterio nao tiver teste, o workflow deve perguntar ao usuario se deve gerar.

---

## Modo --validate

Quando executado com `--validate`:

1. Percorrer cada teste do caderno
2. Executar comando/acao descrito
3. Comparar resultado com esperado
4. Atualizar status: `[x]` (pass), `[!]` (fail), `[-]` (skip)
5. Gerar relatorio de execucao

```markdown
## Resultado da Validacao

**Data:** {YYYY-MM-DD HH:MM}
**Executor:** {Agente}

### Resumo
- **Total:** 150 testes
- **Aprovados:** 142 (95%)
- **Falhas:** 5 (3%)
- **Pulados:** 3 (2%)

### Falhas Detectadas

| # | Teste | Esperado | Obtido | Severidade |
|---|-------|----------|--------|------------|
| 3.2.1 | API retorna 200 | 200 | 500 | BLOCKING |
| 5.1.3 | Tempo < 200ms | < 200ms | 350ms | MAJOR |
```

---

## Templates de Teste por Tipo

### Teste de API

```markdown
| # | Endpoint | Metodo | Payload | Esperado | Status |
|---|----------|--------|---------|----------|--------|
| API.1 | /api/users | GET | - | 200 + lista | [ ] |
| API.2 | /api/users | POST | {valid} | 201 + user | [ ] |
| API.3 | /api/users | POST | {invalid} | 400 + errors | [ ] |
```

### Teste de UI

```markdown
| # | Pagina | Acao | Resultado Esperado | Status |
|---|--------|------|-------------------|--------|
| UI.1 | /login | Preencher form valido | Redirect para /dashboard | [ ] |
| UI.2 | /login | Preencher form invalido | Exibir mensagem de erro | [ ] |
```

### Teste de Seguranca

```markdown
| # | Vulnerabilidade | Teste | Esperado | Status |
|---|-----------------|-------|----------|--------|
| SEC.1 | SQL Injection | Input: `' OR 1=1 --` | Erro 400, nao executa | [ ] |
| SEC.2 | XSS | Input: `<script>alert(1)</script>` | Escapado no output | [ ] |
```

---

## Integracao com Fluxo

```
Backlog 100% Done
        |
        v
  /test-book
        |
        v
Caderno Gerado
        |
        v
  /test-book --validate
        |
   +----+----+
   |         |
 PASS     FAIL
   |         |
   v         v
  MVP     Fix + Re-test
Ready        |
             +---> /test-book --validate (loop)
```

---

## Exemplos de Uso

```bash
# Gerar caderno completo
/test-book

# Atualizar com novas stories
/test-book --update

# Gerar apenas para Epic 3
/test-book --epic 3

# Executar testes e atualizar status
/test-book --validate
```

---

## Checklist Pre-Geracao

Antes de executar `/test-book`, verificar:

- [ ] `docs/BACKLOG.md` existe e esta atualizado
- [ ] Todas as Stories tem criterios de aceite
- [ ] Codigo das Stories P0 esta implementado
- [ ] Ambiente de teste esta configurado

---

## Metricas de Qualidade

| Metrica | Alvo | Como Medir |
|---------|------|------------|
| Cobertura de Stories | 100% | Stories com >= 1 teste |
| Cobertura de Criterios | 100% | Criterios com >= 1 teste |
| Taxa de Aprovacao | > 95% | Testes passando |
| Testes BLOCKING falhos | 0 | Contagem de falhas P0 |

---

*Skills relacionadas: `.agents/skills/testing-patterns/SKILL.md`, `.agents/skills/webapp-testing/SKILL.md`*
