<template>
    <div class="sidebar-wrapper">
      <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-header">
          <div class="logo" v-show="!isCollapsed">OA System</div>
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
          
          <!-- 管理員看到的考勤管理 -->
          <template v-if="isAdmin">
            <router-link 
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
            <router-link v-if="isAdmin" to="/user-setting" class="nav-item" :class="{ 'active': $route.path === '/user-setting' }">
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
            <router-link v-if="isAdmin" to="/basic-settings" class="nav-item" :class="{ 'active': $route.path === '/basic-settings' }">
              <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </span>
              <span class="text" v-show="!isCollapsed">基礎設置</span>
            </router-link>
          </template>
          
          <!-- 普通用戶看到的打卡記錄 -->
          <template v-else>
            <router-link 
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
            <router-link 
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
          </template>
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

const isCollapsed = ref(false)
const isMobile = ref(false)

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const isAdmin = computed(() => user.value?.role === 'admin')

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
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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