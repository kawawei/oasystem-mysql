<template>
  <div class="app">
    <template v-if="$route.path !== '/login'">
      <Sidebar />
      <div class="main-wrapper">
        <div class="top-nav">
          <span class="page-title">
            {{ systemName }} - {{ pageTitle }}
          </span>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <button class="logout-btn" @click="handleLogout">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              登出
            </button>
          </div>
        </div>
        <main class="main-content">
          <router-view></router-view>
        </main>
      </div>
    </template>
    <template v-else>
      <router-view></router-view>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from './composables/useToast'
import { useStore } from './store'
import { usePermissionStore } from './store/permission'
import { settingsApi } from './services/api'
import Sidebar from './components/Sidebar.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const store = useStore()
const permissionStore = usePermissionStore()

// 在應用啟動時獲取系統設置
onMounted(async () => {
  // 檢查本地存儲的用戶信息
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      store.setUser(user)
      // 加載用戶權限
      await permissionStore.loadPermissions(user.id)
      
      // 只有在用戶有權限時才獲取系統設置
      if (permissionStore.hasPermission('basic_settings')) {
        try {
          const response = await settingsApi.getSettings()
          if (response.data) {
            store.updateSystemName(response.data.systemName)
          }
        } catch (error) {
          console.error('Failed to load system settings:', error)
        }
      }
    } catch (error) {
      console.error('Failed to parse user data:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
})

const systemName = computed(() => store.systemName)

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const userName = computed(() => {
  return user.value?.name || user.value?.username || ''
})

const pageTitle = computed(() => {
  switch (route.path) {
    case '/user-setting':
      return '用戶管理'
    case '/attendance-management':
      return '考勤管理'
    case '/attendance-record':
      return '打卡記錄'
    case '/home':
      return '首頁'
    case '/task-management':
      return '任務管理'
    default:
      return ''
  }
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  toast.success('已登出')
  router.push('/login')
}
</script>

<style lang="scss">
:root {
  --color-primary: rgb(0, 122, 255);
  --color-primary-dark: rgb(0, 103, 216);
  --color-error: rgb(255, 59, 48);
  --color-text: rgb(29, 29, 31);
  --color-text-secondary: rgb(99, 99, 102);
  --color-border: rgb(209, 209, 214);
  --color-background: white;
  
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  --radius-lg: 12px;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.1);
  
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 68px;
  --header-height: 60px;
  
  @media (max-width: 768px) {
    --sidebar-width: 100%;
    --sidebar-width-collapsed: 0;
    --header-height: 56px;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text);
  line-height: 1.5;
}

.app {
  min-height: 100vh;
  width: 100%;
  background: rgb(247, 247, 247);
  position: relative;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

input, button {
  font-family: inherit;
}

.main-wrapper {
  position: relative;
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
}

.main-content {
  padding: var(--spacing-lg);
  padding-top: calc(var(--header-height) + var(--spacing-lg));
  width: 100%;
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
    padding-top: calc(var(--header-height) + var(--spacing-md));
  }
}

.top-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: var(--sidebar-width);
  height: var(--header-height);
  padding: 0 var(--spacing-lg);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  z-index: 900;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 768px) {
    left: 0;
    padding: 0 var(--spacing-md);
  }
}

.page-title {
  display: none;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  grid-column: 2;
  justify-self: center;
  
  @media (max-width: 768px) {
    display: block;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  position: absolute;
  right: var(--spacing-lg);
  
  @media (max-width: 768px) {
    gap: var(--spacing-sm);
    right: var(--spacing-md);
  }
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
  
  @media (max-width: 480px) {
    display: none;
  }
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 8px;
  color: var(--color-text);
  font-weight: 500;
  background: transparent;
  
  @media (max-width: 480px) {
    padding: var(--spacing-sm);
    
    span {
      display: none;
    }
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--color-error);
    
    svg {
      stroke: var(--color-error);
    }
  }
}

.app.sidebar-collapsed {
  .main-wrapper {
    margin-left: var(--sidebar-width-collapsed);
    
    @media (max-width: 768px) {
      margin-left: 0;
    }
  }
  
  .top-nav {
    left: var(--sidebar-width-collapsed);
    
    @media (max-width: 768px) {
      left: 0;
    }
  }
}
</style> 