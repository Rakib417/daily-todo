# Phase 3 — Daily Email Summaries

This adds an automated email sent to each user every evening (~8pm their local time)
with that day's completion stats. The code is already built:

- A **notification toggle** in the app (sidebar) — users opt in/out.
- A **scheduled Cloud Function** (`functions/index.js`) that emails opted-in users.

Do **Phases 1–2 setup first** (see `SETUP.md`) — this builds on that same project.

---

## 1. Upgrade to the Blaze plan

Scheduled Cloud Functions require the pay-as-you-go plan.

1. Firebase Console → bottom-left **Upgrade** → choose **Blaze**.
2. Add a billing account (credit card required). Usage here is tiny and almost
   certainly stays within the free monthly allowance.
3. (Optional but smart) set a **budget alert** (e.g. $1) so you're notified of any cost.

## 2. Pick an email sender (SMTP)

The function sends mail through any SMTP provider. Easiest options:

- **Gmail** — enable 2-step verification on your Google account, then create an
  **App Password** (myaccount.google.com → Security → App passwords). Use:
  - host `smtp.gmail.com`, port `465`, user = your Gmail, pass = the app password.
- **SendGrid / Brevo / Mailgun** — free tiers; they give you SMTP host/user/pass.

## 3. Install the Firebase CLI (one time)

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project, give it an alias like "default"
```

## 4. Store your SMTP credentials as secrets

Run these from the project root and paste each value when prompted:

```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set SMTP_FROM   # e.g. "Daily <you@gmail.com>"
```

Secrets are encrypted by Google — they're never stored in your code.

## 5. Deploy

```bash
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,functions
```

That publishes the security rules and the `dailySummary` function. It runs every
hour and emails each opted-in user when their local clock hits 8pm.

## 6. Test it

- In the app, make sure the **Daily email summary** toggle is ON.
- To test immediately without waiting for 8pm, temporarily change the hour check in
  `functions/index.js` (`if (hour !== 20)`) to your current local hour, redeploy,
  wait for the next hourly run, then change it back.

---

## How it works

- The app writes a profile at `users/{uid}` with your `email`, `notify` flag, and `tz`.
- Every hour the function finds users with `notify == true` whose local time is 8pm,
  tallies that day's todos, and emails the summary.
- Turning the toggle off sets `notify: false` and you stop receiving emails.

## Adjusting

- **Different send time?** Change `if (hour !== 20)` to another hour (24h clock).
- **Morning reminder instead?** Change the copy in `buildEmail()` and the hour to e.g. `7`.
- **Cost worry?** The function is light, but you can widen the schedule to
  `every 60 minutes` (already set) — it only sends during each user's 8pm hour.
