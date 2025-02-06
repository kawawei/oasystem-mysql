import { computed } from 'vue'
import type { ReimbursementFormItem } from '@/services/api'

export function useExpenseItems(formData: any) {
  // 添加費用明細項
  const addExpenseItem = () => {
    formData.value.items.push({
      accountCode: '',
      accountName: '',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      invoiceImage: '',
      description: '',
      quantity: 1,
      amount: 0,
      tax: 0,
      fee: 0,
      total: 0
    } as ReimbursementFormItem)
  }

  // 移除費用明細項
  const removeExpenseItem = (index: number) => {
    formData.value.items.splice(index, 1)
  }

  // 移除發票圖片
  const removeInvoiceImage = (index: number) => {
    const currentItem = formData.value.items[index]
    if (currentItem) {
      currentItem.invoiceImage = ''
      delete (currentItem as any)._file
    }
  }

  // 計算總金額
  const totalAmount = computed(() => {
    return formData.value.items.reduce((sum: number, item: ReimbursementFormItem) => 
      sum + (Number(item.amount) || 0), 0)
  })

  // 計算總稅額
  const totalTax = computed(() => {
    return formData.value.items.reduce((sum: number, item: ReimbursementFormItem) => 
      sum + (Number(item.tax) || 0), 0)
  })

  // 計算總手續費
  const totalFee = computed(() => {
    return formData.value.items.reduce((sum: number, item: ReimbursementFormItem) => 
      sum + (Number(item.fee) || 0), 0)
  })

  // 計算總金額（含稅和手續費）
  const grandTotal = computed(() => {
    return totalAmount.value + totalTax.value + totalFee.value
  })

  // 格式化金額
  const formatAmount = (amount: number, currency: 'TWD' | 'CNY' = 'TWD') => {
    const symbols = {
      TWD: 'NT$',
      CNY: '¥'
    }
    return `${symbols[currency]} ${amount.toLocaleString()}`
  }

  return {
    addExpenseItem,
    removeExpenseItem,
    removeInvoiceImage,
    totalAmount,
    totalTax,
    totalFee,
    grandTotal,
    formatAmount
  }
} 