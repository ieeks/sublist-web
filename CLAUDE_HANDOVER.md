# Projektübergabe an Claude Code

Dieses Dokument dient als kompakte technische Übergabe für die Weiterarbeit mit Claude Code.

## 1) Projektüberblick

**Sublist Web** ist ein statischer, lokal-first Subscription-Tracker mit Apple-inspirierter UI und Dark-Mode-Unterstützung.

- Framework: **Next.js 16** (App Router) + **TypeScript**
- UI: **Tailwind CSS v4** + shadcn/Radix-basierte Komponenten
- Charts: **Recharts** (Donut-Chart auf Dashboard)
- Icons: **lucide-react**
- Persistenz: **localStorage** (Seed-Daten beim Erststart)
- Deployment-Ziel: **GitHub Pages** via static export (`out/`)

## 2) Lokales Arbeiten

```bash
npm install
npm run dev
```

App lokal unter: `http://localhost:3000`

Wichtige Scripts:

- `npm run dev` – lokale Entwicklung
- `npm run build` – Production Build inkl. Static Export nach `out/`
- `npm run start` – Preview des exportierten Builds
- `npm run lint` – ESLint

## 3) Architektur (kurz)

- `src/app/*` – Routen (`/`, `/subscriptions`, `/calendar`, `/settings`)
- `src/components/app/*` – App-spezifische Screens und Shell
- `src/components/ui/*` – wiederverwendbare UI-Primitives (Button, Card, Dialog, Select …)
- `src/components/providers/app-providers.tsx` – AppContext (Daten, Actions, FX-Rates, Theme-Sync)
- `src/data/seed.ts` – Demo-Seeddaten
- `src/lib/currencies.ts` – FX-Rates (frankfurter.app, 24 h Cache, Fallback), `convertCurrency`, `toEurCents`
- `src/lib/utils.ts` – `formatCurrency`, `toMonthlyAmount`, `calculateNextDueDate`, `cn`
- `src/lib/csv.ts` – CSV-Import/Export

## 4) Datenfluss & Persistenz

- Daten clientseitig in `localStorage` (Key: `sublist-web-state`).
- Seed-Daten nur beim ersten Laden.
- FX-Rates werden beim App-Start von `frankfurter.app` geladen und für 24 h in localStorage gecacht (`fx_rates`, `fx_rates_ts`). Bei Fehler greifen hartcodierte Fallback-Rates (EUR/USD/GBP/TRY/INR).
- `fxRates` und `updateCategory` sind über den `AppContext` verfügbar.
- CSV-Import ersetzt die bestehende Subscription-Liste.

## 5) Dark Mode

- Tailwind v4 mit `@variant dark (&:where(.dark, .dark *))` in `globals.css`.
- `next-themes` mit `attribute="class"` setzt `.dark` auf `<html>`.
- `ThemeSync`-Komponente brückt App-State (`data.settings.appearance`) → next-themes.
- FOUT-Prävention: Inline-Script in `<head>` (in `layout.tsx`) liest `sublist-web-state` aus localStorage und setzt die Klasse vor dem ersten Paint.
- Dynamisch generierte Klassen (Gradients, weiße Hintergründe) werden per CSS-Override-Selektoren in `globals.css` gehandhabt; State-Varianten (`:focus`, `data-[state=...]`) direkt mit `dark:` Utilities.

## 6) GitHub Pages / Static Export

Für GitHub Pages ist die App auf ein Repo mit dem Namen `sublist-web` ausgelegt.

- `next.config.ts` nutzt `output: "export"`
- `basePath` und `assetPrefix` wechseln in Production auf `/sublist-web`
- Lokal läuft die App ohne Prefix (wichtig für DX)
- `BrandAvatar` löst den Asset-Pfad intern auf – nie manuell duplizieren

Wenn das Repo umbenannt wird, müssen `basePath`/`assetPrefix` angepasst werden.

## 7) Implementierte Features (Stand aktuell)

- Dark Mode (class-based, FOUT-frei)
- Bottom-Tab-Bar & Sidebar: aktiver State korrekt via `pathname`
- Dashboard: Donut-Chart, MetricCards, BreakdownCards – alle Totals FX-konvertiert
- Subscriptions: Desktop-Listenansicht + Detailpanel, Mobile-Swipe-to-Delete (Touch-Gesten, Bestätigungs-Dialog)
- Calendar: Tagesansicht mit Brand-Icons (bis 3 + `+N`-Overflow)
- Settings:
  - Präferenzen: Default-Currency (EUR/USD/GBP/TRY/INR), Appearance
  - Kategorien: Inline-Umbenennen per Klick, Löschen (nur wenn unverknüpft)
  - Zahlungsmethoden: Hinzufügen, Löschen (nur wenn unverknüpft)
  - CSV Export (Subscriptions + Payment History) und Import
- Subscription-Formular: Icon-Picker-Grid (9 Known Services + Custom), Felder gruppiert, Currency als Select (EUR/USD/GBP/TRY/INR)
- Mehrwährungsanzeige: EUR-Subtext bei Nicht-EUR-Subscriptions in Listen und Detailansicht

## 8) Offene Themen (priorisiert)

1. Inline-Editing direkt aus der Detailkarte
2. CSV-Import robuster machen (Validierung, Mapping, Fehlerfeedback)
3. Optionales JSON-Backup/Restore
4. Payment-History editierbar machen (statt nur Demo-Generierung)
5. EUR-Subtext auch auf Dashboard-Karten (Mobile + Smart-Launches)

## 9) Done-Definition für Änderungen

Bei jeder Änderung sollten mindestens erfüllt sein:

- Build läuft (`npm run build`)
- Lint läuft (`npm run lint`)
- Betroffene User-Flows manuell geprüft
- Dokumentation (`README.md`, `TODO.md`, diese Übergabe) bei Bedarf synchronisiert

## 10) Wichtige Hinweise für sichere Weiterentwicklung

- Keine Serverabhängigkeit voraussetzen (App ist bewusst lokal-first).
- Bei neuen Features statischen Export (GitHub Pages) immer mitdenken.
- Bei Route-/Asset-Änderungen `basePath`-Kompatibilität nicht brechen.
- Tailwind v4: kein `tailwind.config.ts`, Konfiguration liegt in `globals.css`.
- Neue dynamisch generierte Klassen mit Farb-Hex-Werten brauchen ggf. CSS-Override-Selektoren in `globals.css` für Dark Mode.
