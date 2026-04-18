# Projektübergabe an Claude Code

Dieses Dokument dient als kompakte technische Übergabe für die Weiterarbeit mit Claude Code.

## 1) Projektüberblick

**Sublist Web** ist ein statischer, lokal-first Subscription-Tracker mit Apple-inspirierter UI.

- Framework: **Next.js 16** (App Router) + **TypeScript**
- UI: **Tailwind CSS** + shadcn/Radix-basierte Komponenten
- Charts: **Recharts**
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

- `src/app/*` enthält die Routen (`/`, `/subscriptions`, `/calendar`, `/settings`)
- `src/components/app/*` enthält App-spezifische UI-Screens und Shell
- `src/components/ui/*` enthält wiederverwendbare UI-Primitives
- `src/data/seed.ts` enthält Demo-Seeddaten
- `src/lib/*` enthält Utilities, Typen, CSV-Import/Export-Logik

## 4) Datenfluss & Persistenz

- Daten werden clientseitig in `localStorage` gehalten.
- Seed-Daten werden nur beim ersten Laden initialisiert.
- CSV-Import ersetzt derzeit die bestehende Subscription-Liste.

## 5) GitHub Pages / Static Export

Für GitHub Pages ist die App auf ein Repo mit dem Namen `sublist-web` ausgelegt.

- `next.config.ts` nutzt `output: "export"`
- `basePath` und `assetPrefix` wechseln in Production auf `/sublist-web`
- Lokal läuft die App ohne Prefix (wichtig für DX)

Wenn das Repo umbenannt wird, müssen `basePath`/`assetPrefix` angepasst werden.

## 6) Offene Themen (priorisiert)

1. Inline-Editing direkt aus der Detailkarte
2. CSV-Import robuster machen (Validierung, Mapping, Fehlerfeedback)
3. Optionales JSON-Backup/Restore
4. Payment-History editierbar machen (statt nur Demo-Generierung)
5. Visuellen Feinschliff der Route-Layouts (Desktop + Mobile)

## 7) Empfohlene nächste Schritte für Claude Code

1. `npm run lint` ausführen und Warnungen/Fehler prüfen.
2. UX-Fluss „Abo hinzufügen → bearbeiten → CSV export/import“ end-to-end testen.
3. CSV-Import als ersten funktionalen Ausbau priorisieren (Validation Layer + UI-Feedback).
4. Danach Inline-Editing in der Subscription-Detailansicht implementieren.

## 8) Done-Definition für Änderungen

Bei jeder Änderung sollten mindestens erfüllt sein:

- Build läuft (`npm run build`)
- Lint läuft (`npm run lint`)
- Betroffene User-Flows manuell geprüft
- Dokumentation (`README.md`, `TODO.md`, diese Übergabe) bei Bedarf synchronisiert

## 9) Wichtige Hinweise für sichere Weiterentwicklung

- Keine Serverabhängigkeit voraussetzen (App ist bewusst lokal-first).
- Bei neuen Features statischen Export (GitHub Pages) immer mitdenken.
- Bei Route-/Asset-Änderungen `basePath`-Kompatibilität nicht brechen.

