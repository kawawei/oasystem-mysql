export interface ExpenseItem {
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

export interface ReimbursementRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  submitterId: number
  payee: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  reviewerId?: number
  reviewComment?: string
  reviewedAt?: string
  department?: string
  description?: string
  createdAt: string
  items: ExpenseItem[]
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