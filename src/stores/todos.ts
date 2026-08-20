import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { drawCelebrationKey, type CelebrationKey } from '../composables/useCelebrations'

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

export type LoopUnit = 'day' | 'week' | 'month' | 'year' | 'weekdays'

export interface LoopInterval {
  /** 'once' is a plain one-time due date, no recurrence — unit/count are
   *  unused. Absent/undefined means legacy data from before this field
   *  existed, which always had unit+count set: treat as 'loop'. */
  mode?: 'once' | 'loop'
  unit?: LoopUnit
  count?: number
  /** Only used when unit === 'weekdays' — the selected days, as
   *  JS Date.getDay() values (0 = Sunday .. 6 = Saturday). count is unused
   *  in this unit; due-ness is purely "is today one of these days". */
  weekdays?: number[]
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
  /** Which celebration (see TodoCard.vue's "Celebration-Animationen"
   *  section) plays when this todo is completed — assigned once in
   *  sendToToday below, fixed for as long as it stays in Focus, rather
   *  than re-rolled every time its check-menu happens to open. Absent for
   *  a todo that's never been sent to Focus since this field existed. */
  celebration?: CelebrationKey
  /** Set instead of actually removing the todo when it's deleted while it
   *  still has calendar-relevant history (a completedAt or a non-empty
   *  workLog) — see deleteTodo below. Filtered out of every active list
   *  (activeTodos/todayTodos) same as completedAt, but the calendar still
   *  reads completedAt/workLog directly off it, so deleting a todo can
   *  never retroactively erase days it already showed on past calendars.
   *  A todo that was deleted with no history at all (never completed, no
   *  workLog) has nothing worth keeping and is just removed outright. */
  deletedAt?: string
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const tags = ref<Tag[]>([])

  // One-time migration for the brief window this app had a separate
  // append-only `history` log (one row per Done/Done-for-today event,
  // never touched by deleteTodo) instead of the deletedAt approach below.
  // Any todo it logged that's since been hard-deleted and is gone from
  // `todos` now would otherwise vanish from the calendar for good — so
  // reconstruct a deletedAt stub for exactly those (todos that are still
  // alive already carry their own completedAt/workLog, nothing to do).
  // Safe to run every load: once a todoId exists in `todos` (stub or
  // otherwise), it's skipped.
  try {
    const raw = localStorage.getItem('todos')
    const oldHistory = raw ? JSON.parse(raw)?.history : null
    if (Array.isArray(oldHistory) && oldHistory.length) {
      const byTodo = new Map<string, { title: string; done?: string; workLog: string[] }>()
      for (const h of oldHistory as { todoId: string; title: string; date: string; type: 'done' | 'worklog' }[]) {
        const entry = byTodo.get(h.todoId) ?? { title: h.title, workLog: [] }
        if (h.type === 'done') entry.done = h.date
        else entry.workLog.push(`${h.date}T00:00:00.000Z`)
        byTodo.set(h.todoId, entry)
      }
      const existingIds = new Set(todos.value.map(t => t.id))
      for (const [todoId, entry] of byTodo) {
        if (existingIds.has(todoId)) continue
        todos.value.push({
          id: todoId,
          title: entry.title,
          tags: [],
          createdAt: entry.workLog[0] ?? (entry.done ? `${entry.done}T00:00:00.000Z` : new Date().toISOString()),
          inToday: false,
          workLog: entry.workLog,
          completedAt: entry.done ? `${entry.done}T00:00:00.000Z` : undefined,
          deletedAt: new Date().toISOString(),
        })
      }
    }
  } catch {
    // Malformed/missing localStorage entry — nothing to migrate.
  }

  // ── Getters ──
  const activeTodos = computed(() =>
    todos.value.filter(t => !t.completedAt && !t.deletedAt)
  )

  const todayTodos = computed(() =>
    todos.value.filter(t => t.inToday && !t.completedAt && !t.deletedAt)
  )

  // Completed / worked-on todos for a given calendar day (YYYY-MM-DD), used
  // by Calendar.vue's day-detail list. Reads completedAt/workLog straight
  // off the todos — including deletedAt ones, which is exactly why deleted
  // todos with real history are kept around as stubs instead of removed
  // (see deleteTodo below) rather than purged outright.
  function completedOn(dateStr: string) {
    return todos.value.filter(t => t.completedAt?.slice(0, 10) === dateStr)
  }

  function workedOn(dateStr: string) {
    const doneIds = new Set(completedOn(dateStr).map(t => t.id))
    return todos.value.filter(t =>
      !doneIds.has(t.id) && t.workLog.some(ts => ts.slice(0, 10) === dateStr)
    )
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

  function updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'tags' | 'loopInterval' | 'celebration'>>) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (patch.title !== undefined) todo.title = patch.title.trim()
    if (patch.tags !== undefined) todo.tags = patch.tags
    if ('loopInterval' in patch) todo.loopInterval = patch.loopInterval
    if (patch.celebration !== undefined) todo.celebration = patch.celebration
  }

  // Hard-removes a todo that never had any calendar-relevant history (never
  // completed, no workLog) — nothing worth keeping. One that does have
  // history is soft-deleted instead (deletedAt set, stays in `todos`) so the
  // calendar keeps showing what it already showed for past days; see the
  // deletedAt field's own comment on Todo above.
  function deleteTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (todo.completedAt || todo.workLog.length > 0) {
      todo.deletedAt = new Date().toISOString()
    } else {
      todos.value = todos.value.filter(t => t.id !== id)
    }
  }

  function sendToToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.inToday = true
      todo.focusAddedAt = new Date().toISOString()
      // Fresh roll each time it re-enters Focus, not just once ever — see
      // Todo.celebration's own comment.
      todo.celebration = drawCelebrationKey()
    }
  }

  function removeFromToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.inToday = false
  }

  function completeTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completedAt = new Date().toISOString()
      todo.inToday = false
    }
  }

  function doneForToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.workLog.push(new Date().toISOString())
      todo.inToday = false
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
  // `history` is an optional leftover from export files made during this
  // app's brief append-only-log design — same idea as the localStorage
  // migration above: reconstruct a deletedAt stub for any todoId it
  // mentions that isn't in the imported todos themselves.
  function importData(data: { todos: Todo[]; tags: Tag[]; history?: { todoId: string; title: string; date: string; type: 'done' | 'worklog' }[] }) {
    todos.value = data.todos
    tags.value = data.tags
    if (data.history?.length) {
      const byTodo = new Map<string, { title: string; done?: string; workLog: string[] }>()
      for (const h of data.history) {
        const entry = byTodo.get(h.todoId) ?? { title: h.title, workLog: [] }
        if (h.type === 'done') entry.done = h.date
        else entry.workLog.push(`${h.date}T00:00:00.000Z`)
        byTodo.set(h.todoId, entry)
      }
      const existingIds = new Set(todos.value.map(t => t.id))
      for (const [todoId, entry] of byTodo) {
        if (existingIds.has(todoId)) continue
        todos.value.push({
          id: todoId,
          title: entry.title,
          tags: [],
          createdAt: entry.workLog[0] ?? (entry.done ? `${entry.done}T00:00:00.000Z` : new Date().toISOString()),
          inToday: false,
          workLog: entry.workLog,
          completedAt: entry.done ? `${entry.done}T00:00:00.000Z` : undefined,
          deletedAt: new Date().toISOString(),
        })
      }
    }
  }

  return {
    // state
    todos, tags,
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
