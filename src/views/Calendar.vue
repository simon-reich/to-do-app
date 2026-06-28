<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodosStore } from '../stores/todos'

const store = useTodosStore()
const selectedDate = ref<string | null>(null)

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
          border: '2px solid var(--gray)',
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
        backgroundColor: 'var(--gray-dark)',
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
    attrs.push({ key: 'active', dot: { style: { backgroundColor: 'var(--gray)' } }, dates: activeDates.value })
  }
  return attrs
})

function onDayClick(day: { id: string }) {
  selectedDate.value = selectedDate.value === day.id ? null : day.id
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(selectedDate.value + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

// Merge completed + worked into one list (both get ✓✓)
const activityOnDay = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = selectedDate.value
  const touchedIds = new Set<string>()
  store.todos.forEach(t => {
    if (t.completedAt?.slice(0, 10) === dateStr) touchedIds.add(t.id)
    if (t.workLog.some(ts => ts.slice(0, 10) === dateStr)) touchedIds.add(t.id)
  })
  return store.todos.filter(t => touchedIds.has(t.id))
})
</script>

<template>
  <div class="calendar-view">
    <VCalendar
      class="cal"
      :attributes="attributes"
      expanded
      locale="en"
      @dayclick="onDayClick"
    />

    <transition name="fade">
      <div v-if="selectedDate" class="day-detail">
        <p class="day-label">{{ selectedDateLabel }}</p>

        <div v-if="activityOnDay.length" class="day-items">
          <div v-for="todo in activityOnDay" :key="todo.id" class="day-item">
            <span class="icon">✓✓</span>{{ todo.title }}
          </div>
        </div>

        <p v-else class="no-activity">No activity for this day.</p>
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
  color: var(--gray) !important;
  font-size: 14px !important;
}

.cal :deep(.vc-day-content:hover) {
  background: rgba(135, 128, 128, 0.15) !important;
}

.cal :deep(.vc-title) {
  color: var(--gray-dark) !important;
  font-size: 14px !important;
}

.cal :deep(.vc-weekday) {
  color: var(--gray-light) !important;
  font-size: 12px !important;
}

.day-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.day-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-dark);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.day-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--gray);
}

.icon {
  font-size: 11px;
  color: var(--gray-dark);
  flex-shrink: 0;
  letter-spacing: -1px;
}

.no-activity {
  font-size: 13px;
  color: var(--gray-light);
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>
