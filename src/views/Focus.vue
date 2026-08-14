<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Check } from '@lucide/vue'
import { useTodosStore, PRIORITY_TAG_ID } from '../stores/todos'
import { useChecksStore, type Check as CheckItem } from '../stores/checks'
import { useThemeStore } from '../stores/theme'
import TodoCard from '../components/TodoCard.vue'
import CheckModal from '../components/CheckModal.vue'
import { assignFonts } from '../composables/useTodoFonts'
import { useListFlip } from '../composables/useListFlip'
import { spawnRemovedFromFocusToast } from '../composables/useToast'

const store = useTodosStore()
const checksStore = useChecksStore()
const themeStore = useThemeStore()

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

// ── Checks ──
// Below the todo list, no divider — see CLAUDE.md's Checks section for the
// full design rationale (background reminders, lower weight than a Todo).
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

const checkModalState = ref<'add' | CheckItem | null>(null)

function openAddCheck() {
  checkModalState.value = 'add'
}

function openEditCheck(check: CheckItem) {
  checkModalState.value = check
}

function closeCheckModal() {
  checkModalState.value = null
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
        @delete="store.deleteTodo($event)"
      />
    </div>
    <p v-else class="empty">Nothing in focus right now.</p>

    <div v-if="themeStore.checksEnabled" class="checks-section">
      <button type="button" class="add-check-btn" @click="openAddCheck">
        <Plus :size="12" /> add check
      </button>
      <div v-if="checksStore.todayChecks.length" class="check-row">
        <button
          v-for="check in checksStore.todayChecks"
          :key="check.id"
          type="button"
          class="check-pill"
          :class="{ done: checksStore.isCompletedOn(check, todayStr()) }"
          @click="openEditCheck(check)"
        >
          <span
            class="check-box"
            :class="{ checked: checksStore.isCompletedOn(check, todayStr()) }"
            @click.stop="checksStore.toggleCompletion(check.id)"
          >
            <Check v-if="checksStore.isCompletedOn(check, todayStr())" :size="8" />
          </span>
          <span class="check-label">{{ check.title }}</span>
        </button>
      </div>
    </div>
  </div>

  <CheckModal
    v-if="checkModalState === 'add'"
    @close="closeCheckModal"
  />
  <CheckModal
    v-else-if="checkModalState"
    :editing="checkModalState"
    @close="closeCheckModal"
  />
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

/* Generous space instead of a visual divider — Checks read as lower-
   weight background items, not a second list that needs separating from
   the todos above it. */
.checks-section {
  margin-top: 88px;
}

.add-check-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 14px;
  color: var(--ink);
  opacity: 0.5;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  transition: opacity 0.1s;
}

@media (hover: hover) {
  .add-check-btn:hover {
    opacity: 1;
  }
}

.check-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.check-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  opacity: 0.55;
  transition: opacity 0.1s;
}

@media (hover: hover) {
  .check-pill:hover {
    opacity: 0.9;
  }
}

.check-pill.done {
  opacity: 0.3;
}

.check-box {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 2px solid var(--ink);
  /* var(--radius) is 6px in rounded mode — on a box this small that's
     effectively half its size, i.e. a circle, not a rounded corner. Capped
     at 3px so it still follows the rounded/square setting (0px stays 0px)
     without going further than a corner. */
  border-radius: min(var(--radius), 3px);
  box-shadow: 2px 2px 0 var(--priority-shadow);
  color: var(--bg);
  cursor: pointer;
}

.check-box.checked {
  background: var(--ink);
}

.check-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-mono, monospace);
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
