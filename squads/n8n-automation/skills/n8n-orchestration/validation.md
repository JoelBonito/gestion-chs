# n8n Validation Expert

Interpret validation errors from n8n MCP and guide fixing properly.

## Common Validation Loops & Fixing Strategy
- If a Validation fails for `Missing required property`, never assume a default value can be passed—explicitly pass standard strings or correct boolean structures.
- False Positives: Some nodes heavily rely on expression evaluation which cannot be validated easily statically. Learn the difference between static config errors and dynamic param warnings.
- Profiles: Development focuses on `runtime` or `ai-friendly`. Testing prefers `strict`.

## The Validation Loop Workflow
1. Use `validate_node`.
2. Inspect `errors` and `warnings` returned by MCP.
3. Isolate the property path.
4. Use `get_node` with `search_properties` mode to find appropriate enums or expected types.
5. Re-author JSON node configuration.
6. Commit.

## Auto-Sanitization Behavior
n8n automatically cleans properties not specified in the node's schema. Therefore, trying to append rogue variables to standard node JSONs will silently drop them. Always use `Edit Fields (Set)` to move custom data downwards.
