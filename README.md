# Intimate Hub

React + Firebase (Spark plan, free) + Vercel. Server-side logic runs as Vercel
serverless functions under `/api` (using `firebase-admin`) instead of Firebase
Cloud Functions, so nothing here requires the Blaze plan.

## 1. Install

```
npm install
npm install --save-dev vercel   # optional, for local `vercel dev`
```

## 2. Create the Firebase project

1. https://console.firebase.google.com → Add project
2. Build → Authentication → get started → enable **Email/Password**
3. Build → Firestore Database → create database (production mode)
4. (Skip Storage — it now requires Blaze. Images go to Cloudinary, below.)
5. Project settings → General → "Your apps" → add a **Web app** → copy the config values into `.env.local` (copy `.env.example` first)
6. Project settings → Service accounts → **Generate new private key** → save the JSON somewhere outside the repo (never commit it)

## 2b. Cloudinary (product images)

1. https://cloudinary.com → sign up free (no card)
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret**
3. Put all three in `.env` / Vercel as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (no `VITE_` prefix)

## 3. Deploy security rules

Requires the Firebase CLI (`npm i -g firebase-tools`, then `firebase login`, `firebase init` selecting Firestore only, pointing at the existing rule files in this repo):

```
firebase deploy --only firestore:rules,storage:rules
```

## 4. Bootstrap the first admin

Locally only, using the service-account JSON from step 2:

```
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/bootstrap-admin.js you@example.com
```

Sign that user out and back in on the site afterwards so their ID token picks up the new claim.

## 5. Run locally

```
npm run dev
```

`/api/*` routes need `vercel dev` (not plain `vite`) to execute locally, since they're Vercel serverless functions. Set `FIREBASE_SERVICE_ACCOUNT` in a local `.env` as the minified service-account JSON for that.

## 6. Deploy

1. Push to GitHub, import the repo in Vercel
2. Vercel → Project → Settings → Environment Variables: set every `VITE_FIREBASE_*` value, plus `FIREBASE_SERVICE_ACCOUNT` (server-only — no `VITE_` prefix)
3. Firebase console → Authentication → Settings → Authorized domains → add the Vercel production domain
4. Deploy

## Folder map

- `src/pages/storefront` — customer-facing pages
- `src/pages/admin` — admin console pages (behind `RequireAdmin`)
- `src/services` — all Firestore/Storage/API access goes through here
- `src/firebase/config.js` — public client SDK init
- `api/` — Vercel serverless functions (Admin SDK, never imported by `/src`)
- `firestore.rules` — the real security boundary
- `scripts/bootstrap-admin.js` — one-off local script, never deploy it
