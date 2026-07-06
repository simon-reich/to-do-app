<script setup lang="ts">
import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore, PRIORITY_TAG_ID } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!

const filteredTodos = computed(() => {
  let result = store.todayTodos
  if (activeTagIds.value.length > 0) {
    result = result.filter(t => t.tags.some(tid => activeTagIds.value.includes(tid)))
  }
  return [...result].sort((a, b) => {
    const aPrio = a.tags.includes(PRIORITY_TAG_ID) ? 0 : 1
    const bPrio = b.tags.includes(PRIORITY_TAG_ID) ? 0 : 1
    return aPrio - bPrio
  })
})

const fontMap = computed(() => assignFonts(filteredTodos.value.map(t => t.id)))

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const sessionLabel = computed(() => {
  const start = store.currentSessionStart
  if (!start) return null
  const todayStr = new Date().toISOString().slice(0, 10)
  return start === todayStr ? fmtDate(start) : `${fmtDate(start)} – ${fmtDate(todayStr)}`
})
</script>

<template>
  <div class="focus-view">
    <p v-if="sessionLabel" class="session-label">{{ sessionLabel }}</p>
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        mode="today"
        @remove-from-today="store.removeFromToday($event)"
        @complete="store.completeTodo($event)"
        @done-for-today="store.doneForToday($event)"
      />
    </div>
    <p v-else class="empty">Nothing in focus right now.</p>
  </div>
</template>

<style scoped>
.focus-view {
  width: 100%;
  max-width: 640px;
}

.session-label {
  color: var(--ink-dark);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.todo-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.empty {
  color: var(--ink);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
