<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { ListTodo, Sun, Archive, Calendar, Settings } from '@lucide/vue'
import { useReset } from './composables/useReset'
import SettingsModal from './components/SettingsModal.vue'

const { checkAndReset } = useReset()
onMounted(checkAndReset)

const showSettings = ref(false)
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
      <button class="nav-item nav-btn" @click="showSettings = true">
        <Settings :size="22" />
        <span>Settings</span>
      </button>
    </nav>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
