// 引入基礎組件
import { ref } from 'vue'
import type { Ref } from 'vue'

// 定義 emit 類型
interface Emits {
  (e: 'update:selectedReceipt', value: any): void
  (e: 'update:showReceiptDetailModal', value: boolean): void
}

// 定義 props
export interface ReceiptManagementProps {
  receiptRecords: any[]
  loading: boolean
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  viewReceiptDetail: (record: any) => void
  handleDeleteReceipt: (record: any) => void
  handleConfirmReceipt: (record: any) => void
  getCurrencySymbol: (currency: string) => string
  openImagePreview: (url: string) => void
  downloadAttachment: (file: any) => void
  selectedReceipt: any
  showReceiptDetailModal: boolean
  accounts: any[]
  createReceipt: () => Promise<void>
  resetReceiptForm: () => void
  receiptForm: any
  handleAccountChange: (value: string) => void
  triggerReceiptUpload: () => void
  handleReceiptFileSelected: (event: Event) => void
  removeReceiptAttachment: (index: number) => void
}

export default function useReceiptManagement(props: ReceiptManagementProps, emit: Emits) {
  // 關閉彈窗時清空選中的收款記錄
  const handleCloseModal = () => {
    emit('update:selectedReceipt', null)
    emit('update:showReceiptDetailModal', false)
  }

  // 新增收款相關
  const showReceiptModal: Ref<boolean> = ref(false)

  // 處理新增收款對話框關閉
  const handleCloseNewReceipt = () => {
    showReceiptModal.value = false
    props.resetReceiptForm()
  }

  // 處理創建收款
  const handleCreateReceipt = async () => {
    await props.createReceipt()
    if (showReceiptModal.value) {
      showReceiptModal.value = false
    }
  }

  // 打開新增收款對話框
  const openNewReceiptModal = () => {
    showReceiptModal.value = true
  }

  return {
    handleCloseModal,
    showReceiptModal,
    handleCloseNewReceipt,
    handleCreateReceipt,
    openNewReceiptModal
  }
} 