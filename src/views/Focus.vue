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
const siblingIds = computed(() => filteredTodos.value.map(t => t.id))
</script>

<template>
  <div class="focus-view" :class="{ 'is-empty': !filteredTodos.length }">
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="(todo, index) in filteredTodos"
        :key="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        :sibling-ids="siblingIds"
        :index="index"
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

.todo-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.empty {
  color: var(--ink);
  font-size: 18px;
  font-weight: bold;
  font-family: var(--font-playful, sans-serif);
  text-align: center;
  margin-top: 24px;
}

/* Same fix as AllTodos.vue's list-view: content-inner centers this
   640px-capped block, so its left edge drifts depending on how much wider
   than 640px the row is at a given tablet width. Pin it to the left,
   offset to match main-head's own left padding (20px) against
   content-inner's (6px). Doesn't apply to the empty state — there's no
   list to align against, so it stays centered like the calendar's own
   empty-day placeholder. */
@media (min-width: 701px) and (max-width: 1024px) {
  .focus-view:not(.is-empty) {
    align-self: flex-start;
    margin-left: 14px;
  }
}
</style>
