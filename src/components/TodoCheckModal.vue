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
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-title {
  font-size: 14px;
  font-weight: 500;
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
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.opt-complete {
  background: #f0fdf4;
  border-color: #86efac;
  color: #16a34a;
}

.opt-complete:hover {
  background: #dcfce7;
}

.opt-today {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.opt-today:hover {
  background: #dbeafe;
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
