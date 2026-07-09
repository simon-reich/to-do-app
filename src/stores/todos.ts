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

export interface Tag {
  id: string
  label: string
}

export interface Todo {
  id: string
  title: string
  tags: string[]
  createdAt: string
  inToday: boolean
  completedAt?: string
  workLog: string[]
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const tags = ref<Tag[]>([])

  // ── Getters ──
  const activeTodos = computed(() =>
    todos.value.filter(t => !t.completedAt)
  )

  const todayTodos = computed(() =>
    todos.value.filter(t => t.inToday && !t.completedAt)
  )

  // Completed / worked-on todos for a given calendar day (YYYY-MM-DD),
  // used by Calendar.vue's day-detail list.
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
  function addTodo(title: string, extra: Partial<Pick<Todo, 'tags'>> = {}): Todo {
    const todo: Todo = {
      id: uuid(),
      title: title.trim(),
      tags: extra.tags ?? [],
      createdAt: new Date().toISOString(),
      inToday: false,
      workLog: [],
    }
    todos.value.unshift(todo)
    return todo
  }

  function updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'tags'>>) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (patch.title !== undefined) todo.title = patch.title.trim()
    if (patch.tags !== undefined) todo.tags = patch.tags
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  function sendToToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.inToday = true
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
  const userTags = computed(() => tags.value.filter(t => t.id !== PRIORITY_TAG_ID))

  function ensureSystemTags() {
    if (!tags.value.find(t => t.id === PRIORITY_TAG_ID)) {
      tags.value.unshift({ id: PRIORITY_TAG_ID, label: 'priority' })
    }
  }

  // ── Tag Actions ──
  function addTag(label: string): Tag {
    const tag: Tag = { id: uuid(), label: label.trim() }
    tags.value.push(tag)
    return tag
  }

  function deleteTag(id: string) {
    if (id === PRIORITY_TAG_ID) return
    tags.value = tags.value.filter(t => t.id !== id)
    todos.value.forEach(todo => {
      todo.tags = todo.tags.filter(tid => tid !== id)
    })
  }

  // ── Import ──
  function importData(data: { todos: Todo[]; tags: Tag[] }) {
    todos.value = data.todos
    tags.value = data.tags
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
