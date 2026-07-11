<script setup lang="ts">
import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'

const store = useTodosStore()
const activeTagIds = inject<Ref<string[]>>('activeTagIds')!
const sortKey = inject<Ref<'createdAt' | 'title'>>('sortKey')!
const listView = inject<Ref<boolean>>('listView')!

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
const siblingIds = computed(() => filteredTodos.value.map(t => t.id))
</script>

<template>
  <div class="all-todos" :class="{ 'list-view': listView }">
    <div v-if="filteredTodos.length" class="todo-wrap" :class="{ 'list-view': listView }">
      <TodoCard
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        :sibling-ids="siblingIds"
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

.all-todos.list-view {
  max-width: 640px;
}

.todo-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.todo-wrap.list-view {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: 640px;
}

@media (max-width: 700px) {
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

/* Tablet: cards stay in a wrapping grid (unlike phone's single column),
   but the reading-width cap needs to go so more of them fit per row. */
@media (min-width: 701px) and (max-width: 1024px) {
  .all-todos {
    max-width: 100%;
  }
  .todo-wrap {
    gap: 8px;
  }

  /* Grid mode already spans the full row so centering is moot, but list
     mode keeps its 640px reading-width cap — content-inner's align-items:
     center then centers that narrower block, so its left edge drifts
     depending on how much wider than 640px the row happens to be at a
     given tablet width, instead of lining up with the top-menu's icons.
     Pin it to the left, offset to match main-head's own left padding
     (20px) against content-inner's (6px). */
  .all-todos.list-view {
    align-self: flex-start;
    margin-left: 14px;
  }
}

.empty {
  color: var(--ink);
  font-size: 15px;
  text-align: center;
  margin-top: 24px;
}
</style>
