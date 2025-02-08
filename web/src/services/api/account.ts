import request from '@/utils/request'
import type { Account } from '@/types/account'

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

  // 刪除帳戶
  deleteAccount(id: number) {
    return request.delete<void>(`/accounts/${id}`)
  }
}
