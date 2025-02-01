<template>
    <div class="sidebar-wrapper">
      <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-header">
          <div class="logo" v-show="!isCollapsed">{{ systemName }}</div>
          <button class="toggle-btn" @click="toggleSidebar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" v-if="isCollapsed" />
              <path d="M4 6h16M4 12h16M4 18h16" v-else />
            </svg>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/home" class="nav-item" :class="{ 'active': $route.path === '/home' }">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">首頁</span>
          </router-link>
          
          <!-- 考勤相關功能 -->
          <router-link 
            v-if="permissionStore.hasPermission('attendance_management')"
            to="/attendance-management" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/attendance-management' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">考勤管理</span>
          </router-link>
          
          <router-link 
            v-if="permissionStore.hasPermission('attendance_record')"
            to="/attendance-record" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/attendance-record' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">打卡記錄</span>
          </router-link>
          
          <!-- 任務相關功能 -->
          <router-link 
            v-if="permissionStore.hasPermission('task_management')"
            to="/task-management" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/task-management' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">任務管理</span>
          </router-link>
          
          <router-link 
            v-if="permissionStore.hasPermission('tasks')"
            to="/tasks" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/tasks' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">我的任務</span>
          </router-link>
          
          <!-- 貼文相關功能 -->
          <router-link 
            v-if="permissionStore.hasPermission('posts')"
            to="/posts" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/posts' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">貼文列表</span>
          </router-link>
          
          <!-- 貼文管理 -->
          <router-link 
            v-if="permissionStore.hasPermission('post_management')"
            to="/post-management" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/post-management' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">貼文管理</span>
          </router-link>
          
          <!-- 財務功能 -->
          <router-link 
            v-if="permissionStore.hasPermission('finance')"
            to="/finance" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/finance' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                <path d="M12 11v4"/>
                <path d="M8 11v4"/>
                <path d="M16 11v4"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">財務管理</span>
          </router-link>

          <router-link 
            v-if="permissionStore.hasPermission('reimbursement')"
            to="/reimbursement" 
            class="nav-item" 
            :class="{ 'active': $route.path.startsWith('/reimbursement') }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">請款</span>
          </router-link>
          
          <!-- 管理功能 -->
          <router-link 
            v-if="permissionStore.hasPermission('user_setting')"
            to="/user-setting" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/user-setting' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">用戶管理</span>
          </router-link>
          
          <router-link 
            v-if="permissionStore.hasPermission('basic_settings')"
            to="/basic-settings" 
            class="nav-item" 
            :class="{ 'active': $route.path === '/basic-settings' }"
          >
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </span>
            <span class="text" v-show="!isCollapsed">基礎設置</span>
          </router-link>
        </nav>
      </div>
      <!-- 移動端遮罩層 -->
      <div 
        class="sidebar-overlay" 
        :class="{ 'active': !isCollapsed }" 
        @click="toggleSidebar"
        v-show="isMobile && !isCollapsed"
      ></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from '../store'
import { usePermissionStore } from '../store/permission'

const store = useStore()
const permissionStore = usePermissionStore()
const systemName = computed(() => store.systemName)

const isCollapsed = ref(false)
const isMobile = ref(false)

const user = computed(() => store.user)

// 監聽權限更新事件
const handlePermissionsUpdate = async () => {
  if (user.value) {
    await permissionStore.loadPermissions(user.value.id)
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    isCollapsed.value = false
  }
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 監聽側邊欄狀態變化，更新父容器 class
watch(isCollapsed, (newValue) => {
  const app = document.querySelector('.app')
  if (app) {
    if (newValue) {
      app.classList.add('sidebar-collapsed')
    } else {
      app.classList.remove('sidebar-collapsed')
    }
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('permissions-updated', handlePermissionsUpdate)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('permissions-updated', handlePermissionsUpdate)
  // 清理 class
  const app = document.querySelector('.app')
  if (app) {
    app.classList.remove('sidebar-collapsed')
  }
})
</script>

<style lang="scss" scoped>
.sidebar-wrapper {
  position: relative;
  z-index: 1000;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  width: var(--sidebar-width);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    width: 280px;
    background: white;
    
    &:not(.collapsed) {
      transform: translateX(0);
    }
  }
  
  &.collapsed {
    width: var(--sidebar-width-collapsed);
    
    @media (max-width: 768px) {
      transform: translateX(-100%);
      width: 0;
      
      .nav-item {
        opacity: 0;
        visibility: hidden;
      }
    }
    
    .nav-item {
      padding: var(--spacing-sm);
      justify-content: center;
      
      .icon {
        margin: 0;
      }
      
      .text {
        display: none;
      }
    }
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.sidebar-header {
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-height);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    padding-left: calc(40px + var(--spacing-lg));
  }
  
  .logo {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-text);
    letter-spacing: -0.5px;
  }
}

.toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  padding: 0;
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 1001;
  
  @media (min-width: 769px) {
    position: static;
    width: 28px;
    height: 28px;
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  svg {
    width: 24px;
    height: 24px;
    
    @media (min-width: 769px) {
      width: 20px;
      height: 20px;
    }
  }
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 8px;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    
    .icon svg {
      stroke: white;
    }
  }
  
  .icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-sm);
    flex-shrink: 0;
    
    svg {
      width: 20px;
      height: 20px;
      stroke: var(--color-text);
      transition: stroke 0.2s ease;
    }
  }
  
  .text {
    font-weight: 450;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }
}
</style> 