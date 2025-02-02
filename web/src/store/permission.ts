import { defineStore } from 'pinia'
import { permissionApi } from '../services/api'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: {} as Record<string, boolean>,
    loaded: false
  }),

  getters: {
    hasPermission: (state) => (permissionId: string | undefined) => {
      // 如果權限ID未定義，返回false
      if (!permissionId) return false
      
      // 檢查權限是否已加載
      if (!state.loaded) {
        return false
      }
      return state.permissions[permissionId] === true
    },
    
    // 檢查是否有任何管理權限
    hasAnyManagementPermission: (state) => {
      return state.permissions.attendance_management || 
             state.permissions.task_management ||
             state.permissions.user_setting ||
             state.permissions.basic_settings
    }
  },

  actions: {
    async loadPermissions(userId: number) {
      try {
        const response = await permissionApi.getUserPermissions(userId)
        this.updatePermissions(response.data)
      } catch (error) {
        console.error('Failed to load permissions:', error)
        throw error
      }
    },

    // 更新權限的方法
    updatePermissions(permissions: Record<string, boolean>) {
      console.log('Updating permissions:', permissions)
      this.permissions = { ...permissions }
      this.loaded = true
    },

    clearPermissions() {
      this.permissions = {}
      this.loaded = false
    }
  }
}) 