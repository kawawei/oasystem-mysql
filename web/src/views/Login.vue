<template>
  <div class="login-page">
    <div class="login-form">
      <h1>歡迎使用</h1>
      <p>請登入您的帳號</p>
      
      <div class="form-container">
        <div class="form-group">
          <input
            type="text"
            v-model="username"
            placeholder="用戶名"
          >
        </div>
        
        <div class="form-group">
          <input
            type="password"
            v-model="password"
            placeholder="密碼"
          >
        </div>
        
        <button 
          type="button"
          @click="handleLogin"
          :disabled="loading"
        >
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { authApi } from '../services/api'
import { useStore } from '../store'
import { usePermissionStore } from '../store/permission'

const router = useRouter()
const toast = useToast()
const store = useStore()
const permissionStore = usePermissionStore()
const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (loading.value) return
  if (!username.value || !password.value) {
    toast.error('請輸入用戶名和密碼')
    return
  }
  
  loading.value = true
  try {
    const { data } = await authApi.login(username.value, password.value)
    if (data.token && data.user) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      store.setUser(data.user)
      // 加載用戶權限
      await permissionStore.loadPermissions(data.user.id)
      toast.success('登入成功')
      setTimeout(() => {
        router.push('/home')
      }, 500)
    }
  } catch (error) {
    const errorMessage = (error as any).response?.data?.message || '登入失敗'
    toast.error(errorMessage)
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #fbfbfd, #f5f5f7);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-form {
  background: var(--color-background);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  text-align: center;
  margin: auto;
  
  h1 {
    font-size: 2rem;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text);
  }
  
  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
    
    input {
      width: 100%;
      height: 44px;
      background-color: #f5f5f7;
      border: none;
      border-radius: var(--radius-lg);
      padding: 0 var(--spacing-md);
      font-size: 1rem;
      
      &:focus {
        background-color: #fff;
        box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
        outline: none;
      }
    }
  }

  button {
    width: 100%;
    height: 44px;
    background-color: var(--color-primary);
    color: white;
    font-size: 1rem;
    margin-top: var(--spacing-lg);
    border-radius: var(--radius-lg);
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    
    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}
</style> 