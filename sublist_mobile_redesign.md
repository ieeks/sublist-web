# Sublist Mobile Redesign — Abgeschlossen

Dieses Dokument war das ursprüngliche Handoff für den mobilen Redesign-Pass.
Alle Punkte sind implementiert. Zur aktuellen Architektur siehe `CLAUDE_HANDOVER.md`.

## Umgesetzt

- [x] CSS-Variablen (`--bg`, `--surface`, `--accent`, `--text`, `--sub`, `--border`) in `globals.css`
- [x] Dark/Light Mode Token-Sets in allen neuen Screens (inline via `useTheme`)
- [x] `BrandAvatar` mit SVG-Logo-Map + simple-icons Fallback
- [x] Donut-Chart (SVG, kein Recharts) auf Dashboard Mobile
- [x] SubscriptionCard mit Urgent-Indicator (`daysLeft ≤ 7` → Orange + ⚡)
- [x] Swipe-to-Delete auf Subscription-Liste
- [x] `BottomSheet` mit Swipe-to-close Geste
- [x] `MobileDetailSheet` — Hero, Info-Rows, Payment-History Bars, Edit/Delete Actions
- [x] Add/Edit Sheet — Beliebt-Grid (3-col) + Icon-Suche + Grouped-Rows Form + Accent CTA
- [x] Tab-Bar (Mobile) mit Safe Area
- [x] Calendar Screen — Monday-first Grid, Today-Kreis, Event-Dots, Day Panel, Verlängerungsliste
- [x] Settings Screen — 4 Gruppen (Darstellung, Kategorien, Benachrichtigungen, Daten)
- [x] Subscriptions Screen — Filter-Pills, deutsche Labels, Gesamt-Subtitle
- [x] Firestore-Persistenz (ersetzt localStorage)
- [x] GitHub Actions Deploy mit Firebase Secrets
