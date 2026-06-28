<script setup lang="ts">
import { CirclePlus, CircleMinus, Circle, Trash2 } from '@lucide/vue'
import type { Todo } from '../stores/todos'

defineProps<{
  todo: Todo
  mode: 'all' | 'today'
}>()

const emit = defineEmits<{
  'send-to-today': [id: string]
  'remove-from-today': [id: string]
  'start-check': [id: string]
  'delete': [id: string]
}>()
</script>

<template>
  <div class="todo-card" :class="{ 'in-today': todo.inToday }">
    <span class="todo-title">{{ todo.title }}</span>

    <button
      v-if="mode === 'all'"
      class="card-btn card-btn--delete"
      title="Delete"
      @click.stop="emit('delete', todo.id)"
    >
      <Trash2 :size="13" />
    </button>
    <button
      v-else
      class="card-btn"
      title="Move back to overview"
      @click.stop="emit('remove-from-today', todo.id)"
    >
      <CircleMinus :size="15" />
    </button>

    <button
      v-if="mode === 'all' && !todo.inToday"
      class="card-btn"
      title="Add to today"
      @click.stop="emit('send-to-today', todo.id)"
    >
      <CirclePlus :size="15" />
    </button>
    <button
      v-else-if="mode === 'all' && todo.inToday"
      class="card-btn"
      title="Remove from today"
      @click.stop="emit('remove-from-today', todo.id)"
    >
      <CircleMinus :size="15" />
    </button>
    <button
      v-else
      class="card-btn"
      title="Complete"
      @click.stop="emit('start-check', todo.id)"
    >
      <Circle :size="15" />
    </button>
  </div>
</template>

<style scoped>
.todo-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--gray);
  background: var(--bg);
  font-size: 15px;
  color: var(--gray);
  max-width: 320px;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.todo-card:hover {
  border-color: var(--gray-dark);
  box-shadow: 2px 2px 0 var(--gray-dark);
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

.card-btn:hover { color: var(--gray-dark); }
.card-btn.is-today { color: var(--gray); }

.card-btn--delete:hover { color: var(--gray); }
</style>
