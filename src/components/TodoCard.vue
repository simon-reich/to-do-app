<script lang="ts">
// Module-level: shared across all TodoCard instances so the bag persists between card completions
const COLOR = 'var(--gray)'
function randColor() { return COLOR }

type EffectName = 'hearts' | 'stars' | 'confetti'
const effectBag: EffectName[] = []

export function nextEffect(): EffectName {
  if (effectBag.length === 0) {
    const bag: EffectName[] = ['hearts', 'hearts', 'stars', 'confetti']
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]]
    }
    effectBag.push(...bag)
  }
  return effectBag.pop()!
}

function particle(cx: number, cy: number, content: string, css: string): HTMLElement {
  const el = document.createElement('span')
  el.textContent = content
  el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;user-select:none;z-index:9999;` + css
  document.body.appendChild(el)
  return el
}

function animateOut(el: HTMLElement, dx: number, dy: number, endTransform: string, dur: number) {
  el.animate(
    [
      { transform: el.style.transform, opacity: 1 },
      { transform: endTransform, opacity: 0 },
    ],
    { duration: dur, easing: 'ease-out', fill: 'forwards' },
  ).onfinish = () => el.remove()
}

export function effectHearts(cx: number, cy: number) {
  for (let i = 0; i < 9; i++) {
    const size = 10 + Math.random() * 6
    const el = particle(cx, cy, '♥', `font-size:${size}px;color:${randColor()};transform:translate(-50%,-50%);`)
    const angle = -90 + (Math.random() - 0.5) * 140
    const dist = 28 + Math.random() * 38
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist
    animateOut(el, dx, dy, `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.3)`, 550 + Math.random() * 300)
  }
}

export function effectStars(cx: number, cy: number) {
  const glyphs = ['★', '✦', '✧', '✶']
  for (let i = 0; i < 12; i++) {
    const size = 12 + Math.random() * 8
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)]
    const el = particle(cx, cy, glyph, `font-size:${size}px;color:${randColor()};transform:translate(-50%,-50%) scale(1.2) rotate(0deg);`)
    const angle = (360 / 12) * i + (Math.random() - 0.5) * 30
    const dist = 32 + Math.random() * 28
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist
    const spin = (Math.random() > 0.5 ? 1 : -1) * 180
    animateOut(el, dx, dy, `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.2) rotate(${spin}deg)`, 480 + Math.random() * 260)
  }
}

export function effectConfetti(cx: number, cy: number) {
  for (let i = 0; i < 14; i++) {
    const w = 4 + Math.random() * 3
    const h = 8 + Math.random() * 6
    const initRot = Math.random() * 360
    const el = document.createElement('span')
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${w}px;height:${h}px;background:${randColor()};pointer-events:none;user-select:none;z-index:9999;border-radius:1px;transform:translate(-50%,-50%) rotate(${initRot}deg);`
    document.body.appendChild(el)
    const angle = -90 + (Math.random() - 0.5) * 180
    const dist = 30 + Math.random() * 50
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist + 15
    const spin = initRot + (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 200)
    el.animate(
      [
        { transform: `translate(-50%,-50%) rotate(${initRot}deg)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' },
    ).onfinish = () => el.remove()
  }
}

import { ref } from 'vue'
// Shared across all instances – only one tag menu open at a time
const openTagMenuId = ref<string | null>(null)
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CirclePlus, CircleMinus, Circle, Trash2, CheckCheck, Clock } from '@lucide/vue'
import { useTodosStore, type Todo } from '../stores/todos'
import TagSelectModal from './TagSelectModal.vue'

const props = defineProps<{
  todo: Todo
  mode: 'all' | 'today'
}>()

const store = useTodosStore()

const emit = defineEmits<{
  'send-to-today': [id: string]
  'remove-from-today': [id: string]
  'complete': [id: string]
  'done-for-today': [id: string]
  'delete': [id: string]
}>()

const showMenu = ref(false)
const showTagMenu = computed(() => openTagMenuId.value === props.todo.id)
const wrapRef = ref<HTMLElement | null>(null)
const circleBtnRef = ref<HTMLButtonElement | null>(null)

function closeOnOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    showMenu.value = false
    if (openTagMenuId.value === props.todo.id) openTagMenuId.value = null
  }
}

watch([showMenu, showTagMenu], ([m, t]) => {
  if (m || t) document.addEventListener('click', closeOnOutside)
  else document.removeEventListener('click', closeOnOutside)
})

function toggleTagMenu() {
  showMenu.value = false
  openTagMenuId.value = openTagMenuId.value === props.todo.id ? null : props.todo.id
}

function updateTags(tags: string[]) {
  store.updateTodo(props.todo.id, { tags })
}

function spawnEffect() {
  const btn = circleBtnRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const effect = nextEffect()
  if (effect === 'hearts') effectHearts(cx, cy)
  else if (effect === 'stars') effectStars(cx, cy)
  else effectConfetti(cx, cy)
}

function handleComplete(id: string) {
  spawnEffect()
  showMenu.value = false
  emit('complete', id)
}

function handleDoneForToday(id: string) {
  spawnEffect()
  showMenu.value = false
  emit('done-for-today', id)
}
</script>

<template>
  <div ref="wrapRef" class="todo-card-wrap">
    <div class="todo-card" :class="{ 'has-tags': todo.tags.length }">
      <span class="todo-title" @click.stop="store.tags.length ? toggleTagMenu() : null">{{ todo.title }}</span>

      <button
        v-if="mode === 'all'"
        class="card-btn card-btn--delete"
        title="Delete"
        @click.stop="emit('delete', todo.id)"
      >
        <Trash2 :size="16" />
      </button>
      <button
        v-else
        class="card-btn"
        title="Move back to overview"
        @click.stop="emit('remove-from-today', todo.id)"
      >
        <CircleMinus :size="18" />
      </button>

      <button
        v-if="mode === 'all' && !todo.inToday"
        class="card-btn"
        title="Add to today"
        @click.stop="emit('send-to-today', todo.id)"
      >
        <CirclePlus :size="18" />
      </button>
      <button
        v-else-if="mode === 'all' && todo.inToday"
        class="card-btn"
        title="Remove from today"
        @click.stop="emit('remove-from-today', todo.id)"
      >
        <CircleMinus :size="18" />
      </button>
      <button
        v-else
        ref="circleBtnRef"
        class="card-btn"
        :class="{ active: showMenu }"
        title="Complete"
        @click.stop="showMenu = !showMenu"
      >
        <Circle :size="18" />
      </button>
    </div>

    <div v-if="showMenu && mode === 'today'" class="check-menu">
      <button class="check-opt" @click.stop="handleComplete(todo.id)">
        <CheckCheck :size="16" /> Done
      </button>
      <button class="check-opt" @click.stop="handleDoneForToday(todo.id)">
        <Clock :size="16" /> Done for today
      </button>
    </div>

    <TagSelectModal
      v-if="showTagMenu && store.tags.length"
      :model-value="todo.tags"
      @update:model-value="updateTags"
      @mousedown.prevent
    />
  </div>
</template>

<style scoped>
.todo-card-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
}

.todo-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  box-shadow: 5px 5px 0 var(--gray);
  background: var(--bg);
  font-size: 17px;
  color: var(--gray);
  max-width: 320px;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.todo-card:hover {
  border-color: var(--gray-dark);
  box-shadow: 5px 5px 0 var(--gray-dark);
}

.todo-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
}

.card-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.12s;
}

.card-btn:hover,
.card-btn.active { color: var(--gray-dark); }

.card-btn--delete:hover { color: var(--gray); }

.check-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background: var(--bg);
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  box-shadow: 4px 4px 0 var(--gray);
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow: hidden;
  min-width: 100%;
}

.check-opt {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--gray);
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: color 0.1s, background 0.1s;
}

.check-opt:hover {
  color: var(--gray-dark);
  background: rgba(135, 128, 128, 0.1);
}
</style>
