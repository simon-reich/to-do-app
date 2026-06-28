<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import TodoCheckModal from '../components/TodoCheckModal.vue'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!

const checkingId = ref<string | null>(null)
const checkingTodo = computed(() =>
  checkingId.value ? store.todos.find(t => t.id === checkingId.value) : null
)

function handleComplete(id: string) {
  store.completeTodo(id)
  checkingId.value = null
}

function handleDoneForToday(id: string) {
  store.doneForToday(id)
  checkingId.value = null
}

const filteredTodos = computed(() => {
  let result = store.todayTodos
  if (activeTagIds.value.length > 0) {
    result = result.filter(t => t.tags.some(tid => activeTagIds.value.includes(tid)))
  }
  return result
})
</script>

<template>
  <div class="today-view">
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        mode="today"
        @start-check="checkingId = $event"
        @remove-from-today="store.removeFromToday($event)"
      />
    </div>
    <p v-else class="empty">No todos for today.</p>

    <Teleport to="body">
      <div v-if="checkingId && checkingTodo" class="overlay" @click.self="checkingId = null">
        <TodoCheckModal
          :title="checkingTodo.title"
          @complete="handleComplete(checkingId!)"
          @done-for-today="handleDoneForToday(checkingId!)"
          @cancel="checkingId = null"
        />
      </div>
    </Teleport>
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
  align-items: center;
  gap: 12px;
}

.empty {
  color: var(--gray-light);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
