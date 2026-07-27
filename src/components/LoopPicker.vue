<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LoopInterval } from '../stores/todos'

const props = defineProps<{
  modelValue?: LoopInterval
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LoopInterval]
}>()

const presets: { label: string; interval: LoopInterval }[] = [
  { label: 'Daily', interval: { unit: 'day', count: 1 } },
  { label: 'Weekly', interval: { unit: 'week', count: 1 } },
  { label: 'Monthly', interval: { unit: 'month', count: 1 } },
  { label: 'Yearly', interval: { unit: 'year', count: 1 } },
]

function sameInterval(a: LoopInterval | undefined, b: LoopInterval): boolean {
  return !!a && a.unit === b.unit && a.count === b.count
}

// Anything that isn't an exact preset match (including nothing set yet)
// counts as "Custom" — covers both a genuinely custom every-X-days value
// and the not-yet-decided state right after the loop tag is first checked.
const isCustom = computed(() => !presets.some(p => sameInterval(props.modelValue, p.interval)))

const customCount = ref(props.modelValue?.unit === 'day' && isCustom.value ? props.modelValue.count : 2)

watch(() => props.modelValue, (v) => {
  if (v?.unit === 'day' && isCustom.value) customCount.value = v.count
})

function select(interval: LoopInterval) {
  emit('update:modelValue', interval)
}

function applyCustomCount() {
  const count = Math.max(1, Math.round(customCount.value) || 1)
  customCount.value = count
  emit('update:modelValue', { unit: 'day', count })
}
</script>

<template>
  <div class="loop-picker" @click.stop>
    <button
      v-for="preset in presets"
      :key="preset.label"
      type="button"
      class="loop-opt"
      :class="{ dimmed: !sameInterval(modelValue, preset.interval) }"
      @click="select(preset.interval)"
    >
      {{ preset.label }}
    </button>
    <div class="loop-opt loop-custom" :class="{ dimmed: !isCustom }">
      <span>every</span>
      <input
        type="number"
        min="1"
        class="loop-custom-input"
        v-model.number="customCount"
        @focus="!isCustom && applyCustomCount()"
        @change="applyCustomCount"
      />
      <span>days</span>
    </div>
  </div>
</template>

<style scoped>
.loop-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.loop-opt {
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
  padding: 3px 8px;
  border: 1px solid var(--ink);
  border-radius: var(--radius);
  background: none;
  user-select: none;
  transition: color 0.1s, border-color 0.1s, opacity 0.1s;
  font-family: var(--font-mono, monospace);
}

.loop-opt.dimmed {
  opacity: 0.35;
}

@media (hover: hover) {
  .loop-opt:hover {
    color: var(--ink-dark);
    border-color: var(--ink-dark);
    opacity: 1;
  }
}

.loop-custom {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: default;
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
