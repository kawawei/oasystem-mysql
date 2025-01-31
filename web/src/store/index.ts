import { defineStore } from 'pinia'

interface User {
  id: number
  username: string
  name: string
  role: 'admin' | 'user'
  department?: string
  position?: string
  email?: string
  phone?: string
  status?: string
  lastLoginAt?: string
}

export const useStore = defineStore('main', {
  state: () => ({
    systemName: 'OA System',
    user: null as User | null
  }),
  
  getters: {
    isLoggedIn: (state) => state.user !== null
  },
  
  actions: {
    updateSystemName(name: string) {
      this.systemName = name
    },
    
    setUser(user: User | null) {
      this.user = user
    }
  }
}) 