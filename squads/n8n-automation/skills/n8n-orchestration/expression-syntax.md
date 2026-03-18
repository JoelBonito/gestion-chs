# n8n Expression Syntax

Teaches correct n8n expression syntax `{{ }}` and common patterns to prevent hallucinations.

## Core Variables
- `$json`: Accesses the data inside the current item's JSON payload.
- `$node`: Accesses data from previous nodes by name (e.g. `$node["Webhook"].json.body`).
- `$now`: Current DateTime. Used as `$now.minus({'days': 1})`.
- `$env`: Environment variable resolution.

## Critical Gotcha: Webhook Data
If a node receives data from a Webhook setup, the request body is **NOT structured directly** inside `$json`.
- **CORRECT:** `{{ $json.body.myField }}`
- **INCORRECT:** `{{ $json.myField }}`

Always drill into `.body`, or `.query` depending on the HTTP method of the webhook.

## Common Mistakes & Fixes
- Avoid using complex expressions for data transformation. Use a Code Node if the logic goes beyond simple ternary or property accessing.
- Strings inside expressions require single quotes or valid parsing if mixed.
- Expressions DO NOT execute multiple statements.

## When NOT to use expressions
If you need complex manipulation (loops, async fetches, grouping), write a Code node in JS instead of bloating expressions.
