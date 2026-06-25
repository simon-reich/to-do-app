<script setup lang="ts">
import type { Tag } from '../stores/todos'
defineProps<{ tag: Tag }>()
</script>

<template>
  <span
    class="tag-badge"
    :style="{
      background: tag.color + '22',
      color: tag.color,
      borderColor: tag.color + '66',
    }"
  >{{ tag.label }}</span>
</template>

<style scoped>
.tag-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
  letter-spacing: 0.2px;
}
</style>
