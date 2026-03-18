---
description: Finaliza projeto e gera release. Valida conclusao, gera changelog e prepara artefatos de lancamento.
---

# Workflow: /release

> **Proposito:** Finalizar formalmente um projeto (MVP ou Producao) apos conclusao de todas as tarefas do backlog. Valida criterios de conclusao, gera artefatos de release e documenta o lancamento.

## Argumentos

```
/release                   - Release padrao (verifica backlog 100%)
/release mvp               - Release MVP (permite backlog parcial com P0 completos)
/release --version X.Y.Z   - Especifica versao manualmente
/release --dry-run         - Simula release sem criar artefatos
```

---

## Regras Criticas

1. **BACKLOG VERIFICADO** — Nao liberar sem verificar status do backlog.
2. **TESTES OBRIGATORIOS** — Deve haver execucao de `/test-book --validate` aprovada.
3. **REVIEW APROVADO** — Ultima revisao de codigo deve estar APPROVED.
4. **CHANGELOG GERADO** — Todo release deve ter changelog documentado.
5. **TAG CRIADA** — Versao deve ser taggeada no git.

---

## Checklist de Conclusao

### Para MVP

| # | Criterio | Obrigatorio | Verificacao |
|---|----------|-------------|-------------|
| 1 | Todos os Epics P0 concluidos | Sim | `docs/BACKLOG.md` sem `[ ]` em P0 |
| 2 | Testes P0 passando | Sim | `/test-book --validate` |
| 3 | Sem issues BLOCKING no review | Sim | `docs/reviews/` ultimo relatorio |
| 4 | Documentacao basica presente | Sim | README.md atualizado |
| 5 | Variaveis de ambiente documentadas | Sim | .env.example presente |

### Para Producao

| # | Criterio | Obrigatorio | Verificacao |
|---|----------|-------------|-------------|
| 1 | 100% do backlog concluido | Sim | `docs/BACKLOG.md` |
| 2 | Todos os testes passando | Sim | `/test-book --validate` |
| 3 | Review APPROVED | Sim | `docs/reviews/` |
| 4 | Documentacao completa | Sim | README, API docs, guias |
| 5 | Seguranca auditada | Sim | Scan de vulnerabilidades |
| 6 | Performance validada | Recomendado | Metricas de carga |
| 7 | Rollback testado | Recomendado | Procedimento documentado |

---

## Fluxo de Execucao

### Fase 1: Verificar Backlog

```bash
# Verificar progresso
python3 .agents/scripts/progress_tracker.py

# Para MVP: verificar apenas P0
# Para Producao: verificar 100%
```

**Criterio de Parada:**
- MVP: Se algum Epic P0 incompleto → ERRO
- Producao: Se qualquer tarefa incompleta → ERRO

---

### Fase 2: Validar Testes

```bash
# Executar caderno de testes
/test-book --validate
```

**Criterio de Parada:**
- Se houver testes BLOCKING falhando → ERRO
- Se taxa de aprovacao < 95% → WARNING (perguntar se continua)

---

### Fase 3: Verificar Review

```bash
# Verificar ultimo review
ls -la docs/reviews/ | tail -1
```

**Criterio de Parada:**
- Se ultimo review for NEEDS FIXES ou BLOCKED → ERRO
- Se nenhum review existir → WARNING (recomendar executar `/review`)

---

### Fase 4: Determinar Versao

Se `--version` nao foi especificado:

1. Ler versao atual de `package.json`
2. Sugerir bump baseado no tipo de mudancas:
   - Major (X.0.0): Breaking changes
   - Minor (0.X.0): Novas features
   - Patch (0.0.X): Bug fixes

```bash
# Ler versao atual
cat package.json | grep '"version"'
```

---

### Fase 5: Gerar Changelog

Criar `CHANGELOG.md` ou atualizar existente:

```markdown
# Changelog

## [X.Y.Z] - YYYY-MM-DD

### Added
- [Lista de features do backlog marcadas como novas]

### Changed
- [Lista de melhorias/refatoracoes]

### Fixed
- [Lista de bugs corrigidos]

### Security
- [Lista de correcoes de seguranca]

### Breaking Changes
- [Lista de mudancas que quebram compatibilidade]
```

**Fonte de dados:**
- `docs/BACKLOG.md` (features)
- `git log --oneline` (commits desde ultima tag)
- `docs/reviews/` (issues corrigidos)

---

### Fase 6: Atualizar Versao

```bash
# Atualizar package.json
npm version X.Y.Z --no-git-tag-version

# Ou manualmente editar package.json
```

---

### Fase 7: Criar Tag e Commit

```bash
# Commit de release
git add .
git commit -m "chore: release vX.Y.Z"

# Criar tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

---

### Fase 8: Gerar Release Notes

Criar arquivo `docs/releases/vX.Y.Z.md`:

```markdown
# Release Notes - vX.Y.Z

**Data:** YYYY-MM-DD
**Tipo:** MVP / Production
**Autor:** [Agente que executou]

---

## Resumo

[Descricao breve do que esta release inclui]

---

## Epics Incluidos

| Epic | Descricao | Stories |
|------|-----------|---------|
| 1 | [Nome] | [N] concluidas |

---

## Metricas

- **Total de Stories:** [N]
- **Testes Executados:** [N]
- **Taxa de Aprovacao:** [%]
- **Issues Resolvidos:** [N]

---

## Proximos Passos

- [Lista de melhorias futuras ou Epics P1/P2 pendentes]

---

## Verificacao

- [x] Backlog verificado
- [x] Testes validados
- [x] Review aprovado
- [x] Changelog gerado
- [x] Tag criada
```

---

### Fase 9: Notificar Conclusao

Exibir resumo final:

```
========================================
         RELEASE CONCLUIDO
========================================

Projeto: [Nome]
Versao: vX.Y.Z
Tipo: MVP / Production
Data: YYYY-MM-DD

Artefatos Gerados:
  - CHANGELOG.md (atualizado)
  - docs/releases/vX.Y.Z.md
  - Git tag: vX.Y.Z

Proximos passos:
  - git push origin main --tags
  - Publicar release notes
  - Notificar stakeholders

========================================
```

---

## Modo --dry-run

Quando executado com `--dry-run`:

1. Executar todas as verificacoes
2. Mostrar o que SERIA feito
3. NAO criar commits, tags ou arquivos
4. Util para validar antes de release real

---

## Integracao com Fluxo

```
Backlog 100% (ou P0 para MVP)
        |
        v
  /test-book --validate
        |
   PASS?---> /review
        |        |
       NO      APPROVED?
        |        |
    Fix Tests   YES
        |        |
        +--------+
                 |
                 v
            /release
                 |
                 v
        Artefatos Gerados
                 |
                 v
           git push --tags
                 |
                 v
         Projeto Concluido
```

---

## Exemplos de Uso

```bash
# Release padrao de producao
/release

# Release MVP (apenas P0)
/release mvp

# Release com versao especifica
/release --version 2.0.0

# Simular release
/release --dry-run

# Release MVP com versao
/release mvp --version 1.0.0-mvp
```

---

## Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| "Backlog incompleto" | Tarefas pendentes | Completar ou usar `mvp` |
| "Testes falhando" | Caderno com falhas | Corrigir e re-executar |
| "Nenhum review encontrado" | Pasta reviews vazia | Executar `/review` |
| "Versao ja existe" | Tag duplicada | Usar versao diferente |

---

## Arquivos Gerados

| Arquivo | Descricao |
|---------|-----------|
| `CHANGELOG.md` | Historico de mudancas |
| `docs/releases/vX.Y.Z.md` | Release notes detalhado |
| `package.json` | Versao atualizada |
| Git tag `vX.Y.Z` | Marcador de versao |

---

*Skills relacionadas: `.agents/skills/deployment-procedures/SKILL.md`*
