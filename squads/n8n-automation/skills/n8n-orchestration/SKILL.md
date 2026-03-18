---
name: n8n-orchestration
description: n8n workflow automation principles, patterns, and validation. Expression syntax, node configuration, MCP tools usage, code node patterns.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# n8n Orchestration

This skill unifies all essential knowledge required to build, validate, and manage n8n workflows robustly.

## Content Map

| File | Sub-topic | When to Read |
|------|-----------|--------------|
| `expression-syntax.md` | `{{ }}`, `$json`, `$node`, `$now`, webhooks | Writing expressions, data binding issues |
| `mcp-tools.md` | n8n-mcp Server Tools | Finding node templates, validation, structure rules |
| `workflow-patterns.md` | 5 architectural patterns | Designing flow topologies (Webhook, AI, Cron) |
| `validation.md` | Investigation, auto-fix, falses | Debugging a failing node or execution |
| `node-configuration.md` | Property configs, AI connections | Using complex nodes or nested parameters |
| `code-nodes.md` | JS rules, Python core libraries | Writing anything inside "Code" node |

## Related Skills
- `api-patterns`
- `mcp-builder`
- `deployment-procedures`

## Anti-Patterns (DON'T DO THIS)
- ❌ Do not assume `$json` contains body directly from a Webhook! Use `$json.body`.
- ❌ Do not write python code that imports external packages inside the n8n python node.
- ❌ Do not write JavaScript code nodes that return plain objects. ALWAYS array of JSON `[{ json: {...} }]`.
- ❌ Do not ignore validation warnings when writing configurations manually.
