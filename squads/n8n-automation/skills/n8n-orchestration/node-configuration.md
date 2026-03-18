# n8n Node Configuration

Operation-aware node configuration guidance.

## Property Dependency Rules 
Certain properties only become required (or available) when other properties are set.
- Example: `sendBody` must be `true` for `contentType` to appear in HTTP Node.
- Example: Branching conditional IF nodes require explicitly defining the condition structures.

## AI Connection Types (8 Types)
When building Agent and AI workflows, nodes snap together through connection types mapping.
Ensure you connect "Memory" nodes to "Memory" inputs on the AI Agent node, or "Tool" nodes to the "Tools" input.

## Common Configuration Patterns (Smart Parameters)
- Always specify operations explicitly (`operation: 'create'`, `operation: 'get'`).
- In IF Nodes, use `branch="true"`.
- Never trust documentation default examples natively without confirming with `get_node` parameter schema!
