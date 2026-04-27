import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
