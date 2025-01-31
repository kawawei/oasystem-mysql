<template>
  <div class="main-layout">
    <Sidebar class="side-menu" />
    <div class="main-content">
      <div class="top-bar">
        <div class="user-info" v-if="user">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role">{{ user.role === 'admin' ? '管理員' : '一般用戶' }}</span>
          <button class="logout-btn" @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>登出</span>
          </button>
        </div>
      </div>
      <div class="content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../store'
import { usePermissionStore } from '../store/permission'
import Sidebar from '../components/Sidebar.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const store = useStore()
const permissionStore = usePermissionStore()
const toast = useToast()

const user = computed(() => store.user)

const handleLogout = () => {
  // 清除用戶信息和權限
  localStorage.removeItem('token')
  store.setUser(null)
  permissionStore.clearPermissions()
  
  // 跳轉到登錄頁
  router.push('/login')
  toast.success('已登出')
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background-light);

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .top-bar {
      height: 64px;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 var(--spacing-lg);

      .user-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);

        .user-name {
          font-weight: 500;
        }

        .user-role {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          background: var(--color-background-light);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: none;
          background: none;
          color: var(--color-danger);
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;

          svg {
            width: 16px;
            height: 16px;
          }

          &:hover {
            background: var(--color-danger-light);
          }
        }
      }
    }

    .content {
      flex: 1;
      padding: var(--spacing-lg);
      overflow-y: auto;
    }
  }
}
</style> 