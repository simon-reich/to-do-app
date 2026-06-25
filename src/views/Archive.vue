<script setup lang="ts">
import { computed } from 'vue'
import { useTodosStore } from '../stores/todos'
import TagBadge from '../components/TagBadge.vue'

const store = useTodosStore()

// Group archived todos by month
const grouped = computed(() => {
  const groups: { label: string; todos: typeof store.archivedTodos }[] = []
  const seen = new Map<string, number>()

  for (const todo of store.archivedTodos) {
    const date = new Date(todo.completedAt! + '')
    const label = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    if (!seen.has(label)) {
      seen.set(label, groups.length)
      groups.push({ label, todos: [] })
    }
    groups[seen.get(label)!].todos.push(todo)
  }
  return groups
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'short',
  })
}

function tagById(id: string) {
  return store.tags.find(t => t.id === id)
}

function projectName(projectId?: string) {
  return projectId ? store.projects.find(p => p.id === projectId)?.name : undefined
}
</script>

<template>
  <div class="view">
    <div class="archive-header">
      <h1>Archiv</h1>
      <span v-if="store.archivedTodos.length" class="count-badge">
        {{ store.archivedTodos.length }}
      </span>
    </div>

    <div v-if="grouped.length" class="groups">
      <div v-for="group in grouped" :key="group.label" class="month-group">
        <h2 class="month-label">{{ group.label }}</h2>
        <div class="archive-list">
          <div v-for="todo in group.todos" :key="todo.id" class="archive-item">
            <div class="archive-main">
              <span class="archive-title">{{ todo.title }}</span>
              <span class="archive-date">{{ formatDate(todo.completedAt!) }}</span>
            </div>
            <p v-if="todo.note" class="archive-note">{{ todo.note }}</p>
            <div v-if="todo.tags.length || todo.projectId" class="archive-meta">
              <span v-if="projectName(todo.projectId)" class="project-chip">
                {{ projectName(todo.projectId) }}
              </span>
              <template v-for="tid in todo.tags" :key="tid">
                <TagBadge v-if="tagById(tid)" :tag="tagById(tid)!" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="empty-state">Noch nichts abgehakt. Los geht's!</p>
  </div>
</template>

<style scoped>
.archive-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.archive-header h1 {
  margin-bottom: 0;
}

.count-badge {
  background: var(--accent-subtle);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 12px;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.month-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.archive-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.archive-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.archive-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.archive-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--border);
  line-height: 1.4;
}

.archive-date {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.archive-note {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.archive-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.project-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px 8px;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 40px;
}
</style>
