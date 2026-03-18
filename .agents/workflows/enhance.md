---
description: Add or update features in existing application. Used for iterative development.
---

# /enhance - Update Application

$ARGUMENTS

---

## Regras Críticas

1. **ESTADO ATUAL PRIMEIRO** — Sempre carregar e entender o estado atual do projeto antes de modificar.
2. **APROVAÇÃO PARA MUDANÇAS GRANDES** — Apresentar plano ao usuário para alterações que afetam muitos arquivos.
3. **CONFLITOS ALERTADOS** — Avisar quando o pedido conflita com tecnologias existentes no projeto.
4. **COMMIT POR MUDANÇA** — Registrar cada alteração com git para rastreabilidade.
5. **PREVIEW ATUALIZADO** — Garantir que o preview reflita as mudanças após aplicação.

## Fluxo de Execução

This command adds features or makes updates to existing application.

### Steps:

1. **Understand Current State**
   - Load project state with `python3 .agents/scripts/project_analyzer.py info`
   - Understand existing features, tech stack

2. **Plan Changes**
   - Determine what will be added/changed
   - Detect affected files
   - Check dependencies

3. **Present Plan to User** (for major changes)
   ```
   "To add admin panel:
   - I'll create 15 new files
   - Update 8 files
   - Takes ~10 minutes
   
   Should I start?"
   ```

4. **Apply**
   - Call relevant agents
   - Make changes
   - Test

5. **Update Preview**
   - Hot reload or restart

---

## Usage Examples

```
/enhance add dark mode
/enhance build admin panel
/enhance integrate payment system
/enhance add search feature
/enhance edit profile page
/enhance make responsive
```

---

## Caution

- Get approval for major changes
- Warn on conflicting requests (e.g., "use Firebase" when project uses PostgreSQL)
- Commit each change with git
