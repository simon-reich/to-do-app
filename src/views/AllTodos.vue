<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUpDown } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'
import TodoInlineInput from '../components/TodoInlineInput.vue'
import TodoItem from '../components/TodoItem.vue'
import TagBadge from '../components/TagBadge.vue'

const store = useTodosStore()

type SortKey = 'createdAt' | 'title'
type SortDir = 'asc' | 'desc'

const sortKey = ref<SortKey>('createdAt')
const sortDir = ref<SortDir>('desc')
const filterTagIds = ref<string[]>([])

function toggleSortDir() {
  sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
}

function toggleTagFilter(id: string) {
  const idx = filterTagIds.value.indexOf(id)
  if (idx === -1) filterTagIds.value.push(id)
  else filterTagIds.value.splice(idx, 1)
}

const sortedTodos = computed(() => {
  let result = store.activeTodos.filter(todo => {
    // hide todos whose project is hidden
    if (todo.projectId && !store.visibleProjectIds.has(todo.projectId)) return false
    // tag filter (must match at least one selected tag)
    if (filterTagIds.value.length > 0) {
      return todo.tags.some(tid => filterTagIds.value.includes(tid))
    }
    return true
  })

  return [...result].sort((a, b) => {
    const cmp = sortKey.value === 'title'
      ? a.title.localeCompare(b.title, 'de')
      : a.createdAt.localeCompare(b.createdAt)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const hasProjects = computed(() => store.projects.length > 0)
const hasTags = computed(() => store.tags.length > 0)
</script>

<template>
  <div class="view">
    <TodoInlineInput />

    <!-- Controls -->
    <div class="controls">
      <!-- Sort -->
      <div class="sort-row">
        <select v-model="sortKey" class="sort-select">
          <option value="createdAt">Datum</option>
          <option value="title">A–Z</option>
        </select>
        <button class="sort-dir-btn" :title="sortDir === 'desc' ? 'Absteigend' : 'Aufsteigend'" @click="toggleSortDir">
          <ArrowUpDown :size="14" />
          {{ sortDir === 'desc' ? '↓' : '↑' }}
        </button>
      </div>

      <!-- Tag filter -->
      <div v-if="hasTags" class="tag-filter">
        <button
          v-for="tag in store.tags"
          :key="tag.id"
          class="tag-filter-btn"
          :class="{ selected: filterTagIds.includes(tag.id) }"
          @click="toggleTagFilter(tag.id)"
        >
          <TagBadge :tag="tag" />
        </button>
      </div>

      <!-- Project visibility -->
      <div v-if="hasProjects" class="project-toggles">
        <button
          v-for="project in store.projects"
          :key="project.id"
          class="project-toggle"
          :class="{ hidden: !project.visible }"
          @click="store.updateProject(project.id, { visible: !project.visible })"
        >
          {{ project.name }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="sortedTodos.length" class="todo-list">
      <TodoItem v-for="todo in sortedTodos" :key="todo.id" :todo="todo" />
    </div>

    <p v-else class="empty-state">
      {{ store.activeTodos.length === 0 ? 'Noch keine Todos. Leg einfach los!' : 'Keine Todos für diesen Filter.' }}
    </p>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.sort-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.sort-select {
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  outline: none;
}

.sort-select:focus {
  border-color: var(--accent);
}

.sort-dir-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
}

.sort-dir-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-filter-btn {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 10px;
  opacity: 0.45;
  transition: opacity 0.15s;
}

.tag-filter-btn.selected,
.tag-filter-btn:hover {
  opacity: 1;
}

.project-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.project-toggle {
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
}

.project-toggle.hidden {
  opacity: 0.4;
  text-decoration: line-through;
}

.project-toggle:hover {
  border-color: var(--accent);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 40px;
}
</style>
