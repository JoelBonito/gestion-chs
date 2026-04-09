---
name: firebase-patterns
description: Firebase development patterns for Firestore data modeling, Cloud Functions v2, Security Rules, and SDK version management. Optimized for React+Vite+TypeScript stacks with heavy Cloud Functions and subcollection-based architectures.
allowed-tools: Read, Glob, Grep, Bash
---

# Firebase Patterns Skill

> **Purpose:** Provide Firebase-specific architectural guidance that generic backend/database skills cannot cover. Firestore is NOT SQL. Cloud Functions are NOT Express servers. Security Rules are NOT middleware.
> **Core Principle:** Firebase is a paradigm, not just a database. Every decision (modeling, security, functions) is interconnected. A bad Firestore model creates bad Security Rules and expensive Cloud Functions.

---

## Selective Reading Rule (MANDATORY)

**Read REQUIRED files always, OPTIONAL only when needed:**

| File | Status | When to Read |
|------|--------|--------------|
| [firestore-design.md](firestore-design.md) | REQUIRED | Any Firestore schema design, query optimization, or data modeling |
| [cloud-functions.md](cloud-functions.md) | REQUIRED | Any Cloud Functions work (triggers, onCall, onRequest, scheduling) |
| [security-rules.md](security-rules.md) | Optional | When writing or reviewing firestore.rules or storage.rules |
| [version-guide.md](version-guide.md) | Optional | When migrating SDK versions or setting up new projects |

> **firestore-design.md + cloud-functions.md = ALWAYS READ for Firebase tasks. Others = only when relevant.**

---

## Stack Context

This skill is optimized for the following stack (most common across projects):

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | React 19, Vite 6+ |
| Styling | Tailwind CSS | v4 |
| State | Zustand | Latest |
| Firebase Web SDK | Modular (tree-shakeable) | v12.x (latest) |
| Firebase Admin SDK | Node.js | v13.x |
| Cloud Functions | v2 API | Node 22, TypeScript |
| Emulators | Full suite | Auth, Firestore, Functions, Storage |

> **If project uses a different stack**, adapt patterns accordingly but keep the principles.

---

## Decision Framework

### When Designing Firestore Schema

```
1. Who OWNS this data? → That's the root/parent collection
2. Who READS this data? → That determines query patterns
3. Who WRITES this data? → That determines Security Rules
4. How LARGE will it grow? → Subcollection if unbounded, map/array if bounded (<100 items)
5. Do I need CROSS-USER queries? → If yes, consider root collection with userId field
```

### When Choosing Function Trigger Type

```
1. Frontend calls directly? → onCall (typed, auth-aware)
2. External webhook? → onRequest (raw HTTP)
3. React to data change? → onDocumentCreated/Updated/Written
4. Periodic job? → onSchedule
5. Need low latency? → Set minInstances, use onCall with regional config
```

### When Writing Security Rules

```
1. Start with DENY ALL (default)
2. Add isAuthenticated() for any logged-in access
3. Add isOwner(userId) for personal data
4. Add isAdmin() for admin-only operations
5. Validate data shape on writes (hasAll, type checks)
6. Test with emulators BEFORE deploying
```

---

## Common Patterns by Project Type

### SaaS with User Data (Most Common)

```
Firestore:
  users/{userId}                    → Profile, settings
  users/{userId}/sessions/{id}      → User sessions
  users/{userId}/data/{id}          → User-specific data
  
  (Optional root for admin queries)
  all_sessions/{id}                 → Denormalized for admin dashboards

Functions:
  onCall: generateContent, processPayment, sendNotification
  onSchedule: dailyCleanup, weeklyReport
  onDocumentCreated: users/{userId}/data/{id} → trigger processing

Rules:
  users/{userId}/** → isOwner(userId)
  all_sessions/{id} → isAdmin()
```

### Automation / Webhook Platform (WhatsApp, CRM)

```
Firestore:
  clients/{clientId}                → Client profiles
  clients/{clientId}/contacts/{id}  → Contact list
  campaigns/{campaignId}            → Campaign config
  campaigns/{campaignId}/send_logs/{id} → Delivery tracking

Functions:
  onRequest: receiveWebhook (from external API)
  onCall: createCampaign, startCampaign
  onSchedule: processCampaignQueue, checkLimits
  onDocumentUpdated: campaigns/{id} → status change handler

Rules:
  clients/{clientId}/** → isOwner(request.auth.uid) || isAdmin()
  campaigns/{campaignId} → resource.data.ownerId == request.auth.uid
```

### AI-Powered App (LLM Integration)

```
Firestore:
  users/{userId}                    → Profile, usage quotas
  users/{userId}/history/{id}       → AI interaction history
  
Functions:
  onCall: generateWithAI (high memory, set minInstances)
  onCall: analyzeContent (with @google/genai or openai SDK)
  onSchedule: syncUsageQuotas

Key concern: Cold starts with LLM SDKs are SEVERE.
  → Set minInstances: 1 for critical AI functions
  → Set memory: 1GiB+ for LLM SDK functions
  → Set timeoutSeconds: 120+ for generation
```

---

## Anti-Patterns (What NOT to Do)

| Anti-Pattern | Why It's Bad | Do This Instead |
|-------------|-------------|-----------------|
| Store everything in one root collection | Impossible to write Security Rules per-user | Subcollections under user ownership |
| Use Realtime Database for structured data | No subcollections, weak queries, no Security Rules functions | Use Firestore |
| Deploy Functions without emulator testing | Rules bugs hit production users | Always test with emulators first |
| Use `onRequest` when `onCall` works | No automatic auth, no typed params, no CORS handling | `onCall` for frontend-initiated calls |
| Ignore composite indexes | Queries fail silently or error in production | Define in `firestore.indexes.json` proactively |
| Set `allow read, write: if true` during dev | Forget to fix before deploy, data breach | Use emulators with proper rules from day 1 |
| Import entire Firebase SDK | Massive bundle, no tree-shaking | Use modular imports: `firebase/firestore` |
| Nest data >3 levels deep | Expensive reads, complex rules, rigid schema | Max 2-3 levels of subcollections |

---

## Integration Points

| Component | Relationship | Direction |
|-----------|-------------|-----------|
| `@backend-specialist` | Primary consumer of this skill for Firebase projects | Skill loaded by agent |
| `@security-auditor` | Reviews Security Rules and auth patterns | Consumes security-rules.md |
| `@database-architect` | Uses firestore-design.md for data modeling | Consumes firestore-design.md |
| `database-design` skill | Generic DB principles — Firebase OVERRIDES these for Firestore | This skill takes precedence |
| `api-patterns` skill | Generic API patterns — Firebase OVERRIDES for onCall/onRequest | This skill takes precedence |
| `nodejs-best-practices` skill | General Node.js — Firebase ADDS Cloud Functions specifics | Complementary |

> **Priority rule:** When working on a Firebase project, `firebase-patterns` takes precedence over `database-design` and `api-patterns` for any Firebase-specific decisions.

---

## MCP Tools (Firebase)

If the Firebase MCP server is available, these tools can be used:

| Tool | Purpose |
|------|---------|
| `firebase_get_environment` | Check current Firebase project and environment |
| `firebase_list_projects` | List accessible Firebase projects |
| `firebase_get_project` | Get project details and config |
| `firebase_get_sdk_config` | Get SDK configuration for web/admin |
| `firebase_get_security_rules` | Fetch current Firestore/Storage Security Rules |
| `firebase_list_apps` | List apps in the Firebase project |

---

## When This Skill Should Be Used

| Scenario | Use? | Notes |
|----------|------|-------|
| New Firebase project setup | YES | Start with firestore-design.md + version-guide.md |
| Firestore schema design | YES | firestore-design.md is the primary reference |
| Cloud Functions development | YES | cloud-functions.md for patterns and optimization |
| Security Rules writing | YES | security-rules.md for middleware patterns |
| SDK version migration | YES | version-guide.md for breaking changes |
| Generic REST API (no Firebase) | NO | Use api-patterns skill instead |
| PostgreSQL/MySQL schema | NO | Use database-design skill instead |
| Frontend React components | NO | Use frontend-specialist agent instead |
