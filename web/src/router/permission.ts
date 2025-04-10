import { usePermissionStore } from '../store/permission'
import { watch } from 'vue'

// 定義需要權限的路由和對應的權限
const permissionMap: Record<string, string> = {
  '/attendance-record': 'attendance_record',
  '/attendance-management': 'attendance_management',
  '/tasks': 'tasks',
  '/task-management': 'task_management',
  '/user-setting': 'user_setting',
  '/basic-settings': 'basic_settings',
  '/finance': 'finance',
  '/reimbursement': 'reimbursement',
  '/reimbursement/:id': 'reimbursement',
  // 添加業務管理相關路由權限
  '/potential-customers': 'manage_leads',
  '/intended-customers': 'manage_prospects',
  '/cooperative-customers': 'manage_customers'
}

export function setupPermissionGuard(router: any) {
  const permissionStore = usePermissionStore()

  // 監聽權限更新
  watch(() => permissionStore.permissions, () => {
    // 當權限更新時，檢查當前路由
    const currentRoute = router.currentRoute.value
    const requiredPermission = getRequiredPermission(currentRoute.path)
    
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
      const requiredPermission = getRequiredPermission(to.path)
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

// 根據路徑獲取所需權限
function getRequiredPermission(path: string): string | undefined {
  // 先嘗試直接匹配
  let permission = permissionMap[path]
  
  // 如果沒有直接匹配，檢查是否有動態路由匹配
  if (!permission) {
    // 將路徑分割成段
    const pathSegments = path.split('/')
    
    // 遍歷所有權限映射
    for (const [routePath, routePermission] of Object.entries(permissionMap)) {
      const routeSegments = routePath.split('/')
      
      // 如果段數不同，跳過
      if (routeSegments.length !== pathSegments.length) continue
      
      // 檢查每個段是否匹配
      const matches = routeSegments.every((segment, index) => {
        // 如果是動態參數（以:開頭），視為匹配
        if (segment.startsWith(':')) return true
        // 否則檢查是否完全相同
        return segment === pathSegments[index]
      })
      
      if (matches) {
        permission = routePermission
        break
      }
    }
  }
  
  return permission
} 