import { defineStore } from 'pinia'

// 定義用戶狀態接口 Define user state interface
interface UserState {
  userId: number | null
  username: string | null
  name: string | null
  role: string | null
  department: string | null
  position: string | null
  email: string | null
  phone: string | null
  status: string | null
  lastLoginAt: string | null
  token: string | null
}

// 定義用戶 store Define user store
export const useUserStore = defineStore('user', {
  // 初始狀態 Initial state
  state: (): UserState => ({
    userId: null,
    username: null,
    name: null,
    role: null,
    department: null,
    position: null,
    email: null,
    phone: null,
    status: null,
    lastLoginAt: null,
    token: null
  }),

  // Getters
  getters: {
    // 檢查用戶是否已登入 Check if user is logged in
    isLoggedIn: (state) => !!state.token,
    // 獲取用戶完整信息 Get user full info
    userInfo: (state) => ({
      id: state.userId,
      username: state.username,
      name: state.name,
      role: state.role,
      department: state.department,
      position: state.position,
      email: state.email,
      phone: state.phone,
      status: state.status,
      lastLoginAt: state.lastLoginAt
    })
  },

  // Actions
  actions: {
    // 設置用戶信息 Set user info
    setUserInfo(userInfo: {
      id: number
      username: string
      name: string
      role: string
      department: string
      position: string
      email: string
      phone: string
      status: string
      lastLoginAt: string
    }) {
      this.userId = userInfo.id
      this.username = userInfo.username
      this.name = userInfo.name
      this.role = userInfo.role
      this.department = userInfo.department
      this.position = userInfo.position
      this.email = userInfo.email
      this.phone = userInfo.phone
      this.status = userInfo.status
      this.lastLoginAt = userInfo.lastLoginAt
    },

    // 設置 token Set token
    setToken(token: string) {
      this.token = token
    },

    // 清除用戶信息（登出時使用）Clear user info (used when logging out)
    clearUserInfo() {
      this.userId = null
      this.username = null
      this.name = null
      this.role = null
      this.department = null
      this.position = null
      this.email = null
      this.phone = null
      this.status = null
      this.lastLoginAt = null
      this.token = null
    }
  }
}) 