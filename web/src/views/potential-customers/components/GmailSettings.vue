# Gmail 設置組件 - 用於管理 Gmail 授權
<template>
  <div class="gmail-settings">
    <div class="settings-card">
      <h3>Gmail 授權設置</h3>
      
      <div v-if="loading" class="loading-state">
        <el-icon class="loading"><Loading /></el-icon>
        <p>加載中...</p>
      </div>
      
      <template v-else>
        <!-- 授權狀態 -->
        <div class="auth-status">
          <div class="status-row">
            <span class="label">授權狀態：</span>
            <span class="value" :class="{ 'authorized': isAuthorized }">
              {{ isAuthorized ? '已授權' : '未授權' }}
            </span>
          </div>
          
          <template v-if="isAuthorized">
            <div class="status-row">
              <span class="label">授權帳號：</span>
              <span class="value">{{ authEmail }}</span>
            </div>
          </template>
        </div>

        <!-- 操作按鈕 -->
        <div class="actions">
          <base-button 
            v-if="!isAuthorized"
            type="primary"
            @click="handleAuthorize"
          >
            授權 Gmail 帳號
          </base-button>
          <base-button 
            v-else
            type="danger"
            @click="handleRemoveAuth"
          >
            移除授權
          </base-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import BaseButton from '@/common/base/Button.vue'
import { message } from '@/plugins/message'

const loading = ref(true)
const isAuthorized = ref(false)
const authEmail = ref('')

// 檢查授權狀態
const checkAuthStatus = async () => {
  try {
    loading.value = true
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/gmail/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('獲取授權狀態失敗')
    }

    const { data } = await response.json()
    isAuthorized.value = data.isAuthorized
    authEmail.value = data.email || ''
  } catch (error) {
    console.error('Error checking auth status:', error)
    message.error('獲取授權狀態失敗')
  } finally {
    loading.value = false
  }
}

// 處理授權
const handleAuthorize = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/gmail/auth-url`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('獲取授權URL失敗')
    }

    const { data } = await response.json()
    // 在新窗口中打開授權頁面
    const authWindow = window.open(data.url, 'gmail-auth', 'width=600,height=600')
    
    // 檢查授權窗口是否已關閉
    const checkWindow = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkWindow)
        checkAuthStatus()
      }
    }, 1000)
  } catch (error) {
    console.error('Error getting auth URL:', error)
    message.error('獲取授權URL失敗')
  }
}

// 處理移除授權
const handleRemoveAuth = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/gmail/auth`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || '移除授權失敗')
    }

    message.success('Gmail 授權已移除')
    await checkAuthStatus()
  } catch (error) {
    console.error('Error removing auth:', error)
    message.error(error instanceof Error ? error.message : '移除授權失敗')
  }
}

onMounted(() => {
  checkAuthStatus()
})
</script>

<style lang="scss" scoped>
.gmail-settings {
  padding: 20px;

  .settings-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 24px;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;

    .el-icon {
      font-size: 24px;
      color: #409eff;
      animation: rotating 2s linear infinite;
    }

    p {
      margin-top: 16px;
      color: #606266;
    }
  }

  .auth-status {
    margin-bottom: 24px;

    .status-row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 100px;
        color: #606266;
      }

      .value {
        color: #f56c6c;

        &.authorized {
          color: #67c23a;
        }
      }
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 