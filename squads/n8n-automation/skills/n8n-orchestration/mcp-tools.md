# n8n MCP Tools Expert

Expert guide for using `n8n-mcp` effectively.

## Core Tools (Status/Info)
- **`tools_documentation`** - Gets detailed rules and schemas for each MCP tool. Start here if in doubt!
- **`search_nodes`** - Full-text search to find node variants (use `includeExamples: true` for configs, `source: 'community'|'verified'` for community nodes).
- **`get_node`** - Replaces guessing. Returns node details.
  - `mode: 'docs'` gets human-readable format.
  - `mode: 'versions'` or `'compare'` avoids breaking changes.
- **`validate_node`** - Must be run before committing JSON configurations to nodes. Use `mode: 'full'` with strict profiles.
- **`search_templates`** - Finds proven architectures for webhooks, DBs, APIs. Modes: keyword, by_nodes, by_task, by_metadata.
- **`get_template`** - Returns actual flow JSON structure. Modes: nodes_only, structure, full.

## Management Tools (Require API Auth)
- **`n8n_create_workflow`** - Automatically creates workflows in instance.
- **`n8n_get_workflow`** - Can get minimal, structure, or full representations of flows.
- **`n8n_update_partial_workflow`** - Diff operations to not break nodes unnecessarily.
- **`n8n_test_workflow`** - Trigger executions mapped to webhook data.
- **`n8n_executions`** - Inspect running instances.

## Validation Profiles 
If executing `validate_node`, know that `minimal` checks required fields in <100ms. Keep `ai-friendly` for typical development.

## Node Types Difference
- `nodes-base.*` (Usually older core nodes).
- `n8n-nodes-base.*` (More recent node formats/modules).
