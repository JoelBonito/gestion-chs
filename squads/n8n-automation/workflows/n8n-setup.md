---
description: Configures the n8n MCP server (Cloud or Local/Docker) securely inside the workspace MCP config.
---

# /n8n-setup - Initialize n8n MCP

$ARGUMENTS

---

## Purpose
Sets up the n8n-mcp server to connect the AI framework to an n8n instance using interactive configuration.

## Fluxo de Execução

1. **Ask User Options:**
   - Option A: Hosted Service (Cloud, simple API Key)
   - Option B: Self-Hosted Docker or NPX
2. **Retrieve API Data:**
   - Prompt the user to provide their N8N_API_URL and N8N_API_KEY. Warn them not to copy-paste the whole URL if they don't know the exact trailing slash requirements.
3. **Execute Configuration Script:**
   - Silently invoke `python squads/n8n-automation/scripts/setup_n8n_mcp.py` passing arguments appropriately or instructing the user if direct write isn't safely possible.
4. **Validate Connection:**
   - Request the user to reload their MCP config in the IDE/AI.
   - Use the `search_nodes` MCP tool to verify connection if possible.
