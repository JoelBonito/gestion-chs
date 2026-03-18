---
description: Investigates and fixes buggy n8n nodes, execution errors or false validation positives.
---

# /n8n-debug - Root-cause Error Investigation

$ARGUMENTS

---

## Purpose
Systematically analyze a broken n8n instance/node and fix it according to syntax and structure rules.

## Fluxo de Execução

1. **Determine Error Scope:**
   - Ask the user for the error log from the n8n UI or the execution list (`n8n_executions`).
2. **Identify Common Anti-Patterns:**
   - Is it a JavaScript Type Error? (E.g. lacking `[{json: ...}]`).
   - Is it a Python Library constraints error?
   - Is it a Webhook payload issue? ($json.body).
3. **Property Validation:**
   - Use `validate_node` tool specifically on the suspected incorrect Node config.
4. **Patch Node:**
   - Re-draft the required configuration or code node fixing the errors identified. Provide it to the user.
