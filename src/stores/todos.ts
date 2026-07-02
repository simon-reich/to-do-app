import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export interface Tag {
  id: string
  label: string
  color: string
}

export interface Todo {
  id: string
  title: string
  note?: string
  tags: string[]
  createdAt: string
  inToday: boolean
  completedAt?: string
  workLog: string[]
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const tags = ref<Tag[]>([])
  const lastResetDate = ref<string>('')

  // ── Getters ──
  const activeTodos = computed(() =>
    todos.value.filter(t => !t.completedAt)
  )

  const todayTodos = computed(() =>
    todos.value.filter(t => t.inToday && !t.completedAt)
  )

  const archivedTodos = computed(() =>
    todos.value.filter(t => !!t.completedAt)
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
  )

  // ── Todo Actions ──
  function addTodo(title: string, extra: Partial<Pick<Todo, 'note' | 'tags'>> = {}): Todo {
    const todo: Todo = {
      id: uuid(),
      title: title.trim(),
      note: extra.note,
      tags: extra.tags ?? [],
      createdAt: new Date().toISOString(),
      inToday: false,
      workLog: [],
    }
    todos.value.unshift(todo)
    return todo
  }

  function updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'note' | 'tags'>>) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (patch.title !== undefined) todo.title = patch.title.trim()
    if (patch.note !== undefined) todo.note = patch.note
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

  // ── Tag Actions ──
  function addTag(label: string, color: string): Tag {
    const tag: Tag = { id: uuid(), label: label.trim(), color }
    tags.value.push(tag)
    return tag
  }

  function updateTag(id: string, patch: Partial<Pick<Tag, 'label' | 'color'>>) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    if (patch.label !== undefined) tag.label = patch.label.trim()
    if (patch.color !== undefined) tag.color = patch.color
  }

  function deleteTag(id: string) {
    tags.value = tags.value.filter(t => t.id !== id)
    todos.value.forEach(todo => {
      todo.tags = todo.tags.filter(tid => tid !== id)
    })
  }

  // ── Reset ──
  function resetToday() {
    todos.value.forEach(todo => { todo.inToday = false })
    lastResetDate.value = new Date().toISOString().slice(0, 10)
  }

  // ── Import ──
  function importData(data: { todos: Todo[]; tags: Tag[]; lastResetDate: string }) {
    todos.value = data.todos
    tags.value = data.tags
    lastResetDate.value = data.lastResetDate
  }

  return {
    // state
    todos, tags, lastResetDate,
    // getters
    activeTodos, todayTodos, archivedTodos,
    // actions
    addTodo, updateTodo, deleteTodo, sendToToday, removeFromToday, completeTodo, doneForToday,
    addTag, updateTag, deleteTag,
    resetToday, importData,
  }
}, {
  persist: true,
})
