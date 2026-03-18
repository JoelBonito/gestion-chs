# n8n Code Nodes

Write effective JavaScript or Python code in n8n Code nodes. Know the rules and boundaries.

## JavaScript (Primary Choice for 95% of usecases)
- **Data Access Patterns:** Use `$input.all()` across all incoming items, `$input.first()` for flat arrays, `$input.item` per loop.
- **CRITICAL REQUIREMENT:** The correct return format for n8n code nodes is ALWAYS an Array of JSON structures.
  - ✅ `return [{ json: { myData: "Success" } }];`
  - ❌ `return { myData: "Error" };`
  - ❌ `return JSON.stringify({ myData: "Error" });`
- **Helpers:** Use `$helpers.httpRequest()` instead of trying to hack native fetch commands whenever available.
- **Dates:** Use native JS `DateTime` object. Also `$jmespath()` is native.

## Python (Strict Constraints)
- **Data Access:** `_input`, `_json`, `_node` (Notice the underscore instead of dollar sign!).
- **CRITICAL LIMITATION:** You **CANNOT import external libraries** inside native n8n python nodes (no `requests`, no `pandas`, no `numpy`). Do not try pip installs. Emulate logic with `json`, `datetime`, `re`, `math` standard libraries only.
- **Return Requirements:** Just like JS, return an array of dictionaries representing n8n items.

## Troubleshooting Error Patterns
- `Cannot read property X of undefined` → Missing `?.` optional chaining or data is wrapped inside nested `.body`.
- `Execution halted` → Code took too long, chunk requests!
