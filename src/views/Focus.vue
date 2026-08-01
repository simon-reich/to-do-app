<script setup lang="ts">
import { computed } from 'vue'
import { useTodosStore, PRIORITY_TAG_ID } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'
import { useListFlip } from '../composables/useListFlip'
import { spawnRemovedFromFocusToast } from '../composables/useToast'

const store = useTodosStore()

// Priority (with or without loop) floats to the top; everything else —
// loop or plain — sorts by when it was actually sent to Focus (oldest
// addition first), not by how recently it was created.
function rank(t: { tags: string[] }): number {
  return t.tags.includes(PRIORITY_TAG_ID) ? 0 : 1
}

// Focus is deliberately unfilterable — it's already the curated, small
// subset by design, and always shows every todo that's in it regardless
// of whatever All/Prio/Loop/tag filter happens to be active in Overview
// (see App.vue's #app.is-focus rules, which gray out that whole filter
// UI here instead of just silently ignoring it).
const filteredTodos = computed(() => {
  return [...store.todayTodos].sort((a, b) => {
    const rankDiff = rank(a) - rank(b)
    if (rankDiff !== 0) return rankDiff
    // Falls back to createdAt for todos already in Focus from before
    // focusAddedAt existed.
    return (a.focusAddedAt ?? a.createdAt).localeCompare(b.focusAddedAt ?? b.createdAt)
  })
})

const fontMap = computed(() => assignFonts(filteredTodos.value.map(t => t.id)))
const siblingIds = computed(() => filteredTodos.value.map(t => t.id))

useListFlip(() => siblingIds.value, '.todo-wrap')

// Mirrors AllTodos.vue's sendToFocus, `obvious` included — a card leaving
// this list otherwise just vanishes with no explanation. Toast rises from
// the card's own position, skipped for a direct CircleMinus click.
function removeFromFocus(id: string, obvious?: boolean) {
  if (!obvious) spawnRemovedFromFocusToast(id)
  store.removeFromToday(id)
}
</script>

<template>
  <div class="focus-view" :class="{ 'is-empty': !filteredTodos.length }">
    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="(todo, index) in filteredTodos"
        :key="todo.id"
        :data-flip-id="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        :sibling-ids="siblingIds"
        :index="index"
        mode="today"
        @remove-from-today="removeFromFocus"
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
