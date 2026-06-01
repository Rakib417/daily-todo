# Daily — Setup Guide

A per-day todo app with Google login, a calendar to browse any day, and a weekly
completion chart. Data syncs privately to each user's Google account via Firebase.

This guide gets you from zero to running — **all on Firebase's free tier (no credit
card)**. Email notifications come later (Phase 3) and need the Blaze plan.

---

## 1. Create a Firebase project (free)

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `daily-todo`), accept defaults, and create it.

## 2. Enable Google sign-in

1. In the project, open **Build → Authentication → Get started**.
2. On the **Sign-in method** tab, click **Google → Enable**, pick a support email, **Save**.

## 3. Create the database

1. Open **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** and a location near you, then create.
3. Go to the **Rules** tab, paste the rules below, and **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Each user can only read/write their own todos.
       match /users/{uid}/todos/{todoId} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

   These rules ensure one user can never see another user's tasks.

## 4. Register a Web app and copy the config

1. In **Project settings** (gear icon) → **Your apps** → click the **Web** icon (`</>`).
2. Give it a nickname, register (skip Hosting for now).
3. Copy the `firebaseConfig` values shown.

## 5. Add the config to this project

1. In this folder, copy `.env.example` to a new file named `.env`.
2. Fill in the values from step 4:

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=daily-todo.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=daily-todo
   VITE_FIREBASE_STORAGE_BUCKET=daily-todo.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
   ```

## 6. Run it

```bash
npm install
npm run dev
```

Open the printed `localhost` URL, click **Continue with Google**, and start adding tasks.

> If you see an "unverified app" screen during sign-in, that's normal while testing.
> Add your own Google account as a **Test user** under Authentication, or click through it.

---

## Deploying (optional)

To put it on a public link, run `npm run build` and host the `dist/` folder anywhere
(Firebase Hosting, Netlify, Vercel). Remember to add your deployed domain under
**Authentication → Settings → Authorized domains**.

## Coming later — Phase 3: email notifications

Daily email summaries need a scheduled Cloud Function, which requires upgrading to the
**Blaze (pay-as-you-go)** plan. It has a generous free tier (likely $0 usage) but
requires a credit card on file. Ask when you're ready and we'll wire it up.
