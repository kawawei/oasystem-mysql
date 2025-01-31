import { usePermissionStore } from '../store/permission'
import { watch } from 'vue'

// 定義需要權限的路由和對應的權限
const permissionMap: Record<string, string> = {
  '/attendance-record': 'attendance_record',
  '/attendance-management': 'attendance_management',
  '/tasks': 'tasks',
  '/task-management': 'task_management',
  '/user-setting': 'user_setting',
  '/basic-settings': 'basic_settings'
}

export function setupPermissionGuard(router: any) {
  const permissionStore = usePermissionStore()

  // 監聽權限更新
  watch(() => permissionStore.permissions, () => {
    // 當權限更新時，檢查當前路由
    const currentRoute = router.currentRoute.value
    const requiredPermission = permissionMap[currentRoute.path]
    
    console.log('權限更新:', {
      currentPath: currentRoute.path,
      requiredPermission,
      hasPermission: permissionStore.hasPermission(requiredPermission),
      allPermissions: permissionStore.permissions
    })

    // 如果當前頁面需要權限且用戶沒有權限，則重定向到首頁
    if (requiredPermission && !permissionStore.hasPermission(requiredPermission)) {
      router.push('/home')
    }
  }, { deep: true })

  router.beforeEach(async (to: any, from: any, next: any) => {
    // 檢查是否已登錄
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const isAuthenticated = token && user

    // 如果是登錄頁
    if (to.path === '/login') {
      if (isAuthenticated && from.path !== '/login') {
        next('/home')
      } else {
        next()
      }
      return
    }

    // 如果是首頁或需要驗證的頁面
    if (to.meta.requiresAuth) {
      if (!isAuthenticated) {
        next('/login')
        return
      }

      // 如果權限尚未加載，加載權限
      if (!permissionStore.loaded && user) {
        try {
          await permissionStore.loadPermissions(user.id)
        } catch (error) {
          console.error('Failed to load permissions:', error)
          next('/login')
          return
        }
      }

      // 檢查路由是否需要特定權限
      const requiredPermission = permissionMap[to.path]
      console.log('路由權限檢查:', {
        path: to.path,
        requiredPermission,
        hasPermission: permissionStore.hasPermission(requiredPermission),
        allPermissions: permissionStore.permissions,
        isLoaded: permissionStore.loaded
      })

      if (requiredPermission && !permissionStore.hasPermission(requiredPermission)) {
        console.log('權限被拒絕:', requiredPermission)
        next('/home')
        return
      }
    }

    next()
  })
} 