import { defineStore } from 'pinia'

export const useStore = defineStore('main', {
  state: () => ({
    systemName: 'OA System',
    user: null
  }),
  
  actions: {
    updateSystemName(name: string) {
      this.systemName = name
    },
    
    setUser(user: any) {
      this.user = user
    }
  }
}) 