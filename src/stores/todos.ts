import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Tag {
  id: string
  label: string
  color: string
}

export interface Project {
  id: string
  name: string
  visible: boolean
}

export interface Todo {
  id: string
  title: string
  note?: string
  tags: string[]
  projectId?: string
  createdAt: string
  inToday: boolean
  completedAt?: string
  workLog: string[]
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const tags = ref<Tag[]>([])
  const projects = ref<Project[]>([])
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

  const visibleProjectIds = computed(() =>
    new Set(projects.value.filter(p => p.visible).map(p => p.id))
  )

  // ── Todo Actions ──
  function addTodo(title: string, extra: Partial<Pick<Todo, 'note' | 'tags' | 'projectId'>> = {}): Todo {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      note: extra.note,
      tags: extra.tags ?? [],
      projectId: extra.projectId,
      createdAt: new Date().toISOString(),
      inToday: false,
      workLog: [],
    }
    todos.value.unshift(todo)
    return todo
  }

  function updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'note' | 'tags' | 'projectId'>>) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return
    if (patch.title !== undefined) todo.title = patch.title.trim()
    if (patch.note !== undefined) todo.note = patch.note
    if (patch.tags !== undefined) todo.tags = patch.tags
    if (patch.projectId !== undefined) todo.projectId = patch.projectId
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  function sendToToday(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.inToday = true
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
    const tag: Tag = { id: crypto.randomUUID(), label: label.trim(), color }
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

  // ── Project Actions ──
  function addProject(name: string): Project {
    const project: Project = { id: crypto.randomUUID(), name: name.trim(), visible: true }
    projects.value.push(project)
    return project
  }

  function updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'visible'>>) {
    const project = projects.value.find(p => p.id === id)
    if (!project) return
    if (patch.name !== undefined) project.name = patch.name.trim()
    if (patch.visible !== undefined) project.visible = patch.visible
  }

  function deleteProject(id: string) {
    projects.value = projects.value.filter(p => p.id !== id)
    todos.value.forEach(todo => {
      if (todo.projectId === id) todo.projectId = undefined
    })
  }

  // ── Reset ──
  function resetToday() {
    todos.value.forEach(todo => { todo.inToday = false })
    lastResetDate.value = new Date().toISOString().slice(0, 10)
  }

  return {
    // state
    todos, tags, projects, lastResetDate,
    // getters
    activeTodos, todayTodos, archivedTodos, visibleProjectIds,
    // actions
    addTodo, updateTodo, deleteTodo, sendToToday, completeTodo, doneForToday,
    addTag, updateTag, deleteTag,
    addProject, updateProject, deleteProject,
    resetToday,
  }
}, {
  persist: true,
})
