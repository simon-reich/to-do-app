<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { motion } from 'motion-v'
import { useTodosStore, PRIORITY_TAG_ID, type Todo } from '../stores/todos'
import { useChecksStore } from '../stores/checks'
import { useThemeStore } from '../stores/theme'
import { useScrollTracking } from '../composables/useScrollTracking'
import ScrollDivider from '../components/ScrollDivider.vue'

const store = useTodosStore()
const checksStore = useChecksStore()
const themeStore = useThemeStore()
const calendarRef = ref<any>(null)
const viewRef = ref<HTMLElement | null>(null)
const dayDetailScrollRef = ref<HTMLElement | null>(null)
const dayDetailRef = ref<HTMLElement | null>(null)
const dayDetailBottomSpacerRef = ref<HTMLElement | null>(null)
const {
  scrolled: dayDetailScrolled,
  scrolledToBottom: dayDetailScrolledToBottom,
  spacerHeight: dayDetailSpacerHeight,
  check: checkDayDetailScrollState,
} = useScrollTracking({ scrollEl: dayDetailScrollRef, resizeTarget: dayDetailRef, spacerEl: dayDetailBottomSpacerRef, targetGap: 40 })

function onDayDetailScroll() {
  checkDayDetailScrollState()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const selectedDate = ref<string>(todayStr())

onMounted(async () => {
  await nextTick()
  calendarRef.value?.move(new Date())
  viewRef.value?.focus()
})

onBeforeRouteLeave(() => {
  selectedDate.value = todayStr()
})

function shiftDate(days: number) {
  const d = new Date(selectedDate.value + 'T12:00:00')
  d.setDate(d.getDate() + days)
  selectedDate.value = d.toISOString().slice(0, 10)
  calendarRef.value?.move(d)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft')  { e.preventDefault(); shiftDate(-1) }
  if (e.key === 'ArrowRight') { e.preventDefault(); shiftDate(1) }
  if (e.key === 'ArrowUp')    { e.preventDefault(); shiftDate(-7) }
  if (e.key === 'ArrowDown')  { e.preventDefault(); shiftDate(7) }
}

const activeDates = computed(() => {
  const days = new Set<string>()
  store.todos.forEach(t => {
    if (t.completedAt) days.add(t.completedAt.slice(0, 10))
    t.workLog.forEach(ts => days.add(ts.slice(0, 10)))
  })
  return [...days].map(d => new Date(d + 'T12:00:00'))
})

// Its own dot (see attributes below), kept visually distinct from Todo
// activity — a day can carry both at once, and they track different
// things (a Check ticked vs. a Todo done/worked on).
const checksActiveDates = computed(() => {
  if (!themeStore.checksEnabled) return []
  const days = new Set<string>()
  checksStore.checks.forEach(c => c.completedDates.forEach(d => days.add(d)))
  return [...days].map(d => new Date(d + 'T12:00:00'))
})

const attributes = computed(() => {
  const attrs: object[] = []
  if (selectedDate.value) {
    attrs.push({
      key: 'selected',
      highlight: {
        style: {
          backgroundColor: 'transparent',
          border: '2px solid var(--ink)',
          borderRadius: '4px',
          width: '28px',
          height: '20px',
        },
      },
      dates: new Date(selectedDate.value + 'T12:00:00'),
    })
  }
  attrs.push({
    key: 'today',
    highlight: {
      style: {
        backgroundColor: 'var(--ink-dark)',
        borderRadius: '4px',
        width: '28px',
        height: '20px',
      },
      contentStyle: {
        color: 'var(--bg) !important',
        fontSize: '12px',
      },
    },
    dates: new Date(),
  })
  if (activeDates.value.length) {
    attrs.push({ key: 'active', dot: { style: { backgroundColor: 'var(--ink)' } }, dates: activeDates.value })
  }
  if (checksActiveDates.value.length) {
    attrs.push({ key: 'checksActive', dot: { style: { backgroundColor: 'var(--ink)', opacity: 0.4 } }, dates: checksActiveDates.value })
  }
  return attrs
})

function onDayClick(day: { id: string }) {
  selectedDate.value = day.id
}

watch(selectedDate, async () => {
  if (dayDetailScrollRef.value) dayDetailScrollRef.value.scrollTop = 0
  await nextTick()
  checkDayDetailScrollState()
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(selectedDate.value + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

const doneOnDay = computed(() => selectedDate.value ? store.completedOn(selectedDate.value) : [])
const workedOnDay = computed(() => selectedDate.value ? store.workedOn(selectedDate.value) : [])
// Own section at the end of the day's list (see the template) rather than
// mixed into doneOnDay/workedOnDay — Checks aren't Todos, ticking one is a
// different kind of event than completing/working a Todo.
const checksOnDay = computed(() => selectedDate.value && themeStore.checksEnabled ? checksStore.completedOn(selectedDate.value) : [])

const hasActivity = computed(() => doneOnDay.value.length > 0 || workedOnDay.value.length > 0 || checksOnDay.value.length > 0)

// Each entry keeps its own done/worked "kind" (for the ✓✓ vs ✓ icon) even
// though the day's list is no longer *grouped* by that — see dayEntries
// below. What was actually finished vs. just touched today is still worth
// showing per item, it's just not the more interesting question for a
// retrospective glance at the day.
interface DayEntry { todo: Todo; kind: 'done' | 'worked' }

// Priority vs. everything else, not done vs. worked-on — priority is
// already the app's one first-class "this mattered" signal everywhere
// else (card fill, its own filter/sort rank in Focus), so grouping by it
// here answers "did I get to the important stuff" instead of the more
// bookkeeping-flavored "did I finish it or just poke at it".
const dayEntries = computed<DayEntry[]>(() => [
  ...doneOnDay.value.map(todo => ({ todo, kind: 'done' as const })),
  ...workedOnDay.value.map(todo => ({ todo, kind: 'worked' as const })),
])
const priorityEntries = computed(() => dayEntries.value.filter(e => e.todo.tags.includes(PRIORITY_TAG_ID)))
const otherEntries = computed(() => dayEntries.value.filter(e => !e.todo.tags.includes(PRIORITY_TAG_ID)))
</script>

<template>
  <div ref="viewRef" class="calendar-view" tabindex="0" @keydown="onKeydown">
    <motion.div
      class="calendar-inner"
      :initial="{ opacity: 0, scale: 0.96 }"
      :animate="{ opacity: 1, scale: 1 }"
      :transition="{ type: 'spring', stiffness: 380, damping: 26, mass: 0.8 }"
    >
      <VCalendar
        ref="calendarRef"
        class="cal"
        :attributes="attributes"
        expanded
        locale="en"
        @dayclick="onDayClick"
      />
    </motion.div>

    <ScrollDivider class="day-scroll-divider" :visible="dayDetailScrolled" />

    <div ref="dayDetailScrollRef" class="day-detail-scroll" @scroll="onDayDetailScroll">
      <div ref="dayDetailRef" class="day-detail calendar-inner">
        <transition
          name="unfold"
          mode="out-in"
          appear
          appear-active-class="unfold-appear-active"
          appear-from-class="unfold-appear-from"
        >
          <div :key="selectedDate" class="day-detail-content">
            <p class="day-label">{{ selectedDateLabel }}</p>

            <div v-if="hasActivity" class="day-items">
              <div v-for="entry in priorityEntries" :key="entry.todo.id" class="day-item">
                <span :class="['icon', entry.kind === 'done' ? 'icon--done' : 'icon--worked']">{{ entry.kind === 'done' ? '✓✓' : '✓' }}</span>{{ entry.todo.title }}
              </div>
              <div v-if="priorityEntries.length && otherEntries.length" class="day-divider" />
              <div v-for="entry in otherEntries" :key="entry.todo.id" class="day-item">
                <span :class="['icon', entry.kind === 'done' ? 'icon--done' : 'icon--worked']">{{ entry.kind === 'done' ? '✓✓' : '✓' }}</span>{{ entry.todo.title }}
              </div>
              <div v-if="(priorityEntries.length || otherEntries.length) && checksOnDay.length" class="day-divider" />
              <div v-for="check in checksOnDay" :key="check.id" class="day-item day-item--check">
                <span class="icon icon--check">☑</span>{{ check.title }}
              </div>
            </div>

            <p v-else class="no-activity">No activity for this day.</p>
          </div>
        </transition>

        <div ref="dayDetailBottomSpacerRef" class="bottom-breathing-spacer" :style="{ height: dayDetailSpacerHeight + 'px' }" />
      </div>
    </div>

    <ScrollDivider class="day-scroll-divider-bottom" :visible="!dayDetailScrolledToBottom" />
  </div>
</template>

<style scoped>
.calendar-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  outline: none;
}

/* Caps the calendar grid and the day's entries at the same reading width,
   while the divider lines (siblings, outside this wrapper) span the full
   .calendar-view width like every other divider in the app. */
.calendar-inner {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.cal {
  width: 100%;
}

.cal :deep(.vc-container) {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--radius);
}

.cal :deep(.vc-header),
.cal :deep(.vc-weeks),
.cal :deep(.vc-week),
.cal :deep(.vc-day) {
  background: var(--bg) !important;
  border: none !important;
}

.cal :deep(.vc-day-content) {
  color: var(--ink) !important;
  font-size: 20px !important;
}

.cal :deep(.vc-day-content:hover) {
  background: rgba(135, 128, 128, 0.15) !important;
}

.cal :deep(.vc-title) {
  color: var(--ink-dark) !important;
  font-size: 26px !important;
  font-weight: 700 !important;
}

.cal :deep(.vc-weekday) {
  color: var(--ink) !important;
  font-size: 18px !important;
}

.cal :deep(.vc-arrow) {
  width: 36px !important;
  height: 36px !important;
}

.cal :deep(.vc-arrow svg) {
  width: 22px !important;
  height: 22px !important;
}

.cal :deep(.vc-day-content) {
  width: 36px !important;
  height: 36px !important;
  font-size: 20px !important;
}

/* Narrower than the calendar grid above it (which keeps its own 640px cap
   via .calendar-inner) — the day's entries read better in a tighter,
   centered column instead of stretching out to match the grid's width. */
.day-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.day-detail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
}

.day-label {
  font-size: 24px;
  font-weight: 600;
  color: var(--ink-dark);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-family: var(--font-playful, sans-serif);
}

.day-items {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  width: 100%;
  gap: 6px;
}

.day-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: var(--ink);
  font-family: var(--font-playful, sans-serif);
}

.icon {
  font-size: 13px;
  line-height: 27px;
  margin-top: 4px;
  flex-shrink: 0;
  letter-spacing: -1px;
  width: 1.4em;
  text-align: right;
}

.icon--done {
  color: var(--ink);
}

.icon--worked {
  color: var(--ink);
}

/* Checks read as lower-weight than Todos everywhere else in the app (see
   Focus's own check-row) — same treatment here via opacity rather than a
   separate color, which the app's four-value color rule doesn't allow. */
.day-item--check {
  opacity: 0.65;
}

.icon--check {
  color: var(--ink);
}

.day-divider {
  height: 1px;
  border-top: 2px dashed var(--ink);
  opacity: 1;
  margin: 2px 0;
}

.no-activity {
  font-size: 18px;
  font-weight: bold;
  color: var(--ink);
  font-family: var(--font-playful, sans-serif);
}

.unfold-enter-active,
.unfold-leave-active { transition: opacity 0.09s; }
.unfold-enter-from,
.unfold-leave-to { opacity: 0; }

/* Only for the very first mount (switching into the Calendar view) — timed
   to match the calendar grid's own entrance spring (see .calendar-inner)
   so both arrive together, instead of the day's entry (day-switch fade
   above) finishing far ahead of the grid. */
.unfold-appear-active { transition: opacity 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
.unfold-appear-from { opacity: 0; transform: translateY(8px); }

/* Pin the calendar in place, scroll the day's entries underneath it
   instead of scrolling the whole page — the calendar grid otherwise
   travels out of view along with everything else. Applies on any viewport
   width; only the bottom divider's clearance differs on mobile (fixed
   bottom nav) vs. desktop (none). */
.calendar-view {
  height: 100%;
  gap: 0;
}

.cal {
  flex-shrink: 0;
}

/* Divider lines only make visual sense on mobile — desktop hides both. */
.day-scroll-divider,
.day-scroll-divider-bottom {
  display: none;
}

.day-detail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 20px 0 0;
  scrollbar-width: none;
}

.day-detail-scroll::-webkit-scrollbar {
  display: none;
}

@media (max-width: 700px) {
  .day-scroll-divider {
    display: block;
    flex-shrink: 0;
  }

  .day-scroll-divider-bottom {
    display: block;
    position: fixed;
    bottom: 60px;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  /* Even narrower on phones than the general 420px cap above. */
  .day-detail {
    max-width: 320px;
  }
}
</style>
