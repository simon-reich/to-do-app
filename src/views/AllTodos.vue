<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useTodosStore, LOOP_TAG_ID } from '../stores/todos'
import TodoCard from '../components/TodoCard.vue'
import { assignFonts } from '../composables/useTodoFonts'
import { useListFlip } from '../composables/useListFlip'
import { spawnSentToFocusToast } from '../composables/useToast'

const store = useTodosStore()
// Already unions loop in when loopFilterMode is "only" — see App.vue,
// which also drives the All/Prio/tag-chip active/dimmed state off this
// exact same computed, so what's highlighted always matches what's
// actually shown.
const effectiveFilterTagIds = inject<Ref<string[]>>('effectiveFilterTagIds')!
const loopFilterMode = inject<Ref<'default' | 'only' | 'hide'>>('loopFilterMode')!
const sortKey = inject<Ref<'createdAt' | 'title'>>('sortKey')!
const listView = inject<Ref<boolean>>('listView')!

// Bumped whenever the grid/list toggle or the sort order changes, folded
// into each card's :key below so the whole set remounts and replays its
// entrance animation — otherwise Vue just reorders/restyles the existing
// instances without ever re-triggering it.
const renderGen = ref(0)
watch([listView, sortKey], () => { renderGen.value++ })

// A–Z sort should order by actual letters/numbers only — punctuation
// (quotes, dashes, ...) at the start of a title was outranking every
// letter and digit under plain localeCompare, since symbols collate
// before alphanumerics. Stripping everything but letters/digits first
// means a title's sort position is driven by its first real character;
// `numeric: true` then sorts number runs by value (2 before 10) instead
// of lexically (10 before 2).
function alphaSortKey(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, '')
}

const filteredTodos = computed(() => {
  let result = store.activeTodos.filter(t => !t.inToday)
  if (effectiveFilterTagIds.value.length > 0) {
    result = result.filter(t => t.tags.some(tid => effectiveFilterTagIds.value.includes(tid)))
  }
  // Hide is a standing exclusion on top of whatever the union above
  // already selected — not an additional AND alongside "only" (which no
  // longer exists as a separate branch; it's folded into the union).
  if (loopFilterMode.value === 'hide') {
    result = result.filter(t => !t.tags.includes(LOOP_TAG_ID))
  }
  return [...result].sort((a, b) =>
    sortKey.value === 'title'
      ? alphaSortKey(a.title).localeCompare(alphaSortKey(b.title), 'de', { numeric: true })
      : b.createdAt.localeCompare(a.createdAt)
  )
})

const fontMap = computed(() => assignFonts(filteredTodos.value.map(t => t.id)))
const siblingIds = computed(() => filteredTodos.value.map(t => t.id))

useListFlip(() => siblingIds.value, '.todo-wrap')

// A card leaving Overview for Focus (Enter a second time on an already-
// open card, or a swipe) otherwise just vanishes from this list with no
// explanation — reads like the card closed rather than moved. The toast
// rises from the card's own position, so it's clear where it went
// instead. Not shown for a direct "+" button click (`obvious`) — that one
// already makes the move plain on its own.
function sendToFocus(id: string, obvious?: boolean) {
  if (!obvious) spawnSentToFocusToast(id)
  store.sendToToday(id)
}
</script>

<template>
  <div class="all-todos" :class="{ 'list-view': listView }">
    <div v-if="filteredTodos.length" class="todo-wrap" :class="{ 'list-view': listView }">
      <TodoCard
        v-for="(todo, index) in filteredTodos"
        :key="`${todo.id}-${renderGen}`"
        :data-flip-id="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        :sibling-ids="siblingIds"
        :index="index"
        :grid-mode="true"
        mode="all"
        @send-to-today="sendToFocus"
        @remove-from-today="store.removeFromToday($event)"
        @delete="store.deleteTodo($event)"
      />
    </div>
    <p v-else class="empty">
      {{ store.activeTodos.filter(t => !t.inToday).length === 0 && effectiveFilterTagIds.length === 0 ? 'No todos yet.' : 'No todos for this filter.' }}
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
