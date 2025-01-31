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
    meta: { requiresAuth: true }
  },
  {
    path: '/user-setting',
    name: 'UserSetting',
    component: () => import('../views/UserSetting.vue'),
    meta: { requiresAuth: true }
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
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/Tasks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/basic-settings',
    name: 'BasicSettings',
    component: () => import('../views/BasicSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post-management',
    name: 'PostManagement',
    component: () => import('../views/PostManagement.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 