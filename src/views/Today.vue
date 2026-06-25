<script setup lang="ts">
import { ref, computed } from 'vue'
import { Circle } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'
import TagBadge from '../components/TagBadge.vue'
import TodoCheckModal from '../components/TodoCheckModal.vue'

const store = useTodosStore()
const checkingId = ref<string | null>(null)

function startCheck(id: string) {
  checkingId.value = checkingId.value === id ? null : id
}

function handleComplete(id: string) {
  store.completeTodo(id)
  checkingId.value = null
}

function handleDoneForToday(id: string) {
  store.doneForToday(id)
  checkingId.value = null
}

const todayTodos = computed(() => store.todayTodos)

function tagById(id: string) {
  return store.tags.find(t => t.id === id)
}

function projectName(projectId?: string) {
  return projectId ? store.projects.find(p => p.id === projectId)?.name : undefined
}
</script>

<template>
  <div class="view">
    <h1>Heute</h1>

    <div v-if="todayTodos.length" class="today-list">
      <template v-for="todo in todayTodos" :key="todo.id">
        <!-- Check modal replaces the item when active -->
        <TodoCheckModal
          v-if="checkingId === todo.id"
          :title="todo.title"
          @complete="handleComplete(todo.id)"
          @done-for-today="handleDoneForToday(todo.id)"
          @cancel="checkingId = null"
        />

        <div v-else class="today-item" @click="startCheck(todo.id)">
          <button class="check-btn" @click.stop="startCheck(todo.id)">
            <Circle :size="20" />
          </button>
          <div class="today-content">
            <span class="today-title">{{ todo.title }}</span>
            <p v-if="todo.note" class="today-note">{{ todo.note }}</p>
            <div v-if="todo.tags.length || todo.projectId" class="today-meta">
              <span v-if="projectName(todo.projectId)" class="project-chip">
                {{ projectName(todo.projectId) }}
              </span>
              <template v-for="tid in todo.tags" :key="tid">
                <TagBadge v-if="tagById(tid)" :tag="tagById(tid)!" />
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>

    <p v-else class="empty-state">
      Keine Todos für heute. Geh in „Alle" und schick welche rüber.
    </p>
  </div>
</template>

<style scoped>
.today-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.today-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.today-item:hover {
  border-color: var(--accent);
}

.check-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-top: 1px;
  transition: color 0.15s;
}

.today-item:hover .check-btn {
  color: var(--accent);
}

.today-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.today-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
}

.today-note {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
  white-space: pre-wrap;
}

.today-meta {
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
