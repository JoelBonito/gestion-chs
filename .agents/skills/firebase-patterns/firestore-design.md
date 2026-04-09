# Firestore Data Modeling

> Firestore is NOT SQL. Stop thinking in tables, rows, and JOINs. Think in documents, collections, and ownership hierarchies.

---

## Core Principles

### 1. Model for Your Queries, Not Your Entities

In SQL, you normalize first and query later (JOIN at read time).
In Firestore, you design your schema around how you READ data:

```
SQL thinking:    "What are my entities?" → Tables → JOINs at read time
Firestore:       "What does my UI need to display?" → Structure data to answer that in ONE read
```

### 2. Denormalization is Normal

Duplicating data is expected and encouraged when it avoids extra reads:

```typescript
// GOOD: User name stored in both places (denormalized)
// users/{userId} → { name: "Joel", email: "..." }
// campaigns/{id} → { ownerId: "userId", ownerName: "Joel", ... }
//   ↑ Avoids a second read to show "Created by Joel" in campaign list

// BAD: Normalized (requires 2 reads for every campaign display)
// campaigns/{id} → { ownerId: "userId" }
//   ↑ Must fetch users/{userId} separately to get the name
```

**When to denormalize:**
- Data is read 10x+ more than written
- The duplicated field changes rarely (name, email — not "last_login")
- You need it for list views (showing 20 campaigns with owner names = 21 reads vs 1)

**When NOT to denormalize:**
- Data changes frequently (timestamps, counters)
- Data is sensitive and rules differ per location

### 3. Ownership Determines Structure

The question "who owns this data?" determines whether it's a subcollection or root collection:

```
User owns it?         → users/{userId}/data/{id}
Shared across users?  → root collection with ownerId field
System-wide?          → root collection with admin-only rules
```

---

## Subcollections vs Root Collections

### Subcollections (Default Choice)

Use when data belongs to a parent document:

```
users/{userId}/
  ├── sessions/{sessionId}      → User's AI sessions
  ├── history/{historyId}       → User's interaction history
  └── settings/{settingId}      → User preferences

clients/{clientId}/
  ├── contacts/{contactId}      → Client's contact list
  └── notes/{noteId}            → Notes about client
```

**Advantages:**
- Security Rules are simple: `allow read, write: if isOwner(userId)`
- Queries are scoped by default (no `where("userId", "==", uid)` needed)
- No risk of accidentally reading another user's data
- Firestore indexes are per-collection (smaller, faster)

**Disadvantages:**
- Cannot query across all users' subcollections (no `collectionGroup` without index)
- Need `collectionGroup` queries for admin dashboards

### Root Collections (When Needed)

Use when you need cross-user queries or shared data:

```
campaigns/{campaignId}          → Shared campaigns (ownerId field for security)
templates/{templateId}          → System-wide templates
notifications/{notificationId}  → Global notification queue
```

**When to use root collections:**
- Admin dashboards that list ALL records across users
- Shared resources (templates, configs)
- Queue/job systems (process next item regardless of owner)
- Data that participates in `collectionGroup` queries frequently

### Decision Matrix

| Scenario | Structure | Why |
|----------|-----------|-----|
| User's personal data | `users/{uid}/data/{id}` | Security by structure |
| User's chat messages | `users/{uid}/messages/{id}` | Scoped, secure |
| All campaigns (admin needs to list all) | `campaigns/{id}` with `ownerId` | Cross-user query needed |
| Campaign's send logs | `campaigns/{id}/send_logs/{logId}` | Belongs to campaign, can grow large |
| System templates | `templates/{id}` | Shared, no owner |
| Notification queue | `notifications/{id}` | Workers process any user's items |

---

## Data Types: When to Use What

### Arrays (max ~100 items)

```typescript
// GOOD: Short, bounded lists that are read together
{
  tags: ["ai", "dental", "premium"],          // Filter tags
  permissions: ["read", "write", "admin"],     // Role permissions
  recentSearches: ["implante", "clareamento"] // Last 5 searches
}

// BAD: Arrays that grow unbounded
{
  allMessages: [...]  // Will hit 1MB doc limit eventually
}
```

**Array operations:**
- `arrayUnion()` — Add without duplicates
- `arrayRemove()` — Remove by value
- `where("tags", "array-contains", "ai")` — Query items containing value
- `where("tags", "array-contains-any", ["ai", "dental"])` — Query items containing any

### Maps (nested objects)

```typescript
// GOOD: Structured metadata read together
{
  address: {
    street: "Rua X",
    city: "Lisboa",
    country: "PT"
  },
  quotas: {
    daily: 100,
    used: 42,
    resetAt: Timestamp
  }
}

// BAD: Maps used as dynamic key-value stores with 1000+ keys
{
  userScores: { "uid1": 100, "uid2": 200, ... }  // Use subcollection instead
}
```

**Rule:** Maps for structured, bounded data. Subcollections for dynamic, growing data.

### Subcollections (unbounded data)

```typescript
// When data can grow indefinitely
users/{userId}/sessions/{sessionId}     // Could be 10 or 10,000
campaigns/{id}/send_logs/{logId}        // Could be millions
```

---

## Composite Indexes

### When You Need Them

Firestore requires composite indexes for queries with:
- Multiple `where` clauses on different fields
- `where` + `orderBy` on different fields
- `array-contains` + other filters

### Proactive Index Definition

Define indexes in `firestore.indexes.json` BEFORE hitting errors:

```json
{
  "indexes": [
    {
      "collectionGroup": "campaigns",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "send_logs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "scheduledAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Common Index Patterns

| Query Pattern | Index Needed |
|---------------|-------------|
| `where("ownerId", "==", uid).orderBy("createdAt", "desc")` | `ownerId ASC, createdAt DESC` |
| `where("status", "==", "active").where("type", "==", "sms")` | `status ASC, type ASC` |
| `where("tags", "array-contains", "ai").orderBy("updatedAt")` | `tags ARRAY, updatedAt ASC` |
| `collectionGroup("send_logs").where("status", "==", "pending")` | `status ASC` (COLLECTION_GROUP scope) |

### Index Management Rules

1. **Define proactively** — Don't wait for runtime errors
2. **Deploy with code** — `firebase deploy --only firestore:indexes`
3. **Audit quarterly** — Remove unused indexes (they cost storage)
4. **Max 200 indexes** per database — Be intentional

---

## Pagination

### Cursor-Based (Recommended)

```typescript
// First page
const first = query(
  collection(db, "campaigns"),
  where("ownerId", "==", uid),
  orderBy("createdAt", "desc"),
  limit(20)
);

// Next page (using last document as cursor)
const next = query(
  collection(db, "campaigns"),
  where("ownerId", "==", uid),
  orderBy("createdAt", "desc"),
  startAfter(lastDoc),
  limit(20)
);
```

**Rules:**
- Always use `startAfter(lastDoc)` — not `offset()` (Firestore has no offset)
- Store last document snapshot for pagination state
- `limit()` is your page size

### Count Without Reading All Documents

```typescript
// Firestore count aggregation (no document reads billed)
const snapshot = await getCountFromServer(
  query(collection(db, "campaigns"), where("ownerId", "==", uid))
);
const count = snapshot.data().count;
```

---

## Document Size and Read Cost

| Limit | Value | Implication |
|-------|-------|-------------|
| Max document size | 1 MiB | Arrays/maps can't grow forever |
| Max fields per document | 20,000 | Rarely a problem |
| Read cost | 1 read per document | Denormalize to reduce reads |
| Write cost | 1 write per document | Batch writes for atomicity |
| Max batch size | 500 operations | Split larger batches |

### Cost Optimization

1. **Read less:** Denormalize to avoid extra reads
2. **Query less:** Use subcollections to scope queries naturally
3. **Paginate:** Never load all documents at once
4. **Use `select()`:** Only fetch fields you need
5. **Cache:** Enable Firestore persistence on client for offline/cache

```typescript
// Only fetch fields needed for a list view
const q = query(
  collection(db, "campaigns"),
  where("ownerId", "==", uid),
  orderBy("createdAt", "desc"),
  limit(20)
);
// Note: Firestore Web SDK doesn't support select() — it fetches full documents.
// Use Admin SDK's select() in Cloud Functions for server-side optimization.
```
