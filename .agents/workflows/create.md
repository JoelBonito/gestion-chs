---
description: Create new application command. Triggers App Builder skill and starts interactive dialogue with user.
---

# /create - Create Application

$ARGUMENTS

---

## Regras Críticas

1. **ANÁLISE PRIMEIRO** — Sempre entender o pedido do usuário antes de gerar código.
2. **APROVAÇÃO OBRIGATÓRIA** — Apresentar o plano ao usuário e aguardar confirmação antes de construir.
3. **AGENTES ESPECIALIZADOS** — Delegar para agentes corretos (database-architect, backend-specialist, frontend-specialist).
4. **PREVIEW AUTOMÁTICO** — Ao finalizar, iniciar preview para o usuário validar visualmente.
5. **PADRÕES DO PROJETO** — Respeitar tech stack e convenções definidas no projeto.

## Fluxo de Execução

This command starts a new application creation process.

### Steps:

1. **Request Analysis**
   - Understand what the user wants
   - If information is missing, use `brainstorming` skill to ask

2. **Project Planning**
   - Use `project-planner` agent for task breakdown
   - Determine tech stack
   - Plan file structure
   - Create plan file and proceed to building

3. **Application Building (After Approval)**
   - Orchestrate with `app-builder` skill
   - Coordinate expert agents:
     - `database-architect` → Schema
     - `backend-specialist` → API
     - `frontend-specialist` → UI

4. **Preview**
   - Start with `auto_preview.py` when complete
   - Present URL to user

---

## Usage Examples

```
/create blog site
/create e-commerce app with product listing and cart
/create todo app
/create Instagram clone
/create crm system with customer management
```

---

## Before Starting

If request is unclear, ask these questions:
- What type of application?
- What are the basic features?
- Who will use it?

Use defaults, add details later.
