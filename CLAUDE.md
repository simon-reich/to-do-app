# Todo App – CLAUDE.md

## Projektübersicht

Minimalistische Single-Page Todo-App. Kein Backend, kein Server, kein Login. Alles läuft im Browser via localStorage. Exportierbar als JSON.

### Kernidee

Der Fokus liegt auf **Geschwindigkeit und Reibungslosigkeit** beim Anlegen und Verwalten von Todos — nicht auf Feature-Breite.

**Das Pool-Konzept:** Todos leben in einem persistenten Pool. Jeden Tag wählt man aus diesem Pool, was heute dran ist, und baut sich eine fokussierte Tagesliste. Der Pool eignet sich auch für wiederkehrende Aufgaben, weil ein Todo nicht zwingend "erledigt" werden muss — man kann es einfach wieder zurück in den Pool legen.

**Die zwei Abhak-Modi** sind der zentrale Unterschied zu normalen Todo-Apps:
- **Done** — Todo ist wirklich erledigt, wandert ins Archiv.
- **Done for today** — Heute fertig, aber das Todo bleibt im Pool. Nächste Mal wieder verfügbar. Ideal für Routinen und wiederkehrende Tasks.

**Design-Philosophie:** Stylisch, aber nicht überladen. Jedes Feature muss sich rechtfertigen. Die App soll sich anfühlen wie ein gutes Notizbuch — immer griffbereit, nie im Weg.

**Personalisierung ohne Komplexität:** Zwei Farben steuern das gesamte visuelle System — Background und Ink. Aus der Ink wird automatisch eine dunklere Variante (`--ink-dark`) für Highlighting abgeleitet. Dimming erfolgt über Opacity (z.B. 0.35), nicht über eine eigene Farbvariante. Dazu wählbarer Corner-Radius (rund oder eckig) und Priority-Shadow-Stil (dark/mono). Mehr Optionen gibt es nicht — das ist bewusst.

### Oberstes Designprinzip: Nur vier Farbwerte

Das gesamte UI verwendet ausschließlich diese vier Werte — keine Ausnahmen:

| Token | Bedeutung |
|---|---|
| `--bg` | Hintergrundfarbe (vom Nutzer gewählt) |
| `--ink` | Hauptfarbe für Text und Elemente (vom Nutzer gewählt) |
| `--ink-dark` | Berechnete dunklere Ink-Variante für Highlighting/Akzente |
| `opacity` | Dimming über Transparenz (z.B. `0.35`), niemals als eigene Farbvariante |

**Verboten:** Eigene Hex-Werte, `rgba()`-Zwischenwerte, neue CSS-Variablen für Farben, Grau-Töne, Weiß, Schwarz oder jede andere Farbe die nicht aus diesen vier Werten ableitbar ist. Jede neue Farbe im CSS ist ein Fehler.

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
  id: string        // uuid() mit Math.random()-Fallback für HTTP
  label: string
  color: string     // hex
}

interface Todo {
  id: string            // uuid() mit Math.random()-Fallback für HTTP
  title: string
  note?: string
  tags: string[]        // Tag-IDs
  createdAt: string     // ISO-Timestamp
  inToday: boolean
  completedAt?: string  // ISO-Timestamp → landet im Archiv
  workLog: string[]     // ISO-Timestamps: je ein Eintrag pro "Done for today"-Tag
}

interface AppState {
  todos: Todo[]
  tags: Tag[]
  lastResetDate: string // ISO-Date, für 4-Uhr-Reset-Logik
}
```

> **Projekte wurden entfernt.** Das Datenmodell kennt keine `Project`-Entität mehr. Tags sind das einzige Kategorisierungs-Feature.

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
│   │   ├── useTheme.ts          // applyTheme() – CSS-Custom-Properties setzen
│   │   └── useTodoFonts.ts      // Font-Zuweisung: deterministic hash, kein Duplikat nebeneinander
│   ├── styles/
│   │   ├── base.css             // Resets, Design Tokens, Scrollbar
│   │   ├── fonts.css            // @font-face für alle 17 Schriftfamilien (./fonts/)
│   │   ├── layout.css           // Grid-Layout, Sidebar, Head, Content
│   │   ├── mobile.css           // Mobile Bottom-Nav, Tag-Panel, Breakpoints
│   │   └── calendar.css         // v-calendar Overrides
│   ├── styles/fonts/            // TTF-Dateien, benannt nach Schema FontName-Style.ttf
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

## Kalender-View

`Calendar.vue` nutzt das `v-calendar`-Plugin und zeigt eine Monatsübersicht. Auf Tagen mit Aktivität erscheinen farbige Dots:

- **Ausgefüllter Dot** – Todo wurde an diesem Tag als *Done* abgehakt (`completedAt` fällt auf diesen Tag).
- **Umriss-Dot** – Todo hatte an diesem Tag einen *Done for today*-Eintrag (Datum in `workLog[]`).

Ein Klick auf einen Tag öffnet eine Detail-Liste der zugehörigen Todos. Die Overrides für v-calendar (Farben, Abstände) stehen in `src/styles/calendar.css`.

## Typografie – Zufällige Schriftarten pro Todo

Jedes Todo-Item bekommt beim Rendern eine Schriftart aus einem Pool von 17 Familien zugewiesen. Die Logik liegt in `src/composables/useTodoFonts.ts`:

- **Deterministic:** Der Font wird per Hash der Todo-ID bestimmt — gleiche ID → gleicher Font, stabil über Re-Renders.
- **Kein Duplikat nebeneinander:** Wenn zwei benachbarte Todos denselben Font bekämen, wird der zweite automatisch um einen Slot verschoben.
- **17 Schriftfamilien** (alle selbst gehostet in `src/styles/fonts/`): Aleo, Amarante, Bodoni Moda, Cardo, EB Garamond, Faustina, Karla, Lora, Manrope, Merienda, Merriweather, Montserrat, Patrick Hand, Roboto, Roboto Condensed, Roboto Slab, Sorts Mill Goudy.
- Dateibenennung: `FontName-Style.ttf` (z.B. `BodoniModa-Italic.ttf`). `@font-face`-Deklarationen in `src/styles/fonts.css`.

## Entschiedene Design-Fragen

- **Today-Reset:** Täglich um 04:00 Uhr – alle `inToday = true` Flags werden zurückgesetzt. Beim App-Start wird `lastResetDate` geprüft.
- **Dark/Light Toggle:** Keins. Fixes Design (eine Variante).
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

- IDs werden via `uuid()` in den Stores erzeugt – `crypto.randomUUID()` mit `Math.random()`-Fallback, damit die App auch über HTTP (non-secure context) funktioniert.
- `pinia-plugin-persistedstate` übernimmt localStorage-Sync automatisch.
- File API: `showSaveFilePicker`/`showOpenFilePicker` mit Fallback auf `a[download]` / `<input type="file">`.
- Kein TypeScript-Strict erforderlich, aber Interfaces aus dem Datenmodell konsequent verwenden.

## Arbeitsweise mit Claude

- **Nach jeder bedeutenden Änderung committen** – nicht zu lange sammeln. Bedeutend heißt: neues Feature, sichtbare UI-Änderung, Bugfix, Refactoring einer Komponente.
- Commit-Messages auf Deutsch oder Englisch, kurz und beschreibend.
- Auf `design/poppy` kann frei experimentiert werden – trotzdem regelmäßig committen, damit der Fortschritt nachvollziehbar bleibt.
- **Alle UI-Inhalte (Labels, Buttons, Menüeinträge, Platzhaltertexte) immer auf Englisch.** Keine deutschen Begriffe im Interface.
