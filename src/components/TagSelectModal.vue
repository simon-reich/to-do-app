<script setup lang="ts">
import { useTodosStore } from '../stores/todos'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()

const store = useTodosStore()

function toggle(id: string) {
  const current = props.modelValue
  const idx = current.indexOf(id)
  emit('update:modelValue', idx === -1 ? [...current, id] : current.filter(i => i !== id))
}
</script>

<template>
  <div class="tag-modal">
    <template v-if="store.tags.length">
      <label
        v-for="tag in store.tags"
        :key="tag.id"
        class="tag-option"
        :class="{ checked: modelValue.includes(tag.id) }"
      >
        <input
          type="checkbox"
          :checked="modelValue.includes(tag.id)"
          @change="toggle(tag.id)"
        />
        <span>{{ tag.label }}</span>
      </label>
    </template>
    <span v-else class="tag-empty">No tags yet</span>
  </div>
</template>

<style scoped>
.tag-modal {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg);
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 50;
  box-shadow: 2px 2px 0 var(--gray);
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--gray);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: color 0.1s;
  user-select: none;
}

.tag-option.checked {
  color: var(--gray-dark);
}

.tag-option:hover {
  color: var(--gray-dark);
}

.tag-option input[type='checkbox'] {
  accent-color: var(--gray-dark);
  cursor: pointer;
}

.tag-empty {
  font-size: 12px;
  color: var(--gray-light);
  padding: 2px 6px;
}
</style>
