# Firebase SDK Version Guide

> Firebase SDKs have breaking changes between major versions. This guide covers what matters for the stack we use: Web SDK v10-v12 (modular) and Admin SDK v12-v13.

---

## Current Standard Stack

| SDK | Version | Import Style |
|-----|---------|-------------|
| Firebase Web SDK | **v12.x** (latest) | Modular: `import { getFirestore } from "firebase/firestore"` |
| Firebase Admin SDK | **v13.x** | Modular: `import { getFirestore } from "firebase-admin/firestore"` |
| Cloud Functions SDK | **v2 API** | `import { onCall } from "firebase-functions/v2/https"` |
| Node.js runtime | **22** | Set in `functions/package.json` |

> **Rule:** Always use the latest modular SDK. Never use the compat (v8-style) API in new code.

---

## Web SDK: Modular vs Compat

### Modular (v9+ style) — ALWAYS USE THIS

```typescript
// Tree-shakeable — only imports what you use
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, query, where, orderBy } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, "europe-west1");
const storage = getStorage(app);
```

### Compat (v8 style) — NEVER USE IN NEW CODE

```typescript
// NOT tree-shakeable — imports entire SDK (~300KB+)
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// This syntax is deprecated
firebase.firestore().collection("users").doc(uid).get();
```

**Migration from compat to modular:**

| Compat (OLD) | Modular (NEW) |
|-------------|---------------|
| `firebase.firestore()` | `getFirestore(app)` |
| `db.collection("x").doc("y")` | `doc(db, "x", "y")` |
| `docRef.get()` | `getDoc(docRef)` |
| `docRef.set(data)` | `setDoc(docRef, data)` |
| `docRef.update(data)` | `updateDoc(docRef, data)` |
| `colRef.where("x", "==", y)` | `query(colRef, where("x", "==", y))` |
| `colRef.orderBy("x")` | `query(colRef, orderBy("x"))` |
| `firebase.auth().onAuthStateChanged` | `onAuthStateChanged(auth, callback)` |
| `firebase.functions().httpsCallable("fn")` | `httpsCallable(functions, "fn")` |

---

## Key Breaking Changes by Version

### Web SDK v10 → v11

| Change | Impact | Action |
|--------|--------|--------|
| `firebase/analytics` requires async initialization | `getAnalytics()` may throw if not supported | Wrap in try-catch or check `isSupported()` |
| Improved tree-shaking | Bundle size reduction | No code changes needed |
| `Timestamp` behavior changes | Some timestamp conversions behave differently | Test date handling thoroughly |

### Web SDK v11 → v12

| Change | Impact | Action |
|--------|--------|--------|
| Default to long-polling removed in some environments | WebChannel is default transport | Usually no action needed |
| `FieldValue` usage changes | `arrayUnion`/`arrayRemove` imports may shift | Use `import { arrayUnion } from "firebase/firestore"` |
| Memory cache improvements | Better offline performance | No code changes needed |

### Admin SDK v12 → v13

| Change | Impact | Action |
|--------|--------|--------|
| Node.js 18+ required | Older Node runtimes unsupported | Set `"engines": { "node": "22" }` in functions/package.json |
| Some deprecated APIs removed | `admin.initializeApp()` style fully deprecated | Use modular: `import { initializeApp } from "firebase-admin/app"` |
| Firestore types refined | Stricter TypeScript types | Fix type errors after upgrade |

### Cloud Functions v1 → v2

| Change | Impact | Action |
|--------|--------|--------|
| Import paths changed | `functions.https.onCall` → `onCall` from `firebase-functions/v2/https` | Update all imports |
| Configuration via function options | No more `functions.runWith({...})` | Pass options as first argument |
| Regional deployment per function | More granular control | Specify `region` in options |
| Firestore triggers changed | `functions.firestore.document()` → `onDocumentCreated()` | Update trigger syntax |
| Auth triggers changed | Different import path | `import { onCall } from "firebase-functions/v2/https"` |

**v1 to v2 migration example:**

```typescript
// v1 (OLD)
import * as functions from "firebase-functions";

export const myFunction = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "...");
    return { result: data.input };
  });

// v2 (NEW)
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const myFunction = onCall(
  { memory: "1GiB", timeoutSeconds: 120, region: "europe-west1" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "...");
    return { result: request.data.input };
  }
);
```

---

## New Project Setup Checklist

### 1. Initialize Firebase

```bash
firebase init firestore functions hosting storage emulators
```

Select:
- Firestore Rules file: `firestore.rules`
- Firestore Indexes file: `firestore.indexes.json`
- Functions language: TypeScript
- Functions install dependencies: Yes
- Hosting public directory: `dist` (for Vite)
- Single-page app: Yes
- Emulators: Auth, Firestore, Functions, Storage

### 2. Configure functions/package.json

```json
{
  "engines": { "node": "22" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  }
}
```

### 3. Configure functions/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2022",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "lib",
    "sourceMap": true
  },
  "include": ["src"]
}
```

### 4. Web App Firebase Config

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "europe-west1");
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
```

### 5. Environment Variables (.env)

```bash
# .env (committed — public config)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **Note:** Firebase web config is public by design. Security comes from Security Rules, not hiding the config. Never put Admin SDK credentials in the frontend.

---

## Upgrading an Existing Project

### Step-by-Step

1. **Check current versions:** `npm ls firebase firebase-admin firebase-functions`
2. **Read changelog:** Check Firebase release notes for breaking changes
3. **Update Web SDK:** `npm install firebase@latest`
4. **Update Admin SDK:** `cd functions && npm install firebase-admin@latest`
5. **Update Functions SDK:** `cd functions && npm install firebase-functions@latest`
6. **Fix TypeScript errors:** Run `npx tsc --noEmit` and fix type issues
7. **Test with emulators:** Run full emulator suite and verify all flows
8. **Deploy functions first:** `firebase deploy --only functions`
9. **Deploy rules:** `firebase deploy --only firestore:rules,storage`
10. **Deploy hosting:** `firebase deploy --only hosting`

### When NOT to Upgrade

- Mid-sprint with active development (too risky)
- Before a release (stability > currency)
- If the changelog shows no relevant fixes for your project
