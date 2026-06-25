<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCheck, Clock } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'

const store = useTodosStore()
const selectedDate = ref<string | null>(null)

// Collect dates with completed todos (green dot)
const completedDates = computed(() =>
  store.todos
    .filter(t => !!t.completedAt)
    .map(t => new Date(t.completedAt!))
)

// Collect dates with worked-on todos (blue dot)
const workedDates = computed(() =>
  store.todos.flatMap(t => t.workLog.map(ts => new Date(ts)))
)

const attributes = computed(() => {
  const attrs: object[] = []
  if (completedDates.value.length) {
    attrs.push({ key: 'completed', dot: 'green', dates: completedDates.value })
  }
  if (workedDates.value.length) {
    attrs.push({ key: 'worked', dot: 'blue', dates: workedDates.value })
  }
  return attrs
})

function onDayClick(day: { id: string }) {
  selectedDate.value = selectedDate.value === day.id ? null : day.id
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  // parse as local noon to avoid timezone-shift issues
  return new Date(selectedDate.value + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const completedOnDay = computed(() =>
  selectedDate.value
    ? store.todos.filter(t => t.completedAt?.slice(0, 10) === selectedDate.value)
    : []
)

const workedOnDay = computed(() =>
  selectedDate.value
    ? store.todos.filter(t =>
        t.workLog.some(ts => ts.slice(0, 10) === selectedDate.value)
      )
    : []
)

const hasActivity = computed(
  () => completedOnDay.value.length > 0 || workedOnDay.value.length > 0
)
</script>

<template>
  <div class="view calendar-view">
    <h1>Kalender</h1>

    <VCalendar
      class="cal"
      :attributes="attributes"
      expanded
      locale="de"
      @dayclick="onDayClick"
    />

    <transition name="fade">
      <div v-if="selectedDate" class="day-detail">
        <h2 class="day-label">{{ selectedDateLabel }}</h2>

        <div v-if="hasActivity">
          <div v-if="completedOnDay.length" class="activity-section">
            <div class="activity-header activity-header--completed">
              <CheckCheck :size="15" />
              Abgeschlossen
            </div>
            <ul class="activity-list">
              <li v-for="todo in completedOnDay" :key="todo.id">{{ todo.title }}</li>
            </ul>
          </div>

          <div v-if="workedOnDay.length" class="activity-section">
            <div class="activity-header activity-header--worked">
              <Clock :size="15" />
              Bearbeitet
            </div>
            <ul class="activity-list">
              <li v-for="todo in workedOnDay" :key="todo.id">{{ todo.title }}</li>
            </ul>
          </div>
        </div>

        <p v-else class="no-activity">Kein Eintrag für diesen Tag.</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.calendar-view {
  --vc-accent-600: var(--accent);
}

.cal {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.day-detail {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.day-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.activity-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.activity-header--completed {
  color: #16a34a;
}

.activity-header--worked {
  color: #2563eb;
}

.activity-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
}

.activity-list li {
  font-size: 14px;
  color: var(--text);
  line-height: 1.4;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

.activity-list li:last-child {
  border-bottom: none;
}

.no-activity {
  font-size: 13px;
  color: var(--text-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
