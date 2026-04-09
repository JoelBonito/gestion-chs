# Cloud Functions v2 Patterns

> Cloud Functions are NOT Express servers. They are stateless, cold-startable, event-driven units. Design accordingly.

---

## Function Types and When to Use Each

### onCall — Frontend-Initiated (Most Common)

The default choice for any operation initiated by the frontend UI:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const generateLesson = onCall(
  {
    region: "europe-west1",
    memory: "1GiB",           // Increase for LLM SDK
    timeoutSeconds: 120,      // Increase for AI generation
    minInstances: 1,          // CRITICAL for AI functions — avoids cold start
  },
  async (request) => {
    // Auth is automatic — request.auth is populated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { topic, level } = request.data;

    // Validate input
    if (!topic || !level) {
      throw new HttpsError("invalid-argument", "topic and level are required");
    }

    // Business logic
    const lesson = await aiService.generate(topic, level);

    // Return typed data (automatically serialized)
    return { lesson, generatedAt: new Date().toISOString() };
  }
);
```

**Why onCall over onRequest for frontend:**
- Automatic auth token verification
- Automatic CORS handling
- Typed request/response (no manual parsing)
- Callable from Firebase SDK directly

### onRequest — External Webhooks

For receiving HTTP requests from external services (WhatsApp API, payment gateways, etc.):

```typescript
import { onRequest } from "firebase-functions/v2/https";

export const receiveWebhook = onRequest(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    // No minInstances — webhooks can tolerate cold starts
  },
  async (req, res) => {
    // Verify webhook signature (CRITICAL for security)
    if (!verifySignature(req)) {
      res.status(401).send("Invalid signature");
      return;
    }

    // Process webhook payload
    const event = req.body;
    await processWebhookEvent(event);

    // Always respond quickly — process async if needed
    res.status(200).send("OK");
  }
);
```

**When to use:**
- External service webhooks (WhatsApp, Stripe, etc.)
- Public endpoints (no Firebase auth)
- Custom HTTP methods/headers needed

### onDocumentCreated/Updated/Written — Firestore Triggers

React to data changes:

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onSessionCreated = onDocumentCreated(
  {
    document: "users/{userId}/sessions/{sessionId}",
    region: "europe-west1",
    memory: "512MiB",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const sessionData = snapshot.data();
    const { userId, sessionId } = event.params;

    // Process the new session
    await notifyUser(userId, sessionData);
  }
);
```

**Trigger types:**
| Trigger | Fires When | Use For |
|---------|-----------|---------|
| `onDocumentCreated` | New document created | Send welcome email, initialize data |
| `onDocumentUpdated` | Existing document changed | Status change handlers, sync denormalized data |
| `onDocumentDeleted` | Document deleted | Cleanup related data, audit logging |
| `onDocumentWritten` | Any write (create/update/delete) | Catch-all, use `event.data.before`/`after` |

**Important:** Firestore triggers can fire multiple times. Make handlers **idempotent**.

### onSchedule — Cron Jobs

Periodic tasks:

```typescript
import { onSchedule } from "firebase-functions/v2/scheduler";

export const dailyCleanup = onSchedule(
  {
    schedule: "every day 03:00",    // UTC
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 540,            // 9 min for batch operations
  },
  async (event) => {
    // Process in batches to avoid timeout
    const expired = await getExpiredItems();
    await processBatch(expired, 500); // 500 per batch
  }
);

export const campaignQueueProcessor = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "europe-west1",
    memory: "512MiB",
  },
  async (event) => {
    await processNextCampaignBatch();
  }
);
```

---

## Cold Start Optimization (CRITICAL)

### The Problem

Cold starts happen when a function instance is created from scratch. With LLM SDKs (@google/genai, openai), cold starts can take **5-15 seconds** due to SDK initialization.

### Solutions (By Priority)

#### 1. minInstances (Most Effective)

```typescript
export const generateWithAI = onCall(
  {
    minInstances: 1,      // Always keep 1 instance warm
    memory: "1GiB",       // LLM SDKs need memory
    region: "europe-west1",
  },
  async (request) => { /* ... */ }
);
```

**Cost:** ~$0.06/hour per idle instance (1GiB). Worth it for user-facing AI functions.

**When to use minInstances:**
- User-facing AI/LLM functions (latency-sensitive)
- Critical onCall functions with high traffic
- Functions that import heavy SDKs

**When NOT to use:**
- Scheduled functions (run on cron, cold start is fine)
- Webhook receivers (external services tolerate latency)
- Low-traffic admin functions

#### 2. Lazy Initialization

```typescript
// BAD: Top-level initialization (runs on EVERY cold start even if not needed)
import { GoogleGenerativeAI } from "@google/genai";
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

// GOOD: Initialize only when the specific function runs
let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!_model) {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    _model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return _model;
}

export const generateContent = onCall(async (request) => {
  const model = getModel(); // Only initializes once per instance
  // ...
});
```

#### 3. Separate Entry Points

Split heavy functions into separate files so cold starts only load what's needed:

```
functions/src/
  ├── index.ts              → Re-exports all functions
  ├── ai/
  │   ├── generate.ts       → AI functions (heavy imports)
  │   └── analyze.ts
  ├── webhooks/
  │   ├── whatsapp.ts       → Webhook handlers (light)
  │   └── stripe.ts
  └── scheduled/
      ├── cleanup.ts        → Cron jobs
      └── queue.ts
```

```typescript
// index.ts — Only re-export, don't import heavy modules
export { generateLesson } from "./ai/generate";
export { receiveWebhook } from "./webhooks/whatsapp";
export { dailyCleanup } from "./scheduled/cleanup";
```

#### 4. Regional Deployment

Deploy to the region closest to your Firestore:

```typescript
// If Firestore is in europe-west1, deploy functions there too
{ region: "europe-west1" }
```

---

## Concurrency and Race Conditions

### The Problem

Multiple function instances can run simultaneously, causing race conditions when updating shared Firestore documents (e.g., campaign status, counters, queues).

### Solution 1: Firestore Transactions

```typescript
import { getFirestore, FieldValue } from "firebase-admin/firestore";

async function decrementQuota(userId: string, amount: number): Promise<boolean> {
  const db = getFirestore();
  const userRef = db.doc(`users/${userId}`);

  return db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    const currentQuota = userDoc.data()?.quotas?.remaining ?? 0;

    if (currentQuota < amount) {
      return false; // Not enough quota
    }

    tx.update(userRef, {
      "quotas.remaining": FieldValue.increment(-amount),
      "quotas.lastUsed": FieldValue.serverTimestamp(),
    });
    return true;
  });
}
```

### Solution 2: Batch Writes for Atomicity

```typescript
async function processCampaignBatch(campaignId: string, contacts: Contact[]) {
  const db = getFirestore();
  const batch = db.batch();

  for (const contact of contacts.slice(0, 500)) { // Max 500 per batch
    const logRef = db.collection(`campaigns/${campaignId}/send_logs`).doc();
    batch.set(logRef, {
      contactId: contact.id,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // Update campaign counter atomically in same batch
  const campaignRef = db.doc(`campaigns/${campaignId}`);
  batch.update(campaignRef, {
    "stats.queued": FieldValue.increment(contacts.length),
  });

  await batch.commit();
}
```

### Solution 3: Status Machine Pattern

For campaign/queue processing, use a status machine to prevent double-processing:

```typescript
async function claimNextJob(queueCollection: string): Promise<DocumentSnapshot | null> {
  const db = getFirestore();

  // Atomically claim the next pending job
  return db.runTransaction(async (tx) => {
    const pending = await tx.get(
      db.collection(queueCollection)
        .where("status", "==", "pending")
        .orderBy("createdAt")
        .limit(1)
    );

    if (pending.empty) return null;

    const job = pending.docs[0];
    // Atomically change status — if another worker got here first, transaction retries
    tx.update(job.ref, {
      status: "processing",
      claimedAt: FieldValue.serverTimestamp(),
      workerId: process.env.K_REVISION || "unknown",
    });

    return job;
  });
}
```

**Status flow:**
```
pending → processing → completed
                    → failed → pending (retry)
```

---

## Error Handling

### onCall Errors (Return to Frontend)

```typescript
import { HttpsError } from "firebase-functions/v2/https";

// Throw HttpsError for expected errors — frontend receives structured error
throw new HttpsError("not-found", "Campaign not found");
throw new HttpsError("permission-denied", "Not the campaign owner");
throw new HttpsError("resource-exhausted", "Daily quota exceeded");
throw new HttpsError("failed-precondition", "Campaign already sent");

// For unexpected errors, let them throw naturally — returns "internal" to frontend
```

### Retry-Safe Triggers

Firestore triggers can fire multiple times. Protect against double processing:

```typescript
export const onPaymentCreated = onDocumentCreated(
  { document: "payments/{paymentId}" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    // Idempotency check — skip if already processed
    if (data.processed === true) return;

    await processPayment(data);

    // Mark as processed to prevent re-runs
    await event.data?.ref.update({ processed: true });
  }
);
```

---

## Testing with Emulators

### Setup

```bash
# Start emulators
firebase emulators:start --only auth,firestore,functions,storage

# Or with data import
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Connecting Functions to Emulators

```typescript
// In your function code — automatic when running in emulator
// No code changes needed — Firebase SDK detects emulator environment

// For manual connection in tests:
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
```

### Testing onCall Functions

```typescript
import { functionsTestInit } from "firebase-functions-test";
const test = functionsTestInit();

describe("generateLesson", () => {
  it("should generate a lesson for authenticated user", async () => {
    const wrapped = test.wrap(generateLesson);
    const result = await wrapped({
      data: { topic: "implantes", level: "beginner" },
      auth: { uid: "test-user-123", token: {} },
    });

    expect(result.lesson).toBeDefined();
  });
});
```
