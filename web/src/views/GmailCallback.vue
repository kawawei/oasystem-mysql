# Gmail OAuth 回調處理頁面
<template>
  <div class="gmail-callback-page">
    <div class="callback-status">
      <div v-if="loading" class="loading-status">
        <el-icon class="loading"><Loading /></el-icon>
        <p>正在處理 Gmail 授權...</p>
      </div>
      <div v-else-if="error" class="error-status">
        <el-icon><CircleClose /></el-icon>
        <p>{{ error }}</p>
        <base-button @click="handleClose">關閉</base-button>
      </div>
      <div v-else class="success-status">
        <el-icon><CircleCheck /></el-icon>
        <p>Gmail 授權成功！</p>
        <base-button @click="handleClose">關閉</base-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import BaseButton from '@/common/base/Button.vue'

const route = useRoute()
const loading = ref(true)
const error = ref('')

// 處理授權回調
const handleCallback = async () => {
  try {
    const code = route.query.code as string
    if (!code) {
      throw new Error('未收到授權碼')
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/gmail/callback?code=${code}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || '授權處理失敗')
    }

    loading.value = false
  } catch (e) {
    loading.value = false
    error.value = e instanceof Error ? e.message : '授權處理失敗'
  }
}

// 關閉回調窗口
const handleClose = () => {
  window.close()
}

onMounted(() => {
  handleCallback()
})
</script>

<style lang="scss" scoped>
.gmail-callback-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;

  .callback-status {
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    text-align: center;

    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .loading-status {
      .el-icon {
        color: #409eff;
        animation: rotating 2s linear infinite;
      }
    }

    .success-status .el-icon {
      color: #67c23a;
    }

    .error-status .el-icon {
      color: #f56c6c;
    }

    p {
      margin: 16px 0;
      font-size: 16px;
    }
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