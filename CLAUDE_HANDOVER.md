# Projektübergabe an Claude Code

Dieses Dokument dient als kompakte technische Übergabe für die Weiterarbeit mit Claude Code.

## 1) Projektüberblick

**Sublist Web** ist ein mobile-first Subscription-Tracker mit Apple-inspirierter UI, Dark-Mode-Unterstützung und Firestore-Persistenz.

- Framework: **Next.js 16** (App Router) + **TypeScript**
- UI: **Tailwind CSS v4** + shadcn/Radix-basierte Komponenten
- Icons: **lucide-react**
- Persistenz: **Firebase Firestore** (ein Dokument: `sublist/data`)
- Deployment: **GitHub Pages** via static export (`out/`) + GitHub Actions

## 2) Lokales Arbeiten

```bash
cp .env.local.example .env.local   # Firebase-Werte eintragen
npm install
npm run dev
```

App lokal unter: `http://localhost:3000`

Wichtige Scripts:
- `npm run dev` – lokale Entwicklung
- `npm run build` – Production Build + Static Export nach `out/`
- `npm run lint` – ESLint

## 3) Architektur

```
src/
  app/                        Routen: /, /subscriptions, /calendar, /settings
  components/
    app/
      app-shell.tsx           Sidebar (Desktop) + Tab-Bar (Mobile) + Layout
      dashboard-screen.tsx    Dashboard mit Donut-Chart, Stat-Tiles, Upcoming
      subscriptions-screen.tsx  Liste + Swipe-Delete + Mobile Detail Sheet
      calendar-screen.tsx     Monatsraster + Day Panel + Verlängerungsliste
      settings-screen.tsx     4 Gruppen: Darstellung / Kategorien / Benachrichtigungen / Daten
      subscription-form-dialog.tsx  Mobile: BottomSheet mit Beliebt-Grid; Desktop: Dialog
      mobile-detail-sheet.tsx BottomSheet mit Swipe-to-close (Abo-Details, Edit, Delete)
      brand-avatar.tsx        Logo-Resolver (SVG-Map + simple-icons Fallback)
    providers/
      app-providers.tsx       AppContext: Daten, alle Mutations, FX-Rates, Theme-Sync
    ui/
      bottom-sheet.tsx        Portal-BottomSheet mit Swipe-to-close Geste
      ...                     Button, Card, Dialog, Select, etc.
  lib/
    firebase.ts               Firebase App Init (aus NEXT_PUBLIC_* Env Vars)
    migrate.ts                One-time Migration localStorage → Firestore
    types.ts                  AppData, Subscription, Category, PaymentMethod, …
    utils.ts                  formatCurrency, calculateNextDueDate, advanceDate, …
    currencies.ts             FX-Rates (frankfurter.app + Fallback)
    csv.ts                    CSV Import/Export
  data/
    seed.ts                   Demo-Seeddaten (wird in Firestore geschrieben wenn leer)
```

## 4) Datenfluss & Persistenz

- **Firestore-Dokument:** `sublist/data` enthält `AppData` (subscriptions, categories, paymentMethods, paymentHistory, settings).
- **Startup:** `migrateFromLocalStorageIfNeeded()` prüft ob Firestore leer ist und kopiert ggf. bestehende localStorage-Daten rüber. Danach `onSnapshot` für Echtzeit-Updates.
- **Schreiben:** Jede Mutation (addOrUpdateSubscription, deleteSubscription, updateSettings, …) ruft intern `mutate()` auf → debounced `setDoc` nach 600ms.
- **`ready`-Flag:** `false` bis der erste Firestore-Snapshot da ist → Lade-Skeleton in SubscriptionsScreen greift.
- **FX-Rates:** Beim App-Start von `frankfurter.app` geladen, hartcodierter Fallback bei Fehler.
- **Kein Auth:** Firestore-Rules erlauben `read/write: if true` auf `sublist/data`.

## 5) Dark Mode

- `next-themes` mit `attribute="class"` setzt `.dark` auf `<html>`.
- `ThemeSync`-Komponente brückt App-State (`data.settings.appearance`) → next-themes.
- Screens (Calendar, Settings, Form) verwenden `useTheme()` → `resolvedTheme` um inline-style Token-Sets zu wählen (DARK/LIGHT Objekte).
- CSS-Variablen (`--bg`, `--surface`, `--accent`, `--text`, `--sub`, `--border`) sind in `globals.css` für `.dark`/`.light` gesetzt.

## 6) Screens — Ist-Zustand

| Screen | Status | Besonderheiten |
|---|---|---|
| Dashboard | ✅ hi-fi | Donut SVG, Stat-Tiles, Upcoming-List |
| Subscriptions | ✅ hi-fi | Filter-Pills (Alle/Monatlich/Jährlich), Swipe-Delete, MobileDetailSheet |
| Calendar | ✅ hi-fi | Monday-first Grid, Day Panel, Verlängerungsliste, theme-aware |
| Settings | ✅ hi-fi | 4 Gruppen, Dark-Mode Toggle, Währung, Kategorien, CSV-Daten |
| Add/Edit Form | ✅ hi-fi | Mobile: BottomSheet (Beliebt + Grouped-Rows); Desktop: Dialog |
| Bottom Sheet | ✅ | Swipe-to-close Geste implementiert |

## 7) GitHub Pages / CI

- `.github/workflows/deploy.yml` triggert auf Push nach `main`.
- Build injiziert `NEXT_PUBLIC_FIREBASE_*` aus GitHub Repository Secrets.
- `next.config.ts`: `output: "export"`, `basePath: "/sublist-web"` (nur Production).
- `BrandAvatar` löst Asset-Pfad intern auf — nie manuell duplizieren.

## 8) Offene Themen

1. Benachrichtigungs-Toggles in Settings sind nur lokaler State — noch keine echte Push-Notification-Logik
2. CSV-Import robuster machen (Validierung, Fehlerfeedback)
3. Payment-History editierbar machen (statt nur Demo-Daten)
4. JSON-Backup/Restore als Alternative zu CSV
5. EUR-Subtext auf Dashboard-Karten (Mobile)

## 9) Done-Definition für Änderungen

- `npm run build` ohne Fehler
- `npx tsc --noEmit` ohne Fehler
- Betroffene Flows manuell auf Mobile (375px) und Desktop geprüft
- Markdown-Docs synchron gehalten

## 10) Wichtige Hinweise

- **Keine neue Context-Ebene** einführen — alles läuft über `useAppData()`.
- **`setData` nie direkt** in neuen Mutations verwenden — immer über `mutate()` damit Firestore-Sync greift.
- **Tailwind v4:** kein `tailwind.config.ts`, Konfiguration liegt in `globals.css`.
- Bei Route-/Asset-Änderungen `basePath`-Kompatibilität nicht brechen.
- `.env.local` ist in `.gitignore` — niemals committen.
