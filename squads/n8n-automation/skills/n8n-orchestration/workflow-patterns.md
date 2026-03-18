# n8n Workflow Patterns

Build workflows using 5 proven architectural patterns instead of reinventing logic.

## 5 Proven Patterns

1. **Webhook Processing:** Start with a Webhook node. Validate input via Switch or If nodes. Send response immediately before long processing (Response Node).
2. **HTTP API Interaction:** Make requests using the HTTP Request node. Configure Auth properly and parse `$json.body` responses properly. Handle pagination if necessary.
3. **Database Integration:** Direct connectors (Postgres, Mongo, etc). Ensure schema matches incoming data models. Batch operations whenever available.
4. **AI Agents (Advanced Nodes):** Use the AI Agent node as the orchestration root. Connect Tools, Memories, and LLMs nodes cleanly via the sub-node dot attachments.
5. **Scheduled Jobs:** Start with a Schedule Trigger (Cron format). Batch inputs and map output carefully to avoid memory timeouts.

## Connection Best Practices
- Never create infinite loops visually.
- Use explicit Switch routing instead of multiple complicated IF nodes.
- Always implement a fallback Catch block to log errors into Slack/Discord/Database instead of silently failing.

## Workflow Creation Checklist
- [ ] Are triggers configured?
- [ ] Are credentials separated correctly?
- [ ] Is error-routing setup?
- [ ] Were Webhook return nodes explicitly set up?
