<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!isCollapsed">OA System</div>
      <button class="toggle-btn" @click="toggleSidebar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 5l7 7-7 7M5 5l7 7-7 7" v-if="isCollapsed" />
          <path d="M19 12H5M11 19l-7-7 7-7" v-else />
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
      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isCollapsed = ref(false)
const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})
const isAdmin = computed(() => user.value?.role === 'admin')

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
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
  
  &.collapsed {
    width: var(--sidebar-width-collapsed);
    
    .toggle-icon {
      transform: rotate(180deg);
    }
    
    .nav-item {
      padding: var(--spacing-sm);
      justify-content: center;
      
      .icon {
        margin: 0;
      }
    }
  }
}

.sidebar-header {
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-height);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  .logo {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-text);
    letter-spacing: -0.5px;
  }
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .toggle-icon {
    width: 16px;
    height: 16px;
    position: relative;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &::before {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      border: 1.5px solid var(--color-text);
      border-left: 0;
      border-bottom: 0;
      transform: rotate(45deg);
      left: 2px;
      top: 4px;
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