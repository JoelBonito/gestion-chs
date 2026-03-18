---
description: Preview server start, stop, and status check. Local development server management.
---

# /preview - Preview Management

$ARGUMENTS

---

## Regras Críticas

1. **PORTA VERIFICADA** — Sempre verificar se a porta está livre antes de iniciar o servidor.
2. **HEALTH CHECK** — Confirmar que o servidor está respondendo antes de informar sucesso.
3. **CONFLITO TRATADO** — Se a porta estiver em uso, oferecer alternativas ao usuário.
4. **SCRIPT OFICIAL** — Usar `auto_preview.py` para gerenciar o servidor de preview.

## Fluxo de Execução

Manage preview server: start, stop, status check.

### Commands

```
/preview           - Show current status
/preview start     - Start server
/preview stop      - Stop server
/preview restart   - Restart
/preview check     - Health check
```

---

## Usage Examples

### Start Server
```
/preview start

Response:
🚀 Starting preview...
   Port: 3000
   Type: Next.js

✅ Preview ready!
   URL: http://localhost:3000
```

### Status Check
```
/preview

Response:
=== Preview Status ===

🌐 URL: http://localhost:3000
📁 Project: C:/projects/my-app
🏷️ Type: nextjs
💚 Health: OK
```

### Port Conflict
```
/preview start

Response:
⚠️ Port 3000 is in use.

Options:
1. Start on port 3001
2. Close app on 3000
3. Specify different port

Which one? (default: 1)
```

---

## Technical

Auto preview uses `auto_preview.py` script:

```bash
python3 .agents/scripts/auto_preview.py start [port]
python3 .agents/scripts/auto_preview.py stop
python3 .agents/scripts/auto_preview.py status
```

