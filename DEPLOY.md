# Deploying to Cloudflare Pages

Deploys the app from GitHub → Cloudflare Pages → your subdomain. Free, auto-builds
on every `git push`.

## 1. Push to GitHub

1. On <https://github.com/new>, create an **empty** repo (no README/license) — e.g. `daily-todo`.
2. Back here, connect and push (replace the URL with yours):

   ```bash
   git remote add origin https://github.com/<you>/daily-todo.git
   git push -u origin main
   ```

## 2. Create the Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub, pick the `daily-todo` repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

## 3. Add environment variables (REQUIRED)

`.env` is not in the repo, so the build needs the Firebase keys set in Cloudflare.
Under the project → **Settings → Variables and Secrets → Production** (and Preview),
add each of these (copy values from your local `.env`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Then **Save** and **Retry deployment** (or push again) so the build picks them up.

## 4. Attach your subdomain

1. Project → **Custom domains** → **Set up a custom domain**.
2. Enter your subdomain (e.g. `todo.yourdomain.com`).
3. Since the domain's DNS is already on Cloudflare, it adds the CNAME automatically.
   SSL provisions in a minute or two.

## 5. Authorize the domain in Firebase (REQUIRED for login)

Google sign-in only works from domains you whitelist:

1. Firebase Console → **Authentication → Settings → Authorized domains → Add domain**.
2. Add your subdomain, e.g. `todo.yourdomain.com`.
   (Also add the `*.pages.dev` URL Cloudflare gives you if you want login to work there too.)

## Done

Visit your subdomain → Continue with Google → use the app. Every `git push` to `main`
redeploys automatically.

> Note: the `functions/` folder (email summaries) is **not** part of this deploy — that
> deploys separately to Firebase later (see `PHASE3-EMAIL.md`).
