<script setup lang="ts">
import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!

const filteredTodos = computed(() => {
  let result = store.todayTodos
  if (activeTagIds.value.length > 0) {
    result = result.filter(t => t.tags.some(tid => activeTagIds.value.includes(tid)))
  }
  return result
})

const fontMap = computed(() => assignFonts(filteredTodos.value.map(t => t.id)))
</script>

<template>
  <div class="today-view">
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
    <p v-else class="empty">No todos for today.</p>
  </div>
</template>

<style scoped>
.today-view {
  width: 100%;
  max-width: 640px;
}

.todo-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.empty {
  color: var(--gray-light);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
