import type { ReimbursementStatus } from '@/services/api'

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
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
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
  items: ExpenseItem[]
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

export interface Reimbursement {
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
  submitter?: {
    id: number
    name: string
    username: string
    department?: string
  }
  paymentTarget: string
  accountNumber: string
  bankInfo: string
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
  attachments: Array<{
    filename: string
    originalName: string
    url: string
  }> | null
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
  attachments: Array<{
    filename: string
    originalName: string
    url: string
    file?: File
  }>
} 