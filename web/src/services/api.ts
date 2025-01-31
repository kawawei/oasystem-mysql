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
  getMonthlyStats: (startDate: string, endDate: string, userId?: number) => {
    const params = new URLSearchParams()
    params.append('startDate', startDate)
    params.append('endDate', endDate)
    if (userId) {
      params.append('userId', userId.toString())
    }
    return api.get('/attendance/monthly-stats', {
      params: params
    })
  },
  
  // 更新打卡記錄
  updateRecord: (id: number, data: { 
    date: string, 
    checkInTime: string, 
    checkOutTime?: string,
    status?: 'in' | 'out'
  }) => api.put(`/attendance/records/${id}`, data),
  
  // 刪除打卡記錄
  deleteRecord: (id: number) => api.delete(`/attendance/records/${id}`)
}

export interface User {
  id: number
  username: string
  name: string
  role: string
  department?: string
  createdAt: string
  status: 'active' | 'inactive'
}

export interface CreateUserData {
  username: string
  name: string
  password: string
  role: string
  department?: string
}

export interface UpdateUserData {
  name?: string
  password?: string
  role?: string
  department?: string
  status?: 'active' | 'inactive'
}

// 用戶管理 API
export const userApi = {
  // 獲取所有用戶
  getUsers: (params?: { search?: string, self?: boolean }) => api.get('/users', { params }),

  // 創建新用戶
  createUser: (data: CreateUserData) => api.post('/users', data),

  // 更新用戶
  updateUser: (id: number, data: UpdateUserData) => api.put(`/users/${id}`, data),

  // 停用用戶
  deleteUser: (id: number) => api.delete(`/users/${id}`),

  // 永久刪除用戶
  removeUser: (id: number) => api.delete(`/users/${id}/remove`)
}

export interface Task {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignedTo: number
  createdBy: number
  dueDate: string
  completedAt?: string
  report?: string
  assignee?: {
    id: number
    username: string
    name: string
  }
  creator?: {
    id: number
    username: string
    name: string
  }
}

export interface CreateTaskData {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  assignedTo?: number
  dueDate?: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  report?: string
}

// 任務管理 API
export const taskApi = {
  // 獲取任務列表
  getTasks: (params?: {
    status?: string
    priority?: string
    assignedTo?: number
    createdBy?: number
    search?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  }) => api.get('/tasks', { params }),

  // 獲取單個任務
  getTask: (id: number) => api.get(`/tasks/${id}`),

  // 創建任務
  createTask: (data: CreateTaskData) => api.post('/tasks', data),

  // 更新任務
  updateTask: (id: number, data: UpdateTaskData) => api.put(`/tasks/${id}`, data),

  // 更新任務狀態
  updateTaskStatus: (id: number, status: string) => 
    api.patch(`/tasks/${id}/status`, { status }),

  // 刪除任務
  deleteTask: (id: number) => api.delete(`/tasks/${id}`),

  // 獲取任務統計
  getTaskStats: () => api.get('/tasks/stats')
}

// 獲取系統設置
export const getSettings = () => {
  return axios.get('/api/settings')
}

// 更新系統設置
export const updateSettings = (settings: {
  systemName: string
  systemDescription: string
  workStartTime: string
  workEndTime: string
  lateGracePeriod: number
  emailNotification: boolean
}) => {
  return axios.post('/api/settings', settings)
}

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.post('/settings', data)
}

export const permissionApi = {
  getUserPermissions: (userId: number) => api.get(`/permissions/${userId}`),
  updateUserPermissions: (userId: number, permissions: Record<string, boolean>) => 
    api.put(`/permissions/${userId}`, { permissions })
}

export default api 