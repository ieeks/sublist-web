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

## Firestore access and owner login

**Never use public `allow read, write: if true` rules in production.**
The app stores personal data in `sublist/data`. The repository cannot prove which
rules are currently deployed in Firebase.

Owner login is prepared via `NEXT_PUBLIC_FIREBASE_ALLOWED_UID`. It is opt-in for a
staged rollout: without that environment variable, the existing access flow is
unchanged. This PR alone therefore does **not** close the access-control finding.
The UID is not a password; access is enforced by Firestore rules, not by hiding it.

Follow [the manual setup](docs/firebase-owner-setup.md) to activate Google sign-in,
set the owner's UID in GitHub Actions, publish owner-only rules and verify access.
Do not paste credentials or private financial exports into GitHub issues.

## Data and reliability

- All state remains in `sublist/data`; no database restructuring is required.
- Every mutation reads the latest server document inside a Firestore transaction.
  Concurrent updates are retried. Conflicting changes to the same edited field
  are rejected; editing a remotely deleted subscription cannot recreate it.
- Editing is unlocked only after a confirmed server snapshot. Failed saves show an
  error, and the form stays open. Offline writes are deliberately not queued.
- Local-storage migration creates only a missing document, inside a transaction.
  An existing document (including an intentionally empty list) is never replaced.
  The old local copy is removed only after an actual successful migration.
- New subscriptions use random UUIDs, so names need not be unique.
- CSV import validates the whole file before writing, supports multiline fields,
  and only **adds** new IDs. Existing IDs are skipped, not updated. The interface
  confirms the operation and reports errors. CSV is not a full-fidelity backup
  of payment history; a separate history export remains available.
- Scheduled payments are **estimates**, not bank-confirmed transactions. Existing
  history amounts/currencies are preserved, new estimates are appended without an
  18-item cap, and new price changes affect future estimates. A `historyThrough`
  checkpoint prevents invented payments while paused/archived. Historical prices
  and pauses missing from old data cannot be reconstructed reliably.
- Paused subscriptions remain editable in the subscription list but are excluded
  from monthly totals, the dashboard and future calendar events.
- Billing dates retain the original start-day anchor across shorter months.
- Reminder switches were removed until actual notifications are implemented.

## Verification

```bash
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The regression suite covers dates, validation, IDs, CSV, historical amounts,
pause/resume and conflicting edits. Pull requests run checks and a static build
with dummy Firebase configuration; deploy builds use the real repository secrets.
No automated test writes to the live Firestore database.

## Übergabe an Claude Code

See `CLAUDE_HANDOVER.md`.
