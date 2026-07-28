<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { activeModal } from '../composables/useModalGuard'
import type { LoopInterval, LoopUnit } from '../stores/todos'

const props = defineProps<{
  modelValue?: LoopInterval
  /** Set when the todo is also tagged priority: that card fills solid
   *  ink, which would swallow this picker's own ink-colored border/text
   *  entirely — swap to bg-colored controls so they stay legible. */
  inverted?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LoopInterval]
  /** Fired when the custom day count or date field gains real focus —
   *  both need it to actually work, which blurs whatever else was
   *  focused before (e.g. App.vue's add-todo input). Lets a host that
   *  auto-closes/resets on that blur (see App.vue's onTodoBlur) know
   *  this wasn't the user leaving. */
  'focus-inside': []
}>()

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const presetRow1: { label: string; unit: LoopUnit; count: number }[] = [
  { label: 'daily', unit: 'day', count: 1 },
  { label: 'weekly', unit: 'week', count: 1 },
]
const presetRow2: { label: string; unit: LoopUnit; count: number }[] = [
  { label: 'monthly', unit: 'month', count: 1 },
  { label: 'yearly', unit: 'year', count: 1 },
]
const presets = [...presetRow1, ...presetRow2]

function sameUnitCount(a: LoopInterval | undefined, unit: LoopUnit, count: number): boolean {
  return !!a && a.unit === unit && a.count === count
}

// Anything that isn't an exact preset match (including nothing set yet)
// counts as "Custom" — covers both a genuinely custom every-X-days value
// and the not-yet-decided state right after the loop tag is first checked.
const isCustom = computed(() => !presets.some(p => sameUnitCount(props.modelValue, p.unit, p.count)))

const MAX_CUSTOM_DAYS = 999

const customCount = ref(props.modelValue?.unit === 'day' && isCustom.value ? props.modelValue.count : 2)

watch(() => props.modelValue, (v) => {
  if (v?.unit === 'day' && isCustom.value) customCount.value = v.count
})

// The date to count the recurrence from — kept as-is across preset/count
// changes, only the "from" picker below touches it directly.
const startDate = computed(() => props.modelValue?.startDate ?? todayStr())

// Display-only DD/MM/YYYY — startDate itself stays ISO (YYYY-MM-DD) since
// that's what sorts/compares correctly and matches the rest of the data
// model (completedAt, workLog).
const startDateDisplay = computed(() => {
  const [y, m, d] = startDate.value.split('-')
  return `${d}/${m}/${y}`
})

function select(unit: LoopUnit, count: number) {
  emit('update:modelValue', { unit, count, startDate: startDate.value })
}

function applyCustomCount() {
  const count = Math.min(MAX_CUSTOM_DAYS, Math.max(1, Math.round(customCount.value) || 1))
  customCount.value = count
  emit('update:modelValue', { unit: 'day', count, startDate: startDate.value })
}

// maxlength doesn't actually clamp type="number" inputs in most browsers
// — Math.min in applyCustomCount only kicks in on change/blur, so typing
// a 4th+ digit still showed while focused. Truncate live instead.
function onCustomCountInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.value.length > 3) {
    input.value = input.value.slice(0, 3)
    customCount.value = Number(input.value)
  }
}

function updateStartDate(date: string) {
  const base = props.modelValue ?? { unit: 'day' as const, count: 1, startDate: date }
  emit('update:modelValue', { unit: base.unit, count: base.count, startDate: date })
}

// The "from" date picker opens as a centered modal (same pattern as the
// delete-confirmation modal) rather than a popover anchored to the
// trigger — v-calendar's own popover isn't teleported anywhere, and
// nested inside a todo card's own overflow:hidden + transformed
// stacking context (see .todo-card.loop's z-index tricks elsewhere) it
// ended up clipped/misstacked. A centered modal sidesteps that entirely
// and reads better on mobile too, where an anchored popover would have
// had little room to work with anyway.
const showDateModal = ref(false)

function pickDate(day: { id: string }) {
  updateStartDate(day.id)
  showDateModal.value = false
}

// No separate "confirm" action here — clicking a day already applies and
// closes it (pickDate above). Enter just closes, same as Escape/Cancel.
watch(showDateModal, (open) => {
  activeModal.value = open ? { onCancel: () => { showDateModal.value = false }, onConfirm: () => { showDateModal.value = false } } : null
})

const dateAttributes = computed(() => [{
  key: 'selected',
  highlight: {
    style: { backgroundColor: 'var(--ink-dark)', borderRadius: '4px' },
    contentStyle: { color: 'var(--bg)' },
  },
  dates: new Date(startDate.value + 'T12:00:00'),
}])
</script>

<template>
  <div class="loop-picker" :class="{ inverted }" @click.stop>
    <div class="loop-row">
      <button
        v-for="preset in presetRow1"
        :key="preset.label"
        type="button"
        class="loop-opt"
        :class="{ active: sameUnitCount(modelValue, preset.unit, preset.count), dimmed: !sameUnitCount(modelValue, preset.unit, preset.count) }"
        @mousedown.prevent
        @click="select(preset.unit, preset.count)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="loop-row">
      <button
        v-for="preset in presetRow2"
        :key="preset.label"
        type="button"
        class="loop-opt"
        :class="{ active: sameUnitCount(modelValue, preset.unit, preset.count), dimmed: !sameUnitCount(modelValue, preset.unit, preset.count) }"
        @mousedown.prevent
        @click="select(preset.unit, preset.count)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="loop-row">
      <div class="loop-custom" :class="{ dimmed: !isCustom }">
        <span>every</span>
        <input
          type="number"
          min="1"
          :max="MAX_CUSTOM_DAYS"
          maxlength="3"
          class="loop-custom-input"
          v-model.number="customCount"
          @focus="!isCustom && applyCustomCount(); emit('focus-inside')"
          @input="onCustomCountInput"
          @change="applyCustomCount"
        />
        <span>days</span>
      </div>
    </div>

    <div class="loop-row">
      <div class="loop-from">
        <span>starts</span>
        <button
          type="button"
          class="loop-date-btn"
          title="Change start date"
          @mousedown.prevent
          @click="showDateModal = true"
        >
          {{ startDateDisplay }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <template v-if="showDateModal">
        <div class="modal-backdrop" @mousedown.prevent @click="showDateModal = false" />
        <div class="modal-box" role="dialog" @mousedown.prevent @click.stop>
          <VCalendar :attributes="dateAttributes" expanded locale="en" @dayclick="pickDate" />
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" @click="showDateModal = false">Close</button>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<style scoped>
.loop-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loop-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.loop-opt {
  width: 74px;
  text-align: center;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
  padding: 4px 6px;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  background: none;
  user-select: none;
  transition: color 0.1s, background 0.1s, opacity 0.1s;
  font-family: var(--font-mono, monospace);
}

.loop-opt.active {
  background: var(--ink);
  color: var(--bg);
}

.loop-opt.dimmed {
  opacity: 0.35;
}

.inverted .loop-opt {
  border-color: var(--bg);
  color: var(--bg);
}

.inverted .loop-opt.active {
  background: var(--bg);
  color: var(--ink);
}

.loop-custom {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-left: 4px;
  color: var(--ink);
  font-size: 14px;
  font-family: var(--font-mono, monospace);
  cursor: default;
  transition: opacity 0.1s;
}

.loop-custom.dimmed {
  opacity: 0.35;
}

.inverted .loop-custom {
  color: var(--bg);
}

.inverted .loop-custom-input {
  color: var(--bg);
  border-bottom-color: var(--bg);
}

.loop-custom-input {
  width: 34px;
  color: var(--ink);
  background: none;
  border: none;
  border-bottom: 1px solid var(--ink);
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  text-align: center;
  outline: none;
  padding: 0 0 2px;
  /* Hide the native spinner arrows — they don't match anything else in
     the app's own control styling. */
  -moz-appearance: textfield;
}

.loop-custom-input::-webkit-outer-spin-button,
.loop-custom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.loop-from {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
  color: var(--ink);
  font-size: 14px;
  font-family: var(--font-mono, monospace);
}

.inverted .loop-from {
  color: var(--bg);
}

.loop-date-btn {
  border: none;
  border-bottom: 1px solid var(--ink);
  background: none;
  padding: 0 0 2px;
  color: var(--ink);
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  cursor: pointer;
}

.inverted .loop-date-btn {
  color: var(--bg);
  border-bottom-color: var(--bg);
}
</style>
