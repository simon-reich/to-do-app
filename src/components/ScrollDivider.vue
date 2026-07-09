<script setup lang="ts">
// Shared building block for the "line that turns ink-colored once its
// scroll container has scrolled" pattern used all over this app (sidebar,
// main content, mobile tags panel, Calendar's day-detail — top and bottom
// variants of each). Only the visible/height/background/transition bit is
// universal; positioning (sticky/fixed/absolute/static, insets, z-index)
// differs per call site and stays in that site's own CSS, applied via the
// class attribute (Vue merges it onto this component's root element).
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <div class="scroll-divider-line" :class="{ visible }" />
</template>

<style scoped>
.scroll-divider-line {
  height: 2px;
  background: transparent;
  transition: background 0.2s;
}

.scroll-divider-line.visible {
  background: var(--ink);
}
</style>
