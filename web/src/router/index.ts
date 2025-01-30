import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/attendance-management',
    name: 'AttendanceManagement',
    component: () => import('../views/AttendanceManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user-setting',
    name: 'UserSetting',
    component: () => import('../views/UserSetting.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/attendance-record',
    name: 'AttendanceRecord',
    component: () => import('../views/AttendanceRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/task-management',
    name: 'TaskManagement',
    component: () => import('../views/TaskManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
const authGuard = (to: any, _from: any, next: any) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAuthenticated = token && user
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && user?.role !== 'admin') {
    next('/home')
  } else if (to.path === '/login' && isAuthenticated && _from.path !== '/login') {
    next('/home')
  } else {
    next()
  }
}

router.beforeEach(authGuard)

export default router 