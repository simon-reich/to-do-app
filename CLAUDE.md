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
| Icons | `lucide-vue-next` |
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
│   │   ├── TodoInlineInput.vue  // Inline-Input mit "+ Details" Expand
│   │   ├── TodoItem.vue         // Listeneintrag + Edit-Mode
│   │   ├── TodoCheckModal.vue   // "Erledigt" vs "Für heute fertig" Auswahl
│   │   ├── TagBadge.vue
│   │   ├── TagForm.vue          // Bulk-Input + Einzel-Edit
│   │   └── ProjectGroup.vue
│   ├── views/
│   │   ├── AllTodos.vue
│   │   ├── Today.vue
│   │   ├── Archive.vue
│   │   └── Calendar.vue
│   ├── stores/
│   │   └── todos.ts             // Pinia Store
│   ├── composables/
│   │   ├── useStorage.ts        // Import/Export Logik
│   │   └── useReset.ts          // 4-Uhr-Reset Logik
│   ├── utils/
│   │   └── randomColor.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
└── package.json
```

## Entschiedene Design-Fragen

- **Today-Reset:** Täglich um 04:00 Uhr – alle `inToday = true` Flags werden zurückgesetzt. Beim App-Start wird `lastResetDate` geprüft.
- **Dark/Light Toggle:** Keins. Fixes Design (eine Variante).
- **Projekt-Zuordnung:** Max. ein Projekt pro Todo.
- **Todo-Erstellung:** Inline-Input oben in All-Todos, immer sichtbar. Enter speichert, Fokus bleibt im Feld.
- **Zusatzfelder:** Note, Tags, Projekt via „+ Details" aufklappbar. Escape leert & klappt zu.
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
