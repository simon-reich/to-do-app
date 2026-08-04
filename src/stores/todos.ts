import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export const PRIORITY_TAG_ID = '__priority__'
export const LOOP_TAG_ID = '__loop__'

export interface Tag {
  id: string
  label: string
}

export type LoopUnit = 'day' | 'week' | 'month' | 'year'

export interface LoopInterval {
  /** 'once' is a plain one-time due date, no recurrence — unit/count are
   *  unused. Absent/undefined means legacy data from before this field
   *  existed, which always had unit+count set: treat as 'loop'. */
  mode?: 'once' | 'loop'
  unit?: LoopUnit
  count?: number
  /** ISO date (YYYY-MM-DD) — the recurrence's start date in loop mode, or
   *  the due date itself in once mode. */
  startDate: string
}

export interface Todo {
  id: string
  title: string
  tags: string[]
  createdAt: string
  inToday: boolean
  /** When this todo was last sent to Focus — drives Focus's own sort
   *  order (oldest addition first), separate from createdAt. */
  focusAddedAt?: string
  completedAt?: string
  workLog: string[]
  loopInterval?: LoopInterval
}

// Append-only log of Done / Done-for-today events, entirely separate from
// the Todo it came from — the calendar reads from here instead of from
// todos[].completedAt/workLog directly, so deleting a todo later (it turned
// out to be a one-off, or a recurring one that's no longer needed) can never
// retroactively erase what the calendar already showed for past days. Title
// is snapshotted at the time of the event on purpose: a later rename
// shouldn't rewrite history either.
export interface HistoryEntry {
  todoId: string
  title: string
  /** YYYY-MM-DD, the calendar day the event happened on. */
  date: string
  type: 'done' | 'worklog'
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const tags = ref<Tag[]>([])
  const history = ref<HistoryEntry[]>([])

  // One-time migration for installs from before `history` existed: seeds it
  // from whatever completedAt/workLog already sit on todos, so upgrading
  // doesn't blank out the calendar for anything done before this shipped.
  // Guarded on history still being empty, not on a version flag — once any
  // real event has been logged there's nothing left to backfill anyway.
  if (history.value.length === 0) {
    const backfilled: HistoryEntry[] = []
    for (const t of todos.value) {
      if (t.completedAt) backfilled.push({ todoId: t.id, title: t.title, date: t.completedAt.slice(0, 10), type: 'done' })
      for (const ts of t.workLog) backfilled.push({ todoId: t.id, title: t.title, date: ts.slice(0, 10), type: 'worklog' })
    }
    if (backfilled.length) history.value = backfilled
  }

  // ── Getters ──
  const activeTodos = computed(() =>
    todos.value.filter(t => !t.completedAt)
  )

  const todayTodos = computed(() =>
    todos.value.filter(t => t.inToday && !t.completedAt)
  )

  // Completed / worked-on history entries for a given calendar day
  // (YYYY-MM-DD), used by Calendar.vue's day-detail list. Reads from
  // `history`, not from the todos themselves — see HistoryEntry above.
  function completedOn(dateStr: string) {
    return history.value.filter(h => h.type === 'done' && h.date === dateStr)
  }

  function workedOn(dateStr: string) {
    const doneIds = new Set(completedOn(dateStr).map(h => h.todoId))
    const seen = new Set<string>()
    return history.value.filter(h => {
      if (h.type !== 'worklog' || h.date !== dateStr) return false
      if (doneIds.has(h.todoId) || seen.has(h.todoId)) return false
      seen.add(h.todoId)
      return true
    })
  }

  // ── Todo Actions ──
  function addTodo(title: string, extra: Partial<Pick<Todo, 'tags' | 'loopInterval'>> = {}): Todo {
    const todo: Todo = {
      id: uuid(),
      title: title.trim(),
      tags: extra.tags ?? [],
      createdAt: new Date().toISOString(),
      inToday: false,
      workLog: [],
      loopInterval: extra.loopInterval,
    }
    todos.value.unshift(todo)
    return todo
  }

  function updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'tags' | 'loopInterval'>>) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (patch.title !== undefined) todo.title = patch.title.trim()
    if (patch.tags !== undefined) todo.tags = patch.tags
    if ('loopInterval' in patch) todo.loopInterval = patch.loopInterval
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  function sendToToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.inToday = true
      todo.focusAddedAt = new Date().toISOString()
    }
  }

  function removeFromToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.inToday = false
  }

  function completeTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      const now = new Date().toISOString()
      todo.completedAt = now
      todo.inToday = false
      history.value.push({ todoId: todo.id, title: todo.title, date: now.slice(0, 10), type: 'done' })
    }
  }

  function doneForToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      const now = new Date().toISOString()
      todo.workLog.push(now)
      todo.inToday = false
      history.value.push({ todoId: todo.id, title: todo.title, date: now.slice(0, 10), type: 'worklog' })
    }
  }

  // ── System tags ──
  const userTags = computed(() => tags.value.filter(t => t.id !== PRIORITY_TAG_ID && t.id !== LOOP_TAG_ID))

  function ensureSystemTags() {
    const existing = tags.value.find(t => t.id === PRIORITY_TAG_ID)
    if (!existing) {
      tags.value.unshift({ id: PRIORITY_TAG_ID, label: 'prio' })
    } else if (existing.label !== 'prio') {
      // Keeps already-persisted installs (localStorage still holding the
      // old 'priority' label) in sync with the current label instead of
      // only applying it to brand-new tag lists.
      existing.label = 'prio'
    }

    const existingLoop = tags.value.find(t => t.id === LOOP_TAG_ID)
    if (!existingLoop) {
      const prioIdx = tags.value.findIndex(t => t.id === PRIORITY_TAG_ID)
      tags.value.splice(prioIdx + 1, 0, { id: LOOP_TAG_ID, label: 'date' })
    } else if (existingLoop.label !== 'date') {
      // Same label-migration idea as 'prio' above — the Loop feature grew
      // into the broader Date feature (once-off due dates, not just
      // recurrence), same tag id, just a new label for already-persisted
      // installs.
      existingLoop.label = 'date'
    }
  }

  // ── Tag Actions ──
  function addTag(label: string): Tag {
    const tag: Tag = { id: uuid(), label: label.trim() }
    tags.value.push(tag)
    return tag
  }

  function deleteTag(id: string) {
    if (id === PRIORITY_TAG_ID || id === LOOP_TAG_ID) return
    tags.value = tags.value.filter(t => t.id !== id)
    todos.value.forEach(todo => {
      todo.tags = todo.tags.filter(tid => tid !== id)
    })
  }

  // ── Import ──
  function importData(data: { todos: Todo[]; tags: Tag[]; history?: HistoryEntry[] }) {
    todos.value = data.todos
    tags.value = data.tags
    // Older export files predate `history` — fall back to backfilling it
    // from the incoming todos themselves rather than losing calendar data.
    if (data.history) {
      history.value = data.history
    } else {
      const backfilled: HistoryEntry[] = []
      for (const t of data.todos) {
        if (t.completedAt) backfilled.push({ todoId: t.id, title: t.title, date: t.completedAt.slice(0, 10), type: 'done' })
        for (const ts of t.workLog) backfilled.push({ todoId: t.id, title: t.title, date: ts.slice(0, 10), type: 'worklog' })
      }
      history.value = backfilled
    }
  }

  return {
    // state
    todos, tags, history,
    // getters
    activeTodos, todayTodos, userTags,
    completedOn, workedOn,
    // actions
    addTodo, updateTodo, deleteTodo, sendToToday, removeFromToday, completeTodo, doneForToday,
    addTag, deleteTag, ensureSystemTags,
    importData,
  }
}, {
  persist: true,
})
