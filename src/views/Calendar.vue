<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useTodosStore } from '../stores/todos'

const store = useTodosStore()
const calendarRef = ref<any>(null)
const viewRef = ref<HTMLElement | null>(null)

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

// Days already covered by a multi-day achievement line don't also get the
// plain activity dot — the line already tells that story for that day.
const multiDaySessionDates = computed(() => {
  const set = new Set<string>()
  multiDaySessions.value.forEach(s => {
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
  multiDaySessionDates.value.forEach(d => days.delete(d))
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
  // Single-day achievements are shown via the plain activity dot only (see
  // activeDates) — no line for a session that lasted a single day.
  // Multi-day achievements get a thin continuous line. It's built one day
  // at a time (rather than as a single date-range attribute) so it can be
  // clipped at the calendar's outer edges: on Sundays (leftmost column) it
  // never reaches past the number to the left, and on Saturdays (rightmost
  // column) never past the number to the right — otherwise it visually
  // overhangs the calendar.
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
      const extendLeft = i > 0 && dow !== 0
      const extendRight = i < days.length - 1 && dow !== 6
      let style: Record<string, string>
      if (extendLeft && extendRight) style = { ...color, width: '100%' }
      else if (extendRight) style = { ...color, width: '50%', marginLeft: '50%' }
      else if (extendLeft) style = { ...color, width: '50%' }
      else style = { ...color, width: '60%', marginLeft: '20%' }
      attrs.push({
        key: `session-${s.id}-${day.toISOString().slice(0, 10)}`,
        bar: { style },
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
</style>
