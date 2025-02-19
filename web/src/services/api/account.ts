import request from '@/utils/request'
import type { Account, AccountTransaction } from '@/types/account'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const accountApi = {
  // 創建帳戶
  createAccount(data: {
    name: string
    currency: string
    initial_balance: number
  }) {
    return request.post<ApiResponse<Account>>('/accounts', data)
  },

  // 獲取帳戶列表
  getAccounts(params?: { includeDeleted?: boolean }) {
    return request.get<ApiResponse<Account[]>>('/accounts', { params })
  },

  // 獲取特定帳戶
  getAccount(id: number) {
    return request.get<ApiResponse<Account>>(`/accounts/${id}`)
  },

  // 更新帳戶餘額
  updateBalance(id: number, new_balance: number) {
    return request.patch<ApiResponse<void>>(`/accounts/${id}/balance`, { new_balance })
  },

  // 刪除帳戶（硬刪除）
  deleteAccount(id: number) {
    return request.delete<ApiResponse<void>>(`/accounts/${id}`)
  },

  // 停用帳戶（軟刪除）
  disableAccount(id: number) {
    return request.patch<ApiResponse<void>>(`/accounts/${id}/disable`)
  },

  // 啟用帳戶
  enableAccount(id: number) {
    return request.patch<ApiResponse<void>>(`/accounts/${id}/enable`)
  },

  // 獲取帳戶交易記錄
  getAccountTransactions(id: number) {
    return request.get<ApiResponse<AccountTransaction[]>>(`/accounts/${id}/transactions`)
  },

  // 檢查帳戶是否有交易記錄
  checkAccountTransactions(id: number) {
    return request.get<ApiResponse<{ hasTransactions: boolean }>>(`/accounts/${id}/check-transactions`)
  }
}
