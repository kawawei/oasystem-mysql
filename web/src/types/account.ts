export interface Account {
  id: number
  name: string
  currency: string
  initialBalance: string | number
  currentBalance: string | number
  createdAt: string
  updatedAt: string
  is_deleted?: boolean
  deleted_at?: string
  deleted_by?: number
  last_transaction_date?: string
  hasTransactions?: boolean
}

export interface AccountTransaction {
  id: number
  date: string
  type: 'income' | 'expense'
  amount: number
  balance: number
  description: string
  sourceType?: 'reimbursement' | 'payable' | 'manual'
  sourceId?: number
}

export type AccountActionType = 'enable' | 'disable' | 'delete'
