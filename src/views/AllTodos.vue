<script setup lang="ts">
import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!
const sortKey = inject<Ref<'createdAt' | 'title'>>('sortKey')!

const filteredTodos = computed(() => {
  let result = store.activeTodos.filter(t => !t.inToday)
  if (activeTagIds.value.length > 0) {
    result = result.filter(t => t.tags.some(tid => activeTagIds.value.includes(tid)))
  }
  return [...result].sort((a, b) =>
    sortKey.value === 'title'
      ? a.title.localeCompare(b.title, 'de')
      : b.createdAt.localeCompare(a.createdAt)
  )
})

const fontMap = computed(() => assignFonts(filteredTodos.value.map(t => t.id)))
</script>

<template>
  <div class="all-todos">
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        mode="all"
        @send-to-today="store.sendToToday($event)"
        @remove-from-today="store.removeFromToday($event)"
        @delete="store.deleteTodo($event)"
      />
    </div>
    <p v-else class="empty">
      {{ store.activeTodos.filter(t => !t.inToday).length === 0 && activeTagIds.length === 0 ? 'No todos yet.' : 'No todos for this filter.' }}
    </p>
  </div>
</template>

<style scoped>
.all-todos {
  width: 100%;
  max-width: min(70vw, 1100px);
}

.todo-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 900px) {
  .all-todos {
    max-width: 100%;
  }
  .todo-wrap {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: flex-start;
  }
}

.empty {
  color: var(--gray-light);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
