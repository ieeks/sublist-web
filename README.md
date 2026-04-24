# Sublist Web

Mobile-first subscription tracker built with Next.js, deployed to GitHub Pages. Designed around a hi-fi phone mockup (375px) with full dark/light mode, Firestore persistence, and a responsive desktop view.

## Stack

- **Next.js 16** + TypeScript (App Router, static export)
- **Tailwind CSS v4** + shadcn/Radix UI primitives
- **Firebase / Firestore** — single-document persistence, real-time sync
- **lucide-react** icons
- **next-themes** dark/light mode (class-based, FOUT-free)
- **GitHub Actions** → GitHub Pages deploy

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in your Firebase project values in .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values from  
Firebase Console → Project Settings → Your apps:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

In CI (GitHub Actions) these are injected from GitHub Repository Secrets — no `.env.local` needed there.

## Build

```bash
npm run build   # static export → out/
```

## Deploy

Push to `main`. The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages automatically.

In GitHub → Settings → Pages → Source: **GitHub Actions**.

## GitHub Pages Notes

- `basePath` and `assetPrefix` switch to `/sublist-web` in production builds only.
- Local dev runs without prefix at `http://localhost:3000`.
- If you rename the repo, update `basePath`/`assetPrefix` in `next.config.ts`.

## Firestore Rules

The app uses no authentication. Set these rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sublist/data {
      allow read, write: if true;
    }
  }
}
```

## Data

- All app state lives in one Firestore document: `sublist/data`.
- On first load, existing `localStorage` data is migrated to Firestore automatically.
- FX rates are fetched from `frankfurter.app` with hardcoded fallback if offline.
- CSV export/import available in Settings.

## Übergabe an Claude Code

See `CLAUDE_HANDOVER.md`.
