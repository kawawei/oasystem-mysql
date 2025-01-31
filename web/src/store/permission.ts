import { defineStore } from 'pinia'
import { permissionApi } from '../services/api'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: {} as Record<string, boolean>,
    loaded: false
  }),

  getters: {
    hasPermission: (state) => (permissionId: string) => {
      return state.permissions[permissionId] || false
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
        this.permissions = response.data
        this.loaded = true
      } catch (error) {
        console.error('Failed to load permissions:', error)
        throw error
      }
    },

    // 新增：直接更新權限的方法
    updatePermissions(permissions: Record<string, boolean>) {
      this.permissions = permissions
      this.loaded = true
    },

    clearPermissions() {
      this.permissions = {}
      this.loaded = false
    }
  }
}) 