import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VCalendar from 'v-calendar'
import 'v-calendar/style.css'
import router from './router'
import './style.css'
import App from './App.vue'
import { applyTheme } from './composables/useTheme'

// Apply persisted theme before mount to avoid flash of default colors
try {
  const saved = localStorage.getItem('theme')
  if (saved) {
    const { activeBg, activeGray } = JSON.parse(saved)
    if (activeBg && activeGray) applyTheme(activeBg, activeGray)
  }
} catch { /* ignore */ }

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(VCalendar, {})
app.mount('#app')
