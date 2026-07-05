<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

// ── Color math ──
function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
  const v = max, s = max === 0 ? 0 : d / max
  let h = 0
  if (d) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100; v /= 100
  const i = Math.floor(h / 60) % 6, f = (h / 60) - Math.floor(h / 60)
  const p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s)
  const rgb = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i]
  return '#' + rgb.map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('')
}

// ── State ──
const hue = ref(0)
const sat = ref(100)
const val = ref(100)

watch(() => props.modelValue, (hex) => {
  if (!hex || hex.length !== 7) return
  if (hex.toLowerCase() !== hsvToHex(hue.value, sat.value, val.value).toLowerCase()) {
    ;[hue.value, sat.value, val.value] = rgbToHsv(...hexToRgb(hex))
  }
}, { immediate: true })

const currentHex = computed(() => hsvToHex(hue.value, sat.value, val.value))
watch(currentHex, v => emit('update:modelValue', v))

const hexInput = ref('')
watch(currentHex, v => { hexInput.value = v }, { immediate: true })

function onHexInput(e: Event) {
  hexInput.value = (e.target as HTMLInputElement).value
}

function onHexCommit() {
  const raw = hexInput.value.trim()
  const full = raw.startsWith('#') ? raw : '#' + raw
  if (/^#[0-9a-fA-F]{6}$/.test(full)) {
    ;[hue.value, sat.value, val.value] = rgbToHsv(...hexToRgb(full))
  } else {
    hexInput.value = currentHex.value
  }
}

const squareBg = computed(() =>
  `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue.value},100%,50%))`
)

// ── Pointer handling ──
function clamp(n: number) { return Math.max(0, Math.min(1, n)) }

function onSV(e: PointerEvent) {
  if (e.type === 'pointerdown') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  if (e.type !== 'pointermove' || e.buttons) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    sat.value = Math.round(clamp((e.clientX - r.left) / r.width) * 100)
    val.value = Math.round(clamp(1 - (e.clientY - r.top) / r.height) * 100)
  }
}

function onHue(e: PointerEvent) {
  if (e.type === 'pointerdown') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  if (e.type !== 'pointermove' || e.buttons) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    hue.value = Math.round(clamp((e.clientX - r.left) / r.width) * 360)
  }
}
</script>

<template>
  <div class="cpicker">
    <div class="sv-square" :style="{ background: squareBg }" @pointerdown="onSV" @pointermove="onSV">
      <div class="sv-thumb" :style="{ left: sat + '%', top: (100 - val) + '%' }" />
    </div>
    <div class="hue-strip" @pointerdown="onHue" @pointermove="onHue">
      <div class="hue-thumb" :style="{ left: (hue / 360 * 100) + '%' }" />
    </div>
    <div class="cpicker-footer">
      <span class="result-swatch" :style="{ background: currentHex }" />
      <input
        class="result-hex"
        :value="hexInput"
        @input="onHexInput"
        @blur="onHexCommit"
        @keydown.enter.prevent="onHexCommit"
        maxlength="7"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<style scoped>
.cpicker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.sv-square {
  position: relative;
  width: 100%;
  height: 140px;
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
  border-radius: var(--radius);
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.sv-thumb {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hue-strip {
  position: relative;
  width: 100%;
  height: 12px;
  border-radius: var(--radius);
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  cursor: pointer;
  touch-action: none;
  user-select: none;
}

.hue-thumb {
  position: absolute;
  top: 50%;
  width: 4px;
  height: calc(100% + 8px);
  background: #fff;
  border: 1px solid var(--ink-dark);
  border-radius: 2px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cpicker-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-swatch {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: var(--radius);
  border: 2px solid var(--ink);
  flex-shrink: 0;
}

.result-hex {
  font-size: 14px;
  font-family: var(--font-mono, monospace);
  color: var(--ink);
  background: none;
  border: none;
  outline: none;
  padding: 0;
  width: 7ch;
  cursor: text;
}
.result-hex:focus {
  color: var(--ink-dark);
}
</style>
