import { usePermissionStore } from '../store/permission'

// 定義用戶類型
interface User {
  id: number;
  role: string;
  name: string;
}

// 定義需要權限的路由和對應的權限
const permissionMap: Record<string, string> = {
  '/attendance-record': 'attendance_record',    // 查看個人考勤記錄
  '/attendance-management': 'attendance_management',    // 管理所有人的考勤記錄
  '/tasks': 'tasks',    // 查看個人任務
  '/task-management': 'task_management',    // 管理所有人的任務
  '/user-setting': 'user_management',    // 管理系統用戶
  '/basic-settings': 'basic_settings'    // 系統基礎設置
}

export function setupPermissionGuard(router: any) {
  router.beforeEach(async (to: any, _from: any, next: any) => {
    const permissionStore = usePermissionStore()
    
    // 如果是登錄頁或首頁，直接放行
    if (to.path === '/login' || to.path === '/') {
      next()
      return
    }

    // 檢查是否已登錄
    const token = localStorage.getItem('token')
    if (!token) {
      next('/login')
      return
    }

    // 獲取用戶信息
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) as User : null
    if (!user) {
      next('/login')
      return
    }

    // 如果權限尚未加載，加載權限
    if (!permissionStore.loaded) {
      try {
        await permissionStore.loadPermissions(user.id)
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
      if (user.role === 'admin') {
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