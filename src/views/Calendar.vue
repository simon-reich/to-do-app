<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useTodosStore } from '../stores/todos'
import { useOverflowSpacer } from '../composables/useOverflowSpacer'

const store = useTodosStore()
const calendarRef = ref<any>(null)
const viewRef = ref<HTMLElement | null>(null)
const dayDetailScrollRef = ref<HTMLElement | null>(null)
const dayDetailRef = ref<HTMLElement | null>(null)
const dayDetailBottomSpacerRef = ref<HTMLElement | null>(null)
const dayDetailScrolled = ref(false)
const dayDetailScrolledToBottom = ref(true)
const { overflows: dayDetailOverflows, check: checkDayDetailOverflow } = useOverflowSpacer()
let dayDetailResizeObserver: ResizeObserver | null = null

function checkDayDetailScrollState() {
  const el = dayDetailScrollRef.value
  if (!el) return
  dayDetailScrolled.value = el.scrollTop > 0
  dayDetailScrolledToBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  checkDayDetailOverflow(el, el, dayDetailBottomSpacerRef.value)
}

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
  checkDayDetailScrollState()

  if (dayDetailRef.value) {
    dayDetailResizeObserver = new ResizeObserver(checkDayDetailScrollState)
    dayDetailResizeObserver.observe(dayDetailRef.value)
  }
})

onUnmounted(() => {
  dayDetailResizeObserver?.disconnect()
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

const doneOnDay = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = selectedDate.value
  return store.todos.filter(t => t.completedAt?.slice(0, 10) === dateStr)
})

const workedOnDay = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = selectedDate.value
  const doneIds = new Set(doneOnDay.value.map(t => t.id))
  return store.todos.filter(t =>
    !doneIds.has(t.id) && t.workLog.some(ts => ts.slice(0, 10) === dateStr)
  )
})

const hasActivity = computed(() => doneOnDay.value.length > 0 || workedOnDay.value.length > 0)
</script>

<template>
  <div ref="viewRef" class="calendar-view" tabindex="0" @keydown="onKeydown">
    <div class="calendar-inner">
      <VCalendar
        ref="calendarRef"
        class="cal"
        :attributes="attributes"
        expanded
        locale="en"
        @dayclick="onDayClick"
      />
    </div>

    <div class="day-scroll-divider" :class="{ visible: dayDetailScrolled }" />

    <div ref="dayDetailScrollRef" class="day-detail-scroll" @scroll="onDayDetailScroll">
    <transition name="fade">
      <div ref="dayDetailRef" class="day-detail calendar-inner">
        <p class="day-label">{{ selectedDateLabel }}</p>

        <div v-if="hasActivity" class="day-items">
          <div v-for="todo in doneOnDay" :key="todo.id" class="day-item">
            <span class="icon icon--done">✓✓</span>{{ todo.title }}
          </div>
          <div v-if="doneOnDay.length && workedOnDay.length" class="day-divider" />
          <div v-for="todo in workedOnDay" :key="todo.id" class="day-item">
            <span class="icon icon--worked">✓</span>{{ todo.title }}
          </div>
        </div>

        <p v-else class="no-activity">No activity for this day.</p>

        <div ref="dayDetailBottomSpacerRef" class="bottom-breathing-spacer" :style="{ height: dayDetailOverflows ? '40px' : '0px' }" />
      </div>
    </transition>
    </div>

    <div class="day-scroll-divider-bottom" :class="{ visible: !dayDetailScrolledToBottom }" />
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

.day-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
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

.fade-enter-active,
.fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(4px); }

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

@media (max-width: 900px) {
  .day-scroll-divider {
    display: block;
    height: 2px;
    background: transparent;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .day-scroll-divider.visible {
    background: var(--ink);
  }

  .day-scroll-divider-bottom {
    display: block;
    position: fixed;
    bottom: 60px;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    transition: background 0.2s;
    pointer-events: none;
  }

  .day-scroll-divider-bottom.visible {
    background: var(--ink);
  }
}
</style>
