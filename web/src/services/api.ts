import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 請求攔截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 響應攔截器
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password })
}

export const attendanceApi = {
  // 上班打卡
  checkIn: () => api.post('/attendance/check-in'),
  
  // 下班打卡
  checkOut: () => api.post('/attendance/check-out'),
  
  // 獲取個人打卡記錄
  getRecords: (startDate?: string, endDate?: string) => 
    api.get('/attendance/records', { 
      params: { startDate, endDate }
    }),
  
  // 管理員獲取所有打卡記錄
  getAllRecords: (startDate?: string, endDate?: string, userId?: number) => 
    api.get('/attendance/all-records', { 
      params: { startDate, endDate, userId }
    }),
  
  // 管理員獲取月度統計
  getMonthlyStats: (year: number, month: number) =>
    api.get('/attendance/monthly-stats', {
      params: { year, month }
    }),
  
  // 更新打卡記錄
  updateRecord: (id: number, data: { 
    date: string, 
    checkInTime: string, 
    checkOutTime?: string 
  }) => api.put(`/attendance/records/${id}`, data),
  
  // 刪除打卡記錄
  deleteRecord: (id: number) => api.delete(`/attendance/records/${id}`)
}

// 用戶管理 API
export const userApi = {
  // 獲取所有用戶
  getUsers: (search?: string) => api.get('/users', { params: { search } }),

  // 創建新用戶
  createUser: (data: { username: string; name: string; password: string; role?: string }) =>
    api.post('/users', data),

  // 更新用戶
  updateUser: (id: number, data: { name?: string; password?: string; role?: string }) =>
    api.put(`/users/${id}`, data),

  // 停用用戶
  deleteUser: (id: number) => api.delete(`/users/${id}`),

  // 永久刪除用戶
  removeUser: (id: number) => api.delete(`/users/${id}/remove`)
}

export default api 