import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AdminView from '../views/AdminView.vue'
import EditView from '../views/EditView.vue'

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
  },
  {
    path: '/admin/edit/:id',
    name: 'EditBook',
    component: EditView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
