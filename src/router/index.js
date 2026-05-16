import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AdminView from '../views/AdminView.vue'
import EditView from '../views/EditView.vue'
import LoginSuccessView from '../views/LoginSuccessView.vue'
import UserConfigView from '../views/UserConfigView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/edit/:id',
    name: 'EditBook',
    component: EditView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'UserConfig',
    component: UserConfigView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login-success',
    name: 'LoginSuccess',
    component: LoginSuccessView
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
