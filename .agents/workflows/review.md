---
description: Revisao de codigo pos-sprint. Aplica checklist de qualidade, seguranca e boas praticas ao codigo implementado.
---

# Workflow: /review

> **Proposito:** Realizar revisao de codigo apos cada sprint ou sessao de implementacao, garantindo qualidade antes de seguir para proxima etapa.

## Argumentos

```
/review                    - Revisar todos os arquivos modificados na sessao
/review [file/folder]      - Revisar arquivo ou pasta especifica
/review --last-commit      - Revisar apenas ultimo commit
/review --sprint           - Revisar todos os commits da sprint atual
```

---

## Regras Criticas

1. **NUNCA PULAR REVISAO** — Toda sprint deve terminar com revisao antes de `/finish`.
2. **BLOQUEADORES PRIMEIRO** — Issues marcadas como BLOCKING devem ser resolvidas antes de prosseguir.
3. **DOCUMENTAR DECISOES** — Justificar quando um "problema" e aceito intencionalmente.
4. **USAR SKILL** — Sempre carregar `.agents/skills/code-review-checklist/SKILL.md`.

---

## Fluxo de Execucao

### Fase 1: Identificar Escopo

```bash
# Listar arquivos modificados
git diff --name-only HEAD~5

# Ou para commits da sprint (desde ultimo merge/tag)
git log --oneline --since="1 week ago" --name-only
```

**Output esperado:** Lista de arquivos para revisar.

---

### Fase 2: Carregar Checklist

Ler e aplicar: `.agents/skills/code-review-checklist/SKILL.md`

**Categorias de Revisao:**
1. Correctness (bugs, edge cases)
2. Security (injection, XSS, secrets)
3. Performance (N+1, loops, cache)
4. Code Quality (naming, DRY, SOLID)
5. Testing (cobertura, edge cases)

---

### Fase 3: Revisar Cada Arquivo

Para cada arquivo modificado:

1. **Ler o arquivo** com contexto de mudancas
2. **Aplicar checklist** item por item
3. **Registrar issues** com severidade

**Formato de Issues:**

```markdown
### [filename.ts]

| # | Severidade | Linha | Issue | Sugestao |
|---|-----------|-------|-------|----------|
| 1 | 🔴 BLOCKING | 45 | SQL injection em query | Usar prepared statements |
| 2 | 🟡 MAJOR | 78 | Funcao com 150 linhas | Dividir em funcoes menores |
| 3 | 🟢 MINOR | 12 | Variavel `data` pouco descritiva | Renomear para `userData` |
```

---

### Fase 4: Gerar Relatorio

Criar relatorio em `docs/reviews/YYYY-MM-DD-review.md`:

```markdown
# Code Review Report

**Data:** {YYYY-MM-DD}
**Revisor:** {Claude Code / Codex / Antigravity}
**Escopo:** {Descricao do que foi revisado}

---

## Resumo

| Severidade | Quantidade | Resolvidos |
|------------|-----------|------------|
| 🔴 BLOCKING | [N] | [N] |
| 🟡 MAJOR | [N] | [N] |
| 🟢 MINOR | [N] | [N] |

**Veredicto:** APPROVED / NEEDS FIXES / BLOCKED

---

## Issues por Arquivo

[Lista de issues conforme Fase 3]

---

## Acoes Requeridas

1. [ ] [Issue BLOCKING 1 - descricao]
2. [ ] [Issue BLOCKING 2 - descricao]

---

## Notas do Revisor

[Observacoes gerais, padroes bons encontrados, sugestoes de melhoria]
```

---

### Fase 5: Resolver e Fechar

1. **Se APPROVED:** Prosseguir para `/finish`
2. **Se NEEDS FIXES:**
   - Corrigir issues MAJOR e BLOCKING
   - Re-executar `/review` nos arquivos corrigidos
3. **Se BLOCKED:**
   - NAO prosseguir ate resolver todos os BLOCKING
   - Notificar usuario sobre problemas criticos

---

## Integracao com Fluxo

```
Sprint Implementation
        |
        v
    /review
        |
   +----+----+
   |         |
APPROVED  NEEDS FIXES
   |         |
   v         v
/finish   Fix Issues
   |         |
   v         +---> /review (loop)
Next Sprint
```

---

## Exemplos de Uso

```bash
# Revisao padrao apos implementacao
/review

# Revisar apenas o servico de auth
/review src/services/auth/

# Revisar ultimo commit antes de push
/review --last-commit

# Revisao completa da sprint
/review --sprint
```

---

## Checklist Rapido (Memoria)

### Security
- [ ] Input validado/sanitizado
- [ ] Sem SQL/NoSQL injection
- [ ] Sem XSS ou CSRF
- [ ] Sem secrets hardcoded
- [ ] Outputs sanitizados

### Performance
- [ ] Sem N+1 queries
- [ ] Loops otimizados
- [ ] Cache apropriado
- [ ] Bundle size considerado

### Quality
- [ ] Nomes claros e descritivos
- [ ] DRY - sem duplicacao
- [ ] Funcoes pequenas e focadas
- [ ] Tipos corretos (sem `any`)

### Testing
- [ ] Testes para codigo novo
- [ ] Edge cases cobertos
- [ ] Mocks para dependencias externas

---

## Metricas de Qualidade

| Metrica | Alvo | Como Medir |
|---------|------|------------|
| Issues BLOCKING | 0 | Contagem no relatorio |
| Issues MAJOR | < 3 por arquivo | Contagem no relatorio |
| Cobertura de testes | > 80% | Coverage tool |
| Funcoes > 50 linhas | 0 | Linter/analise |
| `any` types | 0 | TypeScript strict |

---

## Automacao Sugerida

```bash
# Pre-commit hook (opcional)
# .git/hooks/pre-commit

#!/bin/bash
echo "Running quick review checks..."
npm run lint
npm run type-check
npm run test -- --coverage --passWithNoTests
```

---

*Skill relacionada: `.agents/skills/code-review-checklist/SKILL.md`*
