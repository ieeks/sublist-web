# Sublist Web

Premium Apple-leaning subscription tracker built as the real app surface, not a landing page. The app is designed around a mockup-led desktop scene with a softer Apple-style shell, responsive mobile navigation, localStorage persistence, and static export support for GitHub Pages.

## Current Focus

- fully themed dark mode (class-based, FOUT-free)
- responsive mobile navigation with swipe-to-delete on subscription cards
- multi-currency support (EUR, USD, GBP, TRY, INR) with live FX conversion
- local-first data flow with seeded demo subscriptions

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- shadcn-style UI primitives with Radix
- Recharts
- lucide-react
- localStorage persistence
- GitHub Pages via GitHub Actions

## Setup

```bash
cd ~/Developer/sublist-web
npm install
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000/`.

## Build

```bash
npm run build
```

The static export is written to `out/`.

## Preview The Static Export

```bash
npm run start
```

That serves the generated `out/` folder at `http://localhost:3000`.

## Deploy

1. Push the repository to GitHub on the `main` branch.
2. In GitHub, open `Settings > Pages`.
3. Set `Source` to `GitHub Actions`.
4. Pushes to `main` will trigger `.github/workflows/deploy-pages.yml`.

## GitHub Pages Notes

- The project is configured for a repository named `sublist-web`.
- `next.config.ts` sets `output: "export"`, `trailingSlash: true`, `basePath`, and `assetPrefix` for GitHub Pages.
- In local development, the app runs without the `/sublist-web` prefix so routes and assets work normally at `http://localhost:3000`.
- In production builds, `basePath` and `assetPrefix` switch to `/sublist-web` so the exported site works correctly on GitHub Pages.
- If you rename the repository, update the `basePath` and `assetPrefix` values in `next.config.ts`.

## CSV Notes

- Export supports `subscriptions.csv` and `payment-history.csv`.
- Import currently replaces the subscription list from a CSV export-compatible file.

## Quality Notes

- Demo data seeds on first load only.
- All app data persists in localStorage. FX rates are cached in localStorage with a 24 h TTL (source: frankfurter.app, hardcoded fallback if offline).
- Dark mode is class-based via next-themes; a FOUT-prevention inline script in `<head>` applies the stored theme before first paint.
- The UI includes a desktop sidebar, mobile tab bar, dashboard charts, subscription detail panel, calendar view, and settings workspace.
- Mobile subscription list supports iOS-style swipe-to-delete with a confirmation dialog.
- Category names are editable inline in Settings; categories and payment methods can be deleted when unused.
- The `/` route uses a visual reconstruction scene while still exposing real navigation and selection state.

## Übergabe an Claude Code

- Für die Weiterarbeit mit Claude Code siehe `CLAUDE_HANDOVER.md`.
- Das Dokument enthält Architektur, Arbeitsablauf, Prioritäten und DoD für kommende Änderungen.
