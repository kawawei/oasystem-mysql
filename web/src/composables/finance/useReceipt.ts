// 引入所需的依賴 Import required dependencies
import { ref } from 'vue'
import { message } from '@/plugins/message'
import receiptApi from '@/services/api/receipt'
import { formatDate } from './useFinance'

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
  receiptDate: string // 修改為 receiptDate 以匹配實際使用 Changed to receiptDate to match actual usage
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

  // 格式化日期時間為台北時間 Format datetime to Taipei time
  const formatDateTimeToTaipei = (dateStr: string) => {
    if (!dateStr) return '-'
    return formatDate(dateStr)
  }

  // 獲取收款記錄 Get receipt records
  const fetchReceiptRecords = async () => {
    try {
      receiptLoading.value = true
      const response = await receiptApi.getReceipts({})
      if (response.data.success) {
        // 處理日期時間格式 Process datetime format
        receiptRecords.value = response.data.data.map((record: any): ReceiptRecord => ({
          id: Number(record.id),
          serialNumber: String(record.receiptNumber || ''),
          accountId: Number(record.accountId || 0),
          accountName: String(record.accountName || ''),
          currency: String(record.currency || 'TWD'),
          amount: Number(record.amount || 0),
          payer: String(record.payer || ''),
          receiptDate: formatDateTimeToTaipei(record.receiptDate || record.createdAt),
          status: record.status === 'CONFIRMED' ? 'completed' : 'pending',
          description: record.description || '',
          createdAt: formatDateTimeToTaipei(record.createdAt),
          attachments: (record.attachments || []).map((attachment: any) => ({
            filename: attachment.fileName,
            originalName: attachment.originalName || attachment.fileName,
            url: attachment.fileUrl
          }))
        }))
      }
    } catch (error) {
      console.error('Error fetching receipt records:', error)
      message.error('獲取收款記錄失敗')
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