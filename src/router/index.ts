import { createRouter, createWebHashHistory } from 'vue-router'
import AllTodos from '../views/AllTodos.vue'
import Today from '../views/Today.vue'
import Archive from '../views/Archive.vue'
import Calendar from '../views/Calendar.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/all' },
    { path: '/all', component: AllTodos },
    { path: '/today', component: Today },
    { path: '/archive', component: Archive },
    { path: '/calendar', component: Calendar },
  ],
})

export default router
