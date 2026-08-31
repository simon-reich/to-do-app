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

// A small "knall" right at the checkbox itself when a Check gets ticked —
// checking one is otherwise a completely flat, silent state flip, unlike
// completing a Todo (see TodoCard.vue's celebrateBackground). Deliberately
// tiny and anchored to the checkbox, not a full-viewport effect — Checks
// are the app's lower-weight, background-reminder feature, so their own
// celebration should read the same way. Reuses celebrationsEnabled (same
// toggle the big Todo celebration respects) rather than adding a second,
// near-identical setting for what's conceptually the same feature.
function burstCheckbox(el: HTMLElement) {
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.5)', offset: 0.4 },
      { transform: 'scale(1)' },
    ],
    { duration: 260, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  )

  // A handful of tiny sparks radiating out from the checkbox's center — a
  // miniature version of the old bgFireworks particle burst (see the
  // commented-out particle effects up top), scaled way down and anchored
  // to this one checkbox instead of the whole viewport.
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const sparkCount = 6
  for (let i = 0; i < sparkCount; i++) {
    const angle = (360 / sparkCount) * i + (Math.random() - 0.5) * 20
    const dist = 14 + Math.random() * 8
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist
    const spark = document.createElement('span')
    spark.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:4px;height:4px;background:var(--ink);border-radius:50%;pointer-events:none;user-select:none;transform:translate(-50%,-50%);z-index:9999;`
    document.body.appendChild(spark)
    spark.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0 },
      ],
      { duration: 320, easing: 'ease-out' },
    ).onfinish = () => spark.remove()
  }
}

function onToggleCheck(check: CheckItem, event: MouseEvent) {
  const becomingChecked = !checksStore.isCompletedOn(check, todayStr())
  checksStore.toggleCompletion(check.id)
  if (becomingChecked && themeStore.celebrationsEnabled) {
    burstCheckbox(event.currentTarget as HTMLElement)
  }
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
    <div v-if="themeStore.subsEnabled && filteredTodos.length" class="expand-subs-row">
      <span class="expand-subs-label">expand subs</span>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="themeStore.expandFocusSubs"
        :class="{ on: themeStore.expandFocusSubs }"
        @click="themeStore.toggleExpandFocusSubs()"
      >
        <span class="switch-knob" />
      </button>
    </div>

    <div v-if="filteredTodos.length" class="todo-wrap">
      <TodoCard
        v-for="(todo, index) in filteredTodos"
        :key="todo.id"
        :data-flip-id="todo.id"
        :todo="todo"
        :font="fontMap.get(todo.id)"
        :sibling-ids="siblingIds"
        :index="index"
        :force-expand-subs="themeStore.expandFocusSubs"
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
        <span class="add-check-icon"><Plus :size="10" /></span>
        <span class="add-check-label">add check</span>
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
            @click.stop="onToggleCheck(check, $event)"
          >
            <Check v-if="checksStore.isCompletedOn(check, todayStr())" :size="10" />
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

.expand-subs-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
  margin-bottom: 14px;
}

.expand-subs-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  font-family: var(--font-mono, monospace);
  opacity: 0.7;
}

/* Same switch look as Settings.vue's daily-shuffle toggle — duplicated
   here (scoped styles, no shared component) rather than extracted, same
   footprint as the rest of this app's small styling duplications. */
.switch {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 21px;
  padding: 0;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.switch:hover {
  border-color: var(--ink-dark);
}

.switch.on {
  background: var(--ink);
}

.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: max(0px, calc(var(--radius) - 2px));
  background: var(--ink);
  opacity: 0.35;
  transition: transform 0.15s, background 0.15s, opacity 0.15s;
}

.switch.on .switch-knob {
  background: var(--bg);
  opacity: 1;
  transform: translateX(15px);
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
  margin-top: 66px;
}

.add-check-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  margin-left: 5px;
  margin-bottom: 14px;
  color: var(--ink);
  cursor: pointer;
}

.add-check-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border: 1px solid var(--ink);
  border-radius: 50%;
  color: var(--ink);
  /* Same resting/hover opacity as .check-pill's checkboxes — one
     consistent "dim, brightens on hover" treatment across the whole
     Checks UI instead of a separate color-based one just for this icon. */
  opacity: 0.55;
  transition: opacity 0.1s;
}

/* Rolled up to nothing by default — only the circled plus sits there
   permanently, same "doesn't compete for attention" idea as the rest of
   the Checks UI. The label unrolls left-to-right on hover instead of
   being visible the whole time, but stays dim — the icon's own opacity
   brightening (see below) is the only hover accent. */
.add-check-label {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.4px;
  font-family: var(--font-mono, monospace);
  transition: max-width 0.22s ease, opacity 0.18s ease;
}

@media (hover: hover) {
  .add-check-btn:hover .add-check-icon {
    opacity: 0.9;
  }

  .add-check-btn:hover .add-check-label {
    max-width: 90px;
    opacity: 0.5;
  }
}

.check-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* Lines Checks' left edge up with where a todo card's own drop shadow
     starts (box-shadow: 5px 5px 0 ..., see TodoCard.vue) rather than the
     card's own flush-left edge. */
  margin-left: 5px;
}

.check-pill {
  display: flex;
  /* flex-start, not center: a title long enough to wrap onto a second
     line (see .check-label) would otherwise float the checkbox in the
     vertical middle of both lines instead of level with the first one. */
  align-items: flex-start;
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
  width: 16px;
  height: 16px;
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
  /* No truncation — Checks stack one per line now (no fixed column width
     to fit), so the full CHECK_TITLE_MAX_LENGTH (60 chars) just gets to
     wrap onto a second line instead of being cut off. word-break matches
     TodoCard's own title rule — without it, a title long/dense enough to
     not hit a natural space before running out of row width (easy to hit
     on a narrow phone screen at the full character limit) just overflows
     straight past the screen edge instead of wrapping. */
  min-width: 0;
  word-break: break-word;
  color: var(--ink);
  font-size: 16px;
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
