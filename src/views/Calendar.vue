<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useTodosStore } from '../stores/todos'

const store = useTodosStore()
const calendarRef = ref<any>(null)
const viewRef = ref<HTMLElement | null>(null)
const dayDetailScrollRef = ref<HTMLElement | null>(null)
const dayDetailScrolled = ref(false)

function onDayDetailScroll() {
  dayDetailScrolled.value = (dayDetailScrollRef.value?.scrollTop ?? 0) > 0
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

const multiDaySessions = computed(() => store.sessions.filter(s => s.startDate !== s.endDate))
const singleDaySessions = computed(() => store.sessions.filter(s => s.startDate === s.endDate))

// Days already covered by an achievement mark (X or strike-through) don't
// also get the plain activity dot — the mark already tells that story.
const sessionDates = computed(() => {
  const set = new Set<string>()
  store.sessions.forEach(s => {
    const d = new Date(s.startDate + 'T12:00:00')
    const end = new Date(s.endDate + 'T12:00:00')
    while (d <= end) {
      set.add(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
  })
  return set
})

const activeDates = computed(() => {
  const days = new Set<string>()
  store.todos.forEach(t => {
    if (t.completedAt) days.add(t.completedAt.slice(0, 10))
    t.workLog.forEach(ts => days.add(ts.slice(0, 10)))
  })
  sessionDates.value.forEach(d => days.delete(d))
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
  // Single-day achievements: cross the day out with a handwritten-style X.
  singleDaySessions.value.forEach(s => {
    attrs.push({
      key: `session-x-${s.id}`,
      content: { class: 'vc-x-mark' },
      dates: new Date(s.startDate + 'T12:00:00'),
    })
  })
  // Multi-day achievements: one continuous line struck through the numbers,
  // like crossing off entries on a paper calendar. Built one day at a time
  // (rather than as a single date-range attribute) so each day can be
  // styled individually:
  // - The session's first/last day starts/ends a little before/after that
  //   day's number (NUMBER_PAD) so the line runs through the whole digit
  //   instead of splitting exactly at its center.
  // - A Sunday or Saturday in the middle of a session would otherwise touch
  //   the calendar's outer edge (they're the leftmost/rightmost columns), so
  //   it overshoots the number further (EDGE_OVERSHOOT) instead of stopping
  //   flush at it — short of the edge, not flush against it.
  const NUMBER_PAD = 8
  const EDGE_OVERSHOOT = 25
  // Adjacent days' segments are sized independently as percentages of their
  // own cell, so sub-pixel rounding can leave a hairline (1-2px) gap where
  // they should touch. Bleeding each segment a couple pixels past its
  // logical edges on both sides guarantees an overlap instead of a gap.
  const BLEED = 2
  function segmentStyle(widthPct: number, marginPct: number) {
    return {
      width: `calc(${widthPct}% + ${BLEED}px)`,
      marginLeft: `calc(${marginPct}% - ${BLEED / 2}px)`,
    }
  }
  multiDaySessions.value.forEach(s => {
    const color = { backgroundColor: 'var(--ink-dark)' }
    const days: Date[] = []
    const cursor = new Date(s.startDate + 'T12:00:00')
    const end = new Date(s.endDate + 'T12:00:00')
    while (cursor <= end) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    days.forEach((day, i) => {
      const dow = day.getDay() // 0 = Sunday, 6 = Saturday
      const isFirst = i === 0
      const isLast = i === days.length - 1
      let bounds: { width: string; marginLeft: string }
      if (isFirst) bounds = segmentStyle(50 + NUMBER_PAD, 50 - NUMBER_PAD)
      else if (isLast) bounds = segmentStyle(50 + NUMBER_PAD, 0)
      else if (dow === 0) bounds = segmentStyle(50 + EDGE_OVERSHOOT, 50 - EDGE_OVERSHOOT)
      else if (dow === 6) bounds = segmentStyle(50 + EDGE_OVERSHOOT, 0)
      else bounds = segmentStyle(100, 0)
      attrs.push({
        key: `session-strike-${s.id}-${day.toISOString().slice(0, 10)}`,
        highlight: { class: 'vc-session-strike', style: { ...color, ...bounds, height: '1.5px' } },
        dates: new Date(day),
      })
    })
  })
  return attrs
})

const activeSession = computed(() => {
  if (!selectedDate.value) return null
  return store.sessions.find(s => selectedDate.value! >= s.startDate && selectedDate.value! <= s.endDate) ?? null
})

const sessionRangeLabel = computed(() => {
  const s = activeSession.value
  if (!s) return ''
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return s.startDate === s.endDate ? fmt(s.startDate) : `${fmt(s.startDate)} – ${fmt(s.endDate)}`
})

function onDayClick(day: { id: string }) {
  selectedDate.value = day.id
}

watch(selectedDate, () => {
  if (dayDetailScrollRef.value) dayDetailScrollRef.value.scrollTop = 0
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
    <VCalendar
      ref="calendarRef"
      class="cal"
      :attributes="attributes"
      expanded
      locale="en"
      @dayclick="onDayClick"
    />

    <div class="day-scroll-divider" :class="{ visible: dayDetailScrolled }" />

    <div ref="dayDetailScrollRef" class="day-detail-scroll" @scroll="onDayDetailScroll">
    <transition name="fade">
      <div class="day-detail">
        <template v-if="activeSession">
          <p class="day-label">{{ sessionRangeLabel }}</p>
          <div class="day-items">
            <div v-for="todo in activeSession.completed" :key="todo.id" class="day-item">
              <span class="icon icon--done">✓✓</span>{{ todo.title }}
            </div>
          </div>
        </template>

        <template v-else>
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
        </template>
      </div>
    </transition>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  outline: none;
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

.day-scroll-divider {
  display: none;
}

/* Mobile: pin the calendar in place, scroll the day's entries underneath
   it instead of scrolling the whole page — the calendar grid otherwise
   travels out of view along with everything else. */
@media (max-width: 900px) {
  .calendar-view {
    height: 100%;
    gap: 0;
  }

  .cal {
    flex-shrink: 0;
  }

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

  .day-detail-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-top: 20px;
  }
}
</style>
