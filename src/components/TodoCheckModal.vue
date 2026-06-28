<script setup lang="ts">
import { CheckCheck, Clock, X } from '@lucide/vue'

defineProps<{ title: string }>()
const emit = defineEmits<{
  complete: []
  'done-for-today': []
  cancel: []
}>()
</script>

<template>
  <div class="check-modal">
    <p class="check-title">{{ title }}</p>
    <div class="check-options">
      <button class="opt-btn opt-complete" @click="emit('complete')">
        <CheckCheck :size="15" />
        Done
      </button>
      <button class="opt-btn opt-today" @click="emit('done-for-today')">
        <Clock :size="15" />
        Done for today
      </button>
    </div>
    <button class="cancel-btn" @click="emit('cancel')">
      <X :size="13" /> Cancel
    </button>
  </div>
</template>

<style scoped>
.check-modal {
  background: var(--bg);
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  box-shadow: 3px 3px 0 var(--gray);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 240px;
  max-width: 320px;
}

.check-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-dark);
  line-height: 1.4;
}

.check-options {
  display: flex;
  gap: 8px;
}

.opt-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  color: var(--gray);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}

.opt-btn:hover {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
}

.cancel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--gray);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  align-self: center;
  transition: color 0.12s;
}

.cancel-btn:hover {
  color: var(--gray-dark);
}
</style>
