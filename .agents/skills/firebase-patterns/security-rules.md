# Firestore Security Rules

> Security Rules are NOT middleware. They run on every read/write at the database level. If the rules reject, the operation never happens — no workaround from client code.

---

## Core Architecture: Middleware Functions

Centralize auth checks in reusable functions at the top of your rules file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // MIDDLEWARE FUNCTIONS (reuse everywhere)
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    function isOwnerOrAdmin(userId) {
      return isOwner(userId) || isAdmin();
    }

    // ============================================
    // DATA VALIDATION HELPERS
    // ============================================

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    function isValidString(field, minLen, maxLen) {
      return request.resource.data[field] is string
        && request.resource.data[field].size() >= minLen
        && request.resource.data[field].size() <= maxLen;
    }

    function isValidTimestamp(field) {
      return request.resource.data[field] is timestamp;
    }

    // ============================================
    // COLLECTION RULES
    // ============================================

    // User profiles — owner only
    match /users/{userId} {
      allow read: if isOwnerOrAdmin(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Never delete user docs from client

      // User subcollections — inherit owner check
      match /sessions/{sessionId} {
        allow read, write: if isOwner(userId);
      }

      match /history/{historyId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId);
        allow update, delete: if false; // History is immutable
      }
    }

    // Campaigns — owner or admin
    match /campaigns/{campaignId} {
      allow read: if isAuthenticated()
        && (resource.data.ownerId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated()
        && request.resource.data.ownerId == request.auth.uid
        && hasRequiredFields(["title", "ownerId", "status"]);
      allow update: if resource.data.ownerId == request.auth.uid;
      allow delete: if isAdmin();

      // Send logs — read by owner, write by functions only
      match /send_logs/{logId} {
        allow read: if isAuthenticated()
          && get(/databases/$(database)/documents/campaigns/$(campaignId)).data.ownerId == request.auth.uid;
        allow write: if false; // Only Cloud Functions write logs
      }
    }

    // Templates — read by any auth user, write by admin only
    match /templates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Default deny — CRITICAL
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Rule Patterns

### Pattern 1: Owner-Only Data

```
match /users/{userId} {
  allow read, write: if isOwner(userId);
}
```

Use for: User profiles, personal settings, private data.

### Pattern 2: Owner + Admin

```
match /clients/{clientId} {
  allow read: if resource.data.ownerId == request.auth.uid || isAdmin();
  allow write: if resource.data.ownerId == request.auth.uid;
}
```

Use for: Business data that admins need to view/manage.

### Pattern 3: Functions-Only Write

```
match /analytics/{docId} {
  allow read: if isAdmin();
  allow write: if false; // Only Cloud Functions write
}
```

Use for: Logs, analytics, system-generated data. Cloud Functions use Admin SDK which bypasses rules.

### Pattern 4: Create-Only (Immutable After Creation)

```
match /audit_log/{logId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated();
  allow update, delete: if false;
}
```

Use for: Audit logs, transaction history, feedback submissions.

### Pattern 5: Validated Creates

```
match /contacts/{contactId} {
  allow create: if isAuthenticated()
    && hasRequiredFields(["name", "phone", "ownerId"])
    && request.resource.data.ownerId == request.auth.uid
    && isValidString("name", 1, 100)
    && isValidString("phone", 8, 20);
}
```

Use for: Any user-created data that needs schema validation.

---

## Common Pitfalls

| Pitfall | Impact | Fix |
|---------|--------|-----|
| `allow read, write: if true` in production | Anyone can read/delete all data | Never deploy open rules — use emulators |
| Missing default deny at bottom | Undocumented paths are open | Always add `match /{document=**} { allow read, write: if false; }` |
| `isAdmin()` calls `get()` on every request | 1 extra read per rule evaluation | Cache admin status in custom claims instead |
| No write validation | Client can write garbage data | Always validate required fields and types |
| Recursive wildcards `{document=**}` with allow | Opens all subcollections | Use specific paths, recursive only for deny |
| Forgetting subcollection inheritance | Subcollection rules don't inherit parent | Write explicit rules for each subcollection |

---

## Custom Claims vs. Firestore Lookup for Roles

### Option A: Custom Claims (Recommended for Roles)

```typescript
// Set via Admin SDK in Cloud Function
import { getAuth } from "firebase-admin/auth";

await getAuth().setCustomUserClaims(uid, { admin: true });

// Use in Security Rules (NO extra read)
function isAdmin() {
  return request.auth.token.admin == true;
}
```

**Pros:** No extra Firestore read, instant evaluation.
**Cons:** Max 1000 bytes, requires function to set, propagates on next token refresh.

### Option B: Firestore Lookup (Current Pattern)

```
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

**Pros:** No function needed to set roles, roles update immediately.
**Cons:** 1 extra Firestore read per rule evaluation (costs money at scale).

**Recommendation:** Use custom claims for high-frequency checks (isAdmin). Use Firestore lookup for complex role hierarchies.

---

## Storage Rules

Same middleware pattern applies to Firebase Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    // User uploads — scoped to their folder
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024  // 10MB max
        && request.resource.contentType.matches('image/.*'); // Images only
    }

    // Public assets — read only
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## Testing Rules with Emulators

### Setup

```bash
firebase emulators:start --only firestore
```

### Test with @firebase/rules-unit-testing

```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";

const testEnv = await initializeTestEnvironment({
  projectId: "test-project",
  firestore: {
    rules: readFileSync("firestore.rules", "utf8"),
  },
});

// Test as authenticated user
const userContext = testEnv.authenticatedContext("user-123");
const userDb = userContext.firestore();

// Should succeed — owner reading own data
await assertSucceeds(
  getDoc(doc(userDb, "users/user-123"))
);

// Should fail — reading another user's data
await assertFails(
  getDoc(doc(userDb, "users/other-user"))
);

// Test as unauthenticated
const anonContext = testEnv.unauthenticatedContext();
const anonDb = anonContext.firestore();

await assertFails(
  getDoc(doc(anonDb, "users/user-123"))
);
```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```
