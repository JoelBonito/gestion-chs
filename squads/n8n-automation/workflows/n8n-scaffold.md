---
description: Scaffolds a new n8n workflow from scratch based on user requirements.
---

# /n8n-scaffold - Generate New n8n Workflow

$ARGUMENTS

---

## Purpose
To architects and publish a complete n8n workflow using MCP API nodes interactively.

## Fluxo de Execução

1. **Extract Requirements:**
   - Ask trigger conditions, APIs to access, data transformations needed, and destinations.
2. **Template Search (Crucial):**
   - Use `search_templates` MCP tool to find proven boilerplate for the problem.
3. **Node Discovery:**
   - Use `search_nodes` to accurately determine the exact node configurations (NodeTypes).
4. **Draft JSON:**
   - Draft the workflow JSON in markdown.
5. **Publish / Provide:**
   - If user has Write access configured (via `n8n_create_workflow`), automatically publish it. Else, provide the JSON block for the user to copy-paste into n8n.
