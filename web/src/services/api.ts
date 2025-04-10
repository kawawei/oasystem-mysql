import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
  department?: string | null
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

export interface Post {
  id: number
  title: string
  content: string
  platform: 'facebook' | 'instagram'
  postTime: string
  status: 'pending' | 'revision' | 'approved' | 'published'
  reviewerId: number
  mediaFiles: string[]
  reviewComment?: string
  reviewer?: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreatePostData {
  title: string
  content: string
  platform: 'facebook' | 'instagram'
  postDate: string
  postTime: string
  reviewerId: number
  mediaFiles: string[]
}

export interface UpdatePostData extends Partial<CreatePostData> {
  status?: 'pending' | 'revision' | 'approved' | 'published'
  reviewComment?: string
}

export const postApi = {
  // 獲取貼文列表
  getPosts: () => api.get('/posts'),
  
  // 獲取單個貼文
  getPost: (id: number) => api.get<Post>(`/posts/${id}`),
  
  // 創建貼文
  createPost: (data: CreatePostData) => api.post('/posts', data),
  
  // 更新貼文
  updatePost: (id: number, data: any) => api.put(`/posts/${id}`, data),
  
  // 刪除貼文
  deletePost: (id: number) => api.delete(`/posts/${id}`),
  
  // 上傳媒體文件
  uploadFiles: (files: FormData) => api.post('/posts/upload', files, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // 刪除媒體文件
  deleteFile: (filename: string) => api.delete(`/posts/files/${filename}`)
}

export interface ReimbursementItem {
  id?: number
  accountCode: string
  accountName: string
  date: string
  description: string
  quantity: number
  amount: number
  tax?: number
  fee?: number
  total: number
  invoiceNumber?: string
  invoiceImage?: string
}

export type ReimbursementStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'

export interface ReimbursementRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: ReimbursementStatus
  submitterId: number
  payee: string
  createdAt: string
}

export interface Reimbursement {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  submitterId: number
  payee: string
  paymentTarget: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  reviewerId?: number
  reviewComment?: string
  reviewedAt?: string
  department?: string
  description?: string
  createdAt: string
  items: ReimbursementItem[]
  attachments: Array<{
    filename: string
    originalName: string
    url: string
  }> | null
  submitter?: {
    id: number
    name: string
    username: string
    department?: string
  }
  reviewer?: {
    id: number
    name: string
    username: string
  }
}

export interface CreateReimbursementData {
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: ReimbursementStatus
  submitterId: number
  payee: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  department?: string
  description?: string
  items: Array<{
    accountCode: string
    accountName: string
    date: string
    description: string
    quantity: number
    amount: number
    tax?: number
    fee?: number
    total: number
    invoiceNumber?: string
    invoiceImage?: string
  }>
}

export interface UpdateReimbursementData extends Partial<CreateReimbursementData> {
  status?: ReimbursementStatus
  reviewComment?: string
}

// 請款管理 API
export const reimbursementApi = {
  // 獲取請款列表
  getReimbursements: (params?: { 
    status?: ReimbursementStatus | ReimbursementStatus[]
    page?: number
    limit?: number
  }) => {
    return api.get<ListResponse<Reimbursement>>('/reimbursements', { params })
  },

  // 獲取請款詳情
  getReimbursement: (id: number) => {
    return api.get<Reimbursement>(`/reimbursements/${id}`)
  },

  // 獲取當天序號
  getTodaySerialNumber: (type: 'reimbursement' | 'payable') => {
    return api.get<{ serialNumber: string }>('/reimbursements/next-serial-number', { params: { type } })
  },

  // 創建請款單
  createReimbursement: (data: FormData) => {
    return api.post<Reimbursement>('/reimbursements', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 更新請款單
  updateReimbursement: (id: number, data: Partial<ReimbursementRecord>) => {
    return api.put<ReimbursementRecord>(`/reimbursements/${id}`, data)
  },

  // 審核請款單
  reviewReimbursement: (id: number, data: { 
    status: 'submitted' | 'approved' | 'rejected' | 'paid'
    reviewComment?: string
    bankInfo?: string
    accountId?: number | string
    accountCode?: string
    accountName?: string
    items?: Array<{
      id: number
      accountCode: string
      accountName: string
    }>
  }) => {
    return api.post<Reimbursement>(`/reimbursements/${id}/review`, data)
  },

  // 刪除請款單
  deleteReimbursement: (id: number) => {
    return api.delete<void>(`/reimbursements/${id}`)
  }
}

interface UploadResponse {
  success: boolean
  data: {
    filename: string
    url: string
    originalName: string
    mimeType: string
    size: number
    isTemp?: boolean
  }
}

interface DeleteResponse {
  success: boolean
  message: string
}

export const uploadApi = {
  // 上傳文件到暫存區
  uploadToTemp: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<UploadResponse>('/upload?temp=true', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 刪除文件
  deleteFile: async (path: string): Promise<DeleteResponse> => {
    const response = await api.delete<DeleteResponse>(`/upload/${path}`)
    return response.data
  }
}

interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ReimbursementFormItem {
  accountCode: string
  accountName: string
  date: string
  description: string
  quantity: number
  amount: number
  tax: number
  fee: number
  total: number
  invoiceNumber: string
  invoiceImage: string
  _file?: File
}

export interface ReimbursementFormData {
  type: 'reimbursement' | 'payable'
  serialNumber: string
  title: string
  payee: string
  paymentTarget: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  currency: 'TWD' | 'CNY'
  items: ReimbursementFormItem[]
  attachments: Array<{
    filename: string
    url: string
    originalName: string
    file?: File
  }>
}

// 業務人員區域相關類型
// Business user area related types
export interface BusinessArea {
  city: string
  district: string
}

// 業務人員區域管理 API
// Business user area management API
export const businessAreaApi = {
  // 獲取業務人員負責區域
  // Get business user's areas
  getBusinessUserAreas: (userId: number) => api.get(`/business-areas/users/${userId}/areas`),

  // 更新業務人員負責區域
  // Update business user's areas
  updateBusinessUserAreas: (userId: number, areas: BusinessArea[]) => 
    api.put(`/business-areas/users/${userId}/areas`, { areas })
}

export default api