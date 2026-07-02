# Todo App – CLAUDE.md

## Projektübersicht

Minimalistische Single-Page Todo-App. Kein Backend, kein Server, kein Login. Alles läuft im Browser via localStorage. Exportierbar als JSON.

**Confluence Projektplan:** https://allmyplaygrounds.atlassian.net/wiki/spaces/TDA/pages/32833538/Projektplan+Todo+App

## Tech Stack

| Bereich | Entscheidung |
|---|---|
| Build Tool | Vite |
| Framework | Vue 3 + Composition API |
| State | Pinia + `pinia-plugin-persistedstate` |
| Storage | localStorage (JSON-Serialisierung) |
| Import/Export | Native File API (`showSaveFilePicker` / `showOpenFilePicker`) |
| Styling | Plain CSS / CSS Custom Properties |
| Kalender | `v-calendar` (Vue-Plugin) |
| Icons | `@lucide/vue` |
| Routing | `vue-router` |

## Datenmodell

```typescript
interface Tag {
  id: string        // crypto.randomUUID()
  label: string
  color: string     // hex
}

interface Project {
  id: string        // crypto.randomUUID()
  name: string
  visible: boolean
}

interface Todo {
  id: string            // crypto.randomUUID()
  title: string
  note?: string
  tags: string[]        // Tag-IDs
  projectId?: string    // optional, max. ein Projekt
  createdAt: string     // ISO-Timestamp
  inToday: boolean
  completedAt?: string  // ISO-Timestamp → landet im Archiv
  workLog: string[]     // ISO-Timestamps: je ein Eintrag pro "Für heute fertig"-Tag
}

interface AppState {
  todos: Todo[]
  tags: Tag[]
  projects: Project[]
  lastResetDate: string // ISO-Date, für 4-Uhr-Reset-Logik
}
```

## Projektstruktur

```
todo-app/
├── src/
│   ├── components/
│   │   ├── TodoCard.vue         // Karte mit Swipe-Gesten, Tag-Menü, Check-Menü (Today)
│   │   ├── TagBadge.vue         // Farbige Tag-Pille
│   │   ├── TagSelectModal.vue   // Dropdown zum Tag-Auswählen (Add-Input + TodoCard)
│   │   ├── ColorPicker.vue      // HSV-Farbwähler für Settings
│   │   └── SettingsModal (entfernt – Settings ist eigene Route/View)
│   ├── views/
│   │   ├── AllTodos.vue         // Hauptliste (filtert: aktiv + nicht in Today)
│   │   ├── Today.vue            // Tages-View (todayTodos, zwei Abhak-Modi)
│   │   ├── Calendar.vue         // Kalender-View (v-calendar, workLog-Dots)
│   │   └── Settings.vue         // Farb-Theme, Corner-Style, Import/Export
│   ├── stores/
│   │   ├── todos.ts             // Pinia Store: Todos, Tags, Projekte, Reset
│   │   └── theme.ts             // Pinia Store: Farb-Theme + gespeicherte Themes
│   ├── composables/
│   │   ├── useStorage.ts        // Import/Export Logik (File API + Fallback)
│   │   ├── useReset.ts          // 4-Uhr-Reset Logik
│   │   └── useTheme.ts          // applyTheme() – CSS-Custom-Properties setzen
│   ├── styles/
│   │   ├── base.css             // Resets, Design Tokens, Scrollbar
│   │   ├── layout.css           // Grid-Layout, Sidebar, Head, Content
│   │   ├── mobile.css           // Mobile Bottom-Nav, Tag-Panel, Breakpoints
│   │   └── calendar.css         // v-calendar Overrides
│   ├── dev/
│   │   └── seed.ts              // Dev-only: befüllt localStorage mit Dummy-Todos
│   ├── router/
│   │   └── index.ts             // Hash-Router: /, /all, /today, /calendar, /settings
│   ├── App.vue                  // Shell: Sidebar, Head, Nav, Mobile-Tag-Panel
│   └── main.ts
├── index.html
├── vite.config.ts
└── package.json
```

## Entschiedene Design-Fragen

- **Today-Reset:** Täglich um 04:00 Uhr – alle `inToday = true` Flags werden zurückgesetzt. Beim App-Start wird `lastResetDate` geprüft.
- **Dark/Light Toggle:** Keins. Fixes Design (eine Variante).
- **Projekt-Zuordnung:** Max. ein Projekt pro Todo.
- **Todo-Erstellung:** Add-Input in App.vue (Main-Head), immer sichtbar. Enter speichert. Bei vorhandenen Tags öffnet sich TagSelectModal zur direkten Tag-Zuweisung.
- **Zusatzfelder:** Tags direkt im Add-Input via TagSelectModal. Edit per Klick auf den Todo-Titel in der Karte (öffnet TagSelectModal).
- **Mobile:** Vollständig responsive, mobile-first CSS.

## Abhaken in Today – zwei Modi

- **✓ Erledigt** – Setzt `completedAt`, Todo wandert ins Archiv.
- **◷ Für heute fertig** – Fügt Timestamp zu `workLog[]` hinzu, setzt `inToday = false`. Todo bleibt im Pool.

## Implementierungs-Phasen

| Phase | Inhalt | Geschätzte Zeit |
|---|---|---|
| Phase 1 | Vite + Vue 3 + Pinia Setup, Routing, Basis-Layout & Nav (mobile-first) | ~1h |
| Phase 2 | Datenmodell + Pinia Store + localStorage Persistenz | ~1h |
| Phase 3 | All-Todos View: Inline-Input, Liste, Sortierung, Filter, Edit-Mode | ~2h |
| Phase 4 | Today View + zwei Abhak-Modi + 4-Uhr-Reset | ~1.5h |
| Phase 5 | Tags (Bulk-Input + Edit + Farbe) + Projekte (Settings Modal) | ~1h |
| Phase 6 | Kalender View – zwei Dot-Typen, Tages-Detail-Liste | ~1.5h |
| Phase 7 | Import/Export (File API) | ~30min |
| Phase 8 | Styling / Polishing – responsive, minimalistisches fixes Design | ~2h |

## Branches

| Branch | Zweck |
|---|---|
| `main` | Stabiler Stand nach Phase 8 – minimalistisches, generisches Design |
| `design/poppy` | Design-Experiment: Neo-brutalist, keine runden Ecken, Flächen statt Borders, kräftige Farben (Orange-Rot, Gelb, Teal), harte Drop-Shadows |

Auf `design/poppy` wird frei experimentiert. Rückkehr zu `main` jederzeit via `git checkout main`.

## Entwicklungshinweise

- Todos sind durch `crypto.randomUUID()` eindeutig – gleiche Titel kein Problem.
- `pinia-plugin-persistedstate` übernimmt localStorage-Sync automatisch.
- File API: `showSaveFilePicker`/`showOpenFilePicker` mit Fallback auf `a[download]` / `<input type="file">`.
- Kein TypeScript-Strict erforderlich, aber Interfaces aus dem Datenmodell konsequent verwenden.

## Arbeitsweise mit Claude

- **Nach jeder bedeutenden Änderung committen** – nicht zu lange sammeln. Bedeutend heißt: neues Feature, sichtbare UI-Änderung, Bugfix, Refactoring einer Komponente.
- Commit-Messages auf Deutsch oder Englisch, kurz und beschreibend.
- Auf `design/poppy` kann frei experimentiert werden – trotzdem regelmäßig committen, damit der Fortschritt nachvollziehbar bleibt.
- **Alle UI-Inhalte (Labels, Buttons, Menüeinträge, Platzhaltertexte) immer auf Englisch.** Keine deutschen Begriffe im Interface.
