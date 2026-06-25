<script setup lang="ts">
import type { Tag } from '../stores/todos'
defineProps<{ tag: Tag }>()
</script>

<template>
  <span
    class="tag-badge"
    :style="{ background: tag.color, color: '#fff' }"
  >{{ tag.label }}</span>
</template>

<style scoped>
.tag-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
</style>
