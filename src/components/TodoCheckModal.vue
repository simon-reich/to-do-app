<script setup lang="ts">
import { CheckCheck, Clock, X } from '@lucide/vue'

defineProps<{ title: string }>()
const emit = defineEmits<{
  complete: []
  doneForToday: []
  cancel: []
}>()
</script>

<template>
  <div class="check-modal">
    <p class="check-title">{{ title }}</p>
    <div class="check-options">
      <button class="opt-btn opt-complete" @click="emit('complete')">
        <CheckCheck :size="16" />
        Erledigt
      </button>
      <button class="opt-btn opt-today" @click="emit('doneForToday')">
        <Clock :size="16" />
        Für heute fertig
      </button>
    </div>
    <button class="cancel-btn" @click="emit('cancel')">
      <X :size="14" /> Abbrechen
    </button>
  </div>
</template>

<style scoped>
.check-modal {
  background: var(--yellow);
  box-shadow: 3px 3px 0 var(--text);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
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
  padding: 10px 8px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.1s;
}

.opt-btn:hover {
  opacity: 0.85;
}

.opt-complete {
  background: var(--teal);
  color: #fff;
}

.opt-today {
  background: var(--text);
  color: #fff;
}

.cancel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  align-self: center;
}

.cancel-btn:hover {
  color: var(--text);
}
</style>
