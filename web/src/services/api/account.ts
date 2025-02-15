import request from '@/utils/request'
import type { Account, AccountTransaction } from '@/types/account'

export const accountApi = {
  // 創建帳戶
  createAccount(data: {
    name: string
    currency: string
    initial_balance: number
  }) {
    return request.post<Account>('/accounts', data)
  },

  // 獲取帳戶列表
  getAccounts() {
    return request.get<Account[]>('/accounts')
  },

  // 獲取特定帳戶
  getAccount(id: number) {
    return request.get<Account>(`/accounts/${id}`)
  },

  // 更新帳戶餘額
  updateBalance(id: number, new_balance: number) {
    return request.patch<void>(`/accounts/${id}/balance`, { new_balance })
  },

  // 刪除帳戶（硬刪除）
  deleteAccount(id: number) {
    return request.delete<void>(`/accounts/${id}`)
  },

  // 停用帳戶（軟刪除）
  disableAccount(id: number) {
    return request.patch<void>(`/accounts/${id}/disable`)
  },

  // 啟用帳戶
  enableAccount(id: number) {
    return request.patch<void>(`/accounts/${id}/enable`)
  },

  // 獲取帳戶交易記錄
  getAccountTransactions(id: number) {
    return request.get<AccountTransaction[]>(`/accounts/${id}/transactions`)
  },

  // 檢查帳戶是否有交易記錄
  checkAccountTransactions(id: number) {
    return request.get<{ hasTransactions: boolean }>(`/accounts/${id}/check-transactions`)
  }
}
