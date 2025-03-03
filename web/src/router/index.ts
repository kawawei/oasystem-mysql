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
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('../views/Posts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('../views/Finance.vue'),
    meta: { 
      requiresAuth: true,
      requiredPermission: 'finance'
    }
  },
  {
    path: '/reimbursement',
    name: 'Reimbursement',
    component: () => import('../views/Reimbursement.vue'),
    meta: { 
      requiresAuth: true,
      requiredPermission: 'reimbursement'
    }
  },
  {
    path: '/reimbursement/:id',
    name: 'ReimbursementDetail',
    component: () => import('../views/ReimbursementDetail.vue'),
    meta: { 
      requiresAuth: true,
      requiredPermission: 'reimbursement'
    }
  },
  {
    path: '/finance/:id',
    name: 'FinanceDetail',
    component: () => import('@/views/FinanceDetail.vue'),
    meta: {
      requiresAuth: true,
      title: '財務詳情'
    }
  },
  {
    path: '/potential-customers',
    name: 'PotentialCustomers',
    component: () => import('@/views/potential-customers/CustomerList.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'manage_leads',
      title: '陌生客戶列表'
    }
  },
  {
    path: '/business-management',
    name: 'BusinessManagement',
    component: () => import('@/views/business/BusinessManagement.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'manage_business',
      title: '業務管理'
    }
  },
  {
    path: '/interested-customers',
    name: 'InterestedCustomers',
    component: () => import('@/views/potential-customers/InterestedCustomerList.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'manage_leads',
      title: '意向客戶列表'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 