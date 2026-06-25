<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { ListTodo, Sun, Archive, Calendar } from '@lucide/vue'
import { useReset } from './composables/useReset'

const { checkAndReset } = useReset()
onMounted(checkAndReset)
</script>

<template>
  <div id="app-shell">
    <main>
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/all" class="nav-item">
        <ListTodo :size="22" />
        <span>Alle</span>
      </RouterLink>
      <RouterLink to="/today" class="nav-item">
        <Sun :size="22" />
        <span>Heute</span>
      </RouterLink>
      <RouterLink to="/archive" class="nav-item">
        <Archive :size="22" />
        <span>Archiv</span>
      </RouterLink>
      <RouterLink to="/calendar" class="nav-item">
        <Calendar :size="22" />
        <span>Kalender</span>
      </RouterLink>
    </nav>
  </div>
</template>
