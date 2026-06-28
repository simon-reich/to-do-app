<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import TodoCheckModal from '../components/TodoCheckModal.vue'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!
const sortKey = inject<Ref<'createdAt' | 'title'>>('sortKey')!

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
</script>

<template>
  <div class="all-todos">
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        mode="all"
        @send-to-today="store.sendToToday($event)"
        @remove-from-today="store.removeFromToday($event)"
        @start-check="checkingId = $event"
        @delete="store.deleteTodo($event)"
      />
    </div>
    <p v-else class="empty">
      {{ store.activeTodos.filter(t => !t.inToday).length === 0 && activeTagIds.length === 0 ? 'No todos yet.' : 'No todos for this filter.' }}
    </p>

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
.all-todos {
  width: 100%;
  max-width: 800px;
}

.todo-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.empty {
  color: var(--gray-light);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
