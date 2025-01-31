import { usePermissionStore } from '../store/permission'
import { useStore } from '../store'

// 定義需要權限的路由和對應的權限
const permissionMap: Record<string, string> = {
  '/attendance': 'attendance_record',
  '/attendance/manage': 'attendance_management',
  '/tasks': 'tasks',
  '/tasks/manage': 'task_management',
  '/users': 'user_setting',
  '/settings': 'basic_settings'
}

export function setupPermissionGuard(router: any) {
  router.beforeEach(async (to: any, _from: any, next: any) => {
    const userStore = useStore()
    const permissionStore = usePermissionStore()
    
    // 如果是登錄頁或首頁，直接放行
    if (to.path === '/login' || to.path === '/') {
      next()
      return
    }

    // 檢查是否已登錄
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }

    // 如果權限尚未加載，加載權限
    if (!permissionStore.loaded && userStore.user) {
      try {
        await permissionStore.loadPermissions(userStore.user.id)
      } catch (error) {
        console.error('Failed to load permissions:', error)
        next('/login')
        return
      }
    }

    // 檢查路由是否需要權限
    const requiredPermission = permissionMap[to.path]
    if (requiredPermission) {
      // 如果用戶是管理員，允許訪問所有頁面
      if (userStore.user?.role === 'admin') {
        next()
        return
      }

      // 檢查用戶是否有所需權限
      if (permissionStore.hasPermission(requiredPermission)) {
        next()
      } else {
        // 如果沒有權限，重定向到首頁
        next('/')
      }
    } else {
      // 如果路由不需要權限，直接放行
      next()
    }
  })
} 