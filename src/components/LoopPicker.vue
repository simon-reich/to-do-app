<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LoopInterval } from '../stores/todos'

const props = defineProps<{
  modelValue?: LoopInterval
  /** Set when the todo is also tagged priority: that card fills solid
   *  ink, which would swallow this picker's own ink-colored border/text
   *  entirely — swap to bg-colored controls so they stay legible. */
  inverted?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LoopInterval]
}>()

const presetRow1: { label: string; interval: LoopInterval }[] = [
  { label: 'Daily', interval: { unit: 'day', count: 1 } },
  { label: 'Weekly', interval: { unit: 'week', count: 1 } },
]
const presetRow2: { label: string; interval: LoopInterval }[] = [
  { label: 'Monthly', interval: { unit: 'month', count: 1 } },
  { label: 'Yearly', interval: { unit: 'year', count: 1 } },
]
const presets = [...presetRow1, ...presetRow2]

function sameInterval(a: LoopInterval | undefined, b: LoopInterval): boolean {
  return !!a && a.unit === b.unit && a.count === b.count
}

// Anything that isn't an exact preset match (including nothing set yet)
// counts as "Custom" — covers both a genuinely custom every-X-days value
// and the not-yet-decided state right after the loop tag is first checked.
const isCustom = computed(() => !presets.some(p => sameInterval(props.modelValue, p.interval)))

const MAX_CUSTOM_DAYS = 999

const customCount = ref(props.modelValue?.unit === 'day' && isCustom.value ? props.modelValue.count : 2)

watch(() => props.modelValue, (v) => {
  if (v?.unit === 'day' && isCustom.value) customCount.value = v.count
})

function select(interval: LoopInterval) {
  emit('update:modelValue', interval)
}

function applyCustomCount() {
  const count = Math.min(MAX_CUSTOM_DAYS, Math.max(1, Math.round(customCount.value) || 1))
  customCount.value = count
  emit('update:modelValue', { unit: 'day', count })
}
</script>

<template>
  <div class="loop-picker" :class="{ inverted }" @click.stop>
    <div class="loop-row">
      <button
        v-for="preset in presetRow1"
        :key="preset.label"
        type="button"
        class="loop-opt"
        :class="{ active: sameInterval(modelValue, preset.interval), dimmed: !sameInterval(modelValue, preset.interval) }"
        @mousedown.prevent
        @click="select(preset.interval)"
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
        :class="{ active: sameInterval(modelValue, preset.interval), dimmed: !sameInterval(modelValue, preset.interval) }"
        @mousedown.prevent
        @click="select(preset.interval)"
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
          @focus="!isCustom && applyCustomCount()"
          @change="applyCustomCount"
        />
        <span>days</span>
      </div>
    </div>
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
  font-size: 12px;
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
  width: 32px;
  color: var(--ink);
  background: none;
  border: none;
  border-bottom: 1px solid var(--ink);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  text-align: center;
  outline: none;
  padding: 0;
  /* Hide the native spinner arrows — they don't match anything else in
     the app's own control styling. */
  -moz-appearance: textfield;
}

.loop-custom-input::-webkit-outer-spin-button,
.loop-custom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
