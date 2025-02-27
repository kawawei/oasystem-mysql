import request from '@/utils/request'
import type { AxiosResponse } from 'axios'

// 定義收款記錄類型
export interface Receipt {
  id: number
  receiptNumber: string
  receiptDate: string
  amount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'OTHER'
  payer: string
  receiverId: number
  description: string
  attachments: Array<{
    fileName: string
    fileUrl: string
    uploadDate: string
    originalName?: string
  }>
  notes?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  receiver?: {
    id: number
    name: string
    email: string
  }
  // 前端額外需要的字段
  accountId?: number
  accountName?: string
  currency?: string
  paymentDate?: string
}

// 定義分頁響應類型
interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    pages: number
  }
}

// 定義 API 響應類型
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// 收款記錄 API 服務
const receiptApi = {
  // 獲取收款記錄列表
  getReceipts(params: {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<AxiosResponse<PaginatedResponse<Receipt>>> {
    return request.get('/receipts', { params })
  },

  // 獲取單個收款記錄
  getReceipt(id: number): Promise<AxiosResponse<ApiResponse<Receipt>>> {
    return request.get(`/receipts/${id}`)
  },

  // 創建收款記錄
  createReceipt(data: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt' | 'receiver'>): Promise<AxiosResponse<ApiResponse<Receipt>>> {
    return request.post('/receipts', data)
  },

  // 更新收款記錄
  updateReceipt(id: number, data: Partial<Receipt>): Promise<AxiosResponse<ApiResponse<Receipt>>> {
    return request.put(`/receipts/${id}`, data)
  },

  // 刪除收款記錄
  deleteReceipt(id: number): Promise<AxiosResponse<ApiResponse<void>>> {
    return request.delete(`/receipts/${id}`)
  },

  // 更新收款狀態
  updateReceiptStatus(id: number, status: Receipt['status']): Promise<AxiosResponse<ApiResponse<Receipt>>> {
    return request.patch(`/receipts/${id}/status`, { status })
  }
}

export default receiptApi 