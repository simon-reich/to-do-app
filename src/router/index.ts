import { createRouter, createWebHashHistory } from 'vue-router'
import AllTodos from '../views/AllTodos.vue'
import Focus from '../views/Focus.vue'
import Calendar from '../views/Calendar.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/all' },
    { path: '/all', component: AllTodos },
    { path: '/focus', component: Focus },
    { path: '/calendar', component: Calendar },
    { path: '/settings', component: Settings },
  ],
})

export default router
