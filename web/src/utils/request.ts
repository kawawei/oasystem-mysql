import axios from 'axios'
import { message } from '@/plugins/message'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true
})

// 請求攔截器
service.interceptors.request.use(
  (config) => {
    // 從 localStorage 獲取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    // 確保 headers 存在
    config.headers = config.headers || {}
    // 添加其他必要的 headers
    config.headers['Content-Type'] = 'application/json'
    config.headers['X-Requested-With'] = 'XMLHttpRequest'

    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL
    })
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// 響應攔截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success === false) {
      console.error('API error response:', {
        status: response.status,
        data: res,
        config: {
          url: response.config.url,
          method: response.config.method
        }
      })
      message.error(res.message || '請求失敗')
      return Promise.reject(new Error(res.message || '請求失敗'))
    }
    return res
  },
  async (error) => {
    console.error('Response interceptor error:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    })
    
    // 如果是網絡錯誤且配置中沒有重試標記，則重試一次
    if (error.code === 'ERR_NETWORK' && !error.config?.__isRetry) {
      try {
        const config = error.config
        config.__isRetry = true
        console.log('Retrying request due to network error...')
        return await service(config)
      } catch (retryError) {
        console.error('Retry failed:', retryError)
        message.error('網絡連接失敗，請檢查網絡設置')
        return Promise.reject(retryError)
      }
    }
    
    // 處理特定錯誤
    if (error.code === 'ERR_NETWORK') {
      message.error('網絡連接失敗，請檢查網絡設置')
    } else if (error.response?.status === 401) {
      message.error('登錄已過期，請重新登錄')
      // 可以在這裡處理登出邏輯
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      message.error('沒有權限執行此操作')
    } else if (error.response?.status === 404) {
      message.error('請求的資源不存在')
    } else if (error.response?.status === 500) {
      message.error('服務器錯誤，請稍後重試')
    } else {
      message.error(error.response?.data?.message || `請求失敗: ${error.message}`)
    }
    return Promise.reject(error)
  }
)

export default service
