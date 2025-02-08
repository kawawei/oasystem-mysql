import axios from 'axios'
import { message } from '@/plugins/message'

const service = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:3001/api' : '/api',
  timeout: 5000
})

// 請求攔截器
service.interceptors.request.use(
  (config) => {
    // 從 localStorage 獲取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 響應攔截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success === false) {
      message.error(res.message || '請求失敗')
      return Promise.reject(new Error(res.message || '請求失敗'))
    }
    return res
  },
  (error) => {
    console.error('Response error:', error)
    message.error(error.response?.data?.message || '請求失敗')
    return Promise.reject(error)
  }
)

export default service
