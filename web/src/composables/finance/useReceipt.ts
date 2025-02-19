// 引入所需的依賴 Import required dependencies
import { ref } from 'vue'
import { message } from '@/plugins/message'
import receiptApi from '@/services/api/receipt'

// 定義附件類型 Define attachment type
interface ReceiptAttachment {
  fileName: string
  fileUrl: string
  uploadDate?: string
  originalName?: string
}

// 定義收款表單類型 Define receipt form type
interface ReceiptForm {
  serialNumber: string
  title: string
  accountId: string
  accountName: string
  amount: string
  currency: string
  paymentDate: string
  payer: string
  description: string
  attachments: Array<{
    filename: string
    originalName: string
    url: string
    file?: File
  }>
}

// 定義收款記錄類型 Define receipt record type
interface ReceiptRecord {
  id: number
  serialNumber: string
  accountId: number
  accountName: string
  currency: string
  amount: number
  payer: string
  paymentDate: string
  status: 'pending' | 'completed' // 待收款 | 已收款 Pending | Completed
  description?: string
  createdAt: string
  attachments?: Array<{
    filename: string
    originalName: string
    url: string
  }>
}

// 導出收款管理的可組合函數 Export receipt management composable
export default function useReceipt() {
  // 狀態管理 State management
  const showReceiptModal = ref(false)
  const receiptRecords = ref<ReceiptRecord[]>([])
  const receiptLoading = ref(false)
  const receiptForm = ref<ReceiptForm>({
    serialNumber: '',
    title: '',
    accountId: '',
    accountName: '',
    amount: '',
    currency: 'TWD',
    paymentDate: '',
    payer: '',
    description: '',
    attachments: []
  })

  // 文件上傳相關 File upload related
  const receiptFileInput = ref<HTMLInputElement | null>(null)
  const showImagePreview = ref(false)
  const previewImageUrl = ref('')

  // 收款詳情相關 Receipt detail related
  const showReceiptDetailModal = ref(false)
  const selectedReceipt = ref<ReceiptRecord | null>(null)

  // 獲取收款記錄 Get receipt records
  const fetchReceiptRecords = async () => {
    receiptLoading.value = true
    try {
      const response = await receiptApi.getReceipts({})
      // 檢查響應數據格式 Check response data format
      const receiptsData = Array.isArray(response.data) ? response.data : 
                          (response.data.success ? response.data.data : [])
      
      // 將 API 返回的數據轉換為前端需要的格式 Transform API response data to frontend format
      receiptRecords.value = receiptsData.map(receipt => ({
        id: receipt.id,
        serialNumber: receipt.receiptNumber,
        accountId: receipt.accountId || 0,
        accountName: receipt.accountName || '',
        currency: receipt.currency || 'TWD',
        amount: receipt.amount || 0,
        payer: receipt.payer || '',
        paymentDate: receipt.receiptDate || receipt.createdAt || new Date().toISOString(),
        status: receipt.status === 'CONFIRMED' ? 'completed' : 'pending',
        description: receipt.description || '',
        createdAt: receipt.createdAt || new Date().toISOString(),
        attachments: (receipt.attachments || []).map((attachment: ReceiptAttachment) => ({
          filename: attachment.fileName,
          originalName: attachment.originalName || attachment.fileName,
          url: attachment.fileUrl
        }))
      }))
      console.log('Fetched and transformed receipt records:', receiptRecords.value)
    } catch (error) {
      console.error('Error fetching receipt records:', error)
      message.error('獲取收款記錄失敗')
      receiptRecords.value = []
    } finally {
      receiptLoading.value = false
    }
  }

  // 重置收款表單 Reset receipt form
  const resetReceiptForm = () => {
    receiptForm.value = {
      serialNumber: '',
      title: '',
      accountId: '',
      accountName: '',
      amount: '',
      currency: 'TWD',
      paymentDate: '',
      payer: '',
      description: '',
      attachments: []
    }
  }

  // 創建收款記錄 Create receipt record
  const createReceipt = async () => {
    try {
      // 表單驗證 Form validation
      if (!receiptForm.value.accountId) {
        message.error('請選擇收款帳戶')
        return
      }
      if (!receiptForm.value.amount || isNaN(Number(receiptForm.value.amount))) {
        message.error('請輸入有效的收款金額')
        return
      }
      if (!receiptForm.value.paymentDate) {
        message.error('請選擇收款日期')
        return
      }
      if (!receiptForm.value.payer) {
        message.error('請輸入付款方')
        return
      }

      // 構建請求數據 Build request data
      const requestData = {
        receiptDate: receiptForm.value.paymentDate,
        amount: Number(receiptForm.value.amount),
        paymentMethod: 'BANK_TRANSFER' as const,
        payer: receiptForm.value.payer,
        description: receiptForm.value.description || '',
        accountId: Number(receiptForm.value.accountId),
        attachments: (receiptForm.value.attachments || []).map(attachment => ({
          fileName: attachment.filename,
          fileUrl: attachment.url,
          uploadDate: new Date().toISOString(),
          originalName: attachment.originalName
        })),
        notes: '',
        status: 'PENDING' as const,
        receiverId: 0
      }

      // 調用後端 API 創建收款記錄 Call backend API to create receipt record
      const response = await receiptApi.createReceipt(requestData)
      
      if (response.data.success) {
        message.success('新增收款成功')
        showReceiptModal.value = false
        resetReceiptForm()
        // 重新獲取收款記錄列表 Refresh receipt records list
        await fetchReceiptRecords()
      } else {
        message.error(response.data.message || '新增收款失敗')
      }
    } catch (error: any) {
      console.error('Error creating receipt:', error)
      message.error(error.response?.data?.message || '新增收款失敗')
    }
  }

  // 確認收款 Confirm receipt
  const handleConfirmReceipt = async (receipt: ReceiptRecord) => {
    try {
      const response = await receiptApi.updateReceiptStatus(receipt.id, 'CONFIRMED')
      if (response.data.success) {
        message.success('確認收款成功')
        await fetchReceiptRecords()
      } else {
        message.error('確認收款失敗')
      }
    } catch (error) {
      console.error('Error confirming receipt:', error)
      message.error('確認收款失敗')
    }
  }

  // 查看收款詳情 View receipt detail
  const viewReceiptDetail = (receipt: ReceiptRecord) => {
    selectedReceipt.value = receipt
    showReceiptDetailModal.value = true
  }

  // 觸發文件上傳 Trigger file upload
  const triggerReceiptUpload = () => {
    receiptFileInput.value?.click()
  }

  // 處理文件選擇 Handle file selection
  const handleReceiptFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]
    try {
      // TODO: 實現文件上傳到伺服器的邏輯 Implement file upload to server logic
      const formData = new FormData()
      formData.append('file', file)
      
      // 模擬上傳成功 Simulate upload success
      const fileUrl = URL.createObjectURL(file)
      receiptForm.value.attachments.push({
        filename: file.name,
        originalName: file.name,
        url: fileUrl,
        file
      })
      
      message.success('文件上傳成功')
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error('文件上傳失敗')
    } finally {
      // 清空 input Clear input
      input.value = ''
    }
  }

  // 移除附件 Remove attachment
  const removeReceiptAttachment = (index: number) => {
    const attachment = receiptForm.value.attachments[index]
    if (attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
    receiptForm.value.attachments.splice(index, 1)
  }

  // 預覽圖片 Preview image
  const openImagePreview = (url: string) => {
    previewImageUrl.value = url
    showImagePreview.value = true
  }

  // 刪除收款記錄 Delete receipt record
  const handleDeleteReceipt = async (receipt: ReceiptRecord) => {
    try {
      const response = await receiptApi.deleteReceipt(receipt.id)
      if (response.data.success) {
        message.success('刪除收款記錄成功')
        await fetchReceiptRecords()
      } else {
        message.error(response.data.message || '刪除收款記錄失敗')
      }
    } catch (error) {
      console.error('Error deleting receipt:', error)
      message.error('刪除收款記錄失敗')
    }
  }

  return {
    // 狀態 State
    showReceiptModal,
    receiptRecords,
    receiptLoading,
    receiptForm,
    receiptFileInput,
    showImagePreview,
    previewImageUrl,
    showReceiptDetailModal,
    selectedReceipt,

    // 方法 Methods
    fetchReceiptRecords,
    resetReceiptForm,
    createReceipt,
    handleConfirmReceipt,
    viewReceiptDetail,
    triggerReceiptUpload,
    handleReceiptFileSelected,
    removeReceiptAttachment,
    openImagePreview,
    handleDeleteReceipt
  }
} 