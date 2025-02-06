import { ref, computed } from 'vue'
import { reimbursementApi, uploadApi } from '@/services/api'
import { message } from '@/plugins/message'
import type { ReimbursementRecord, ExpenseItem } from '@/types/reimbursement'

export function useReimbursementDetail(id: string | number) {
  const isProcessing = ref(false)
  const isLoading = ref(false)
  const isEditing = ref(false)
  const editingData = ref<ReimbursementRecord | null>(null)
  const currentUploadIndex = ref<number>(-1)
  const uploading = ref(false)
  const record = ref<ReimbursementRecord | null>(null)

  // 駁回相關
  const showRejectModal = ref(false)
  const rejectComment = ref('')

  // 圖片預覽相關
  const showImagePreview = ref(false)
  const previewImageUrl = ref('')

  // PDF 預覽相關
  const showPdfPreview = ref(false)
  const pdfPreviewUrl = ref('')
  const isPrinting = ref(false)

  // 文件上傳相關
  const pdfFileInput = ref<HTMLInputElement | null>(null)

  // 追踪待刪除的文件
  const pendingDeleteFiles = ref<string[]>([])

  // 獲取請款詳情
  const fetchReimbursementDetail = async () => {
    console.log('開始獲取數據')
    isLoading.value = true
    try {
      const { data } = await reimbursementApi.getReimbursement(Number(id))
      console.log('請款詳情數據:', data)
      // 格式化單號，將 RB/PB 改為 A/B
      record.value = {
        ...data,
        attachments: data.attachments || [], // 確保 attachments 為空時設為空數組
        serialNumber: data.serialNumber.replace(/^[PR]B/, (match: string) => 
          match === 'RB' ? 'A' : 'B'  // RB（請款）改為 A，PB（應付）改為 B
        )
      }
    } catch (error) {
      console.error('Error fetching reimbursement:', error)
      message.error('獲取請款詳情失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 格式化狀態文字
  const getStatusText = (status: ReimbursementRecord['status'] | undefined) => {
    const statusMap: Record<ReimbursementRecord['status'], string> = {
      pending: '待提交',
      submitted: '待審核',
      approved: '已通過',
      rejected: '已拒絕'
    }
    return status ? statusMap[status] : ''
  }

  // 格式化金額
  const formatAmount = (amount: number | undefined | null, currency?: 'TWD' | 'CNY') => {
    const numAmount = Number(amount) || 0
    const currentCurrency = currency || (isEditing.value ? editingData.value?.currency : record.value?.currency) || 'TWD'
    const prefix = currentCurrency === 'TWD' ? 'NT$' : '¥'
    return `${prefix} ${formatNumberByCurrency(numAmount, currentCurrency)}`
  }

  // 格式化日期
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-TW')
  }

  // 判斷當前用戶是否可以編輯
  const canEdit = computed(() => {
    if (!record.value) return false
    return record.value.status === 'pending'
  })

  // 處理編輯
  const handleEdit = () => {
    if (!record.value) return
    editingData.value = JSON.parse(JSON.stringify(record.value))
    isEditing.value = true
    // 重置待刪除文件列表
    pendingDeleteFiles.value = []
  }

  // 處理取消
  const handleCancel = () => {
    isEditing.value = false
    editingData.value = null
    // 清空待刪除文件列表
    pendingDeleteFiles.value = []
  }

  // 處理確認
  const handleConfirm = async () => {
    if (!editingData.value) return
    
    isProcessing.value = true
    try {
      // 先更新請款單
      const updateData = {
        ...editingData.value,
        attachments: editingData.value.attachments?.length ? editingData.value.attachments : null
      }
      await reimbursementApi.updateReimbursement(editingData.value.id, updateData)
      
      // 更新成功後，刪除標記為待刪除的文件
      for (const filePath of pendingDeleteFiles.value) {
        try {
          await uploadApi.deleteFile(filePath)
        } catch (error) {
          console.error('刪除文件失敗:', error)
          // 繼續處理其他文件
        }
      }

      message.success('更新成功')
      // 清空當前記錄，以確保重新獲取時能正確顯示
      record.value = null
      await fetchReimbursementDetail()
      isEditing.value = false
      editingData.value = null
      // 清空待刪除文件列表
      pendingDeleteFiles.value = []
    } catch (error) {
      console.error('Error updating reimbursement:', error)
      message.error('更新失敗')
    } finally {
      isProcessing.value = false
    }
  }

  // 處理文件上傳
  const handleFileChange = async (event: Event, index: number) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]
    if (!file.type.startsWith('image/')) {
      message.error('請上傳圖片文件')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      message.error('文件大小不能超過 20MB')
      return
    }

    if (!editingData.value?.items) return
    
    try {
      uploading.value = true
      currentUploadIndex.value = index
      
      if (!record.value) {
        throw new Error('Record not found')
      }

      const result = await uploadApi.uploadToTemp(file)
      
      // 使用服務器返回的 URL
      editingData.value.items[index].invoiceImage = result.data.url
      message.success('上傳成功')
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error('上傳失敗')
    } finally {
      uploading.value = false
      if (input) {
        input.value = ''
      }
    }
  }

  // 更新明細項
  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    if (!editingData.value) return

    const item = editingData.value.items[index] as ExpenseItem

    switch (field) {
      case 'quantity':
      case 'amount':
      case 'tax':
      case 'fee':
        const numValue = Number(value) || 0
        item[field] = numValue

        // 更新總計
        const amount = Number(item.amount) || 0
        const tax = Number(item.tax) || 0
        const fee = Number(item.fee) || 0
        item.total = amount + tax + fee
        break

      case 'accountCode':
      case 'accountName':
      case 'date':
      case 'description':
      case 'invoiceNumber':
      case 'invoiceImage':
        item[field] = value as string
        break
    }
  }

  // 處理提交
  const handleSubmit = async () => {
    if (!record.value) return
    
    isProcessing.value = true
    try {
      await reimbursementApi.reviewReimbursement(record.value.id, {
        status: 'submitted',
        reviewComment: '提交審核'
      })
      message.success('提交成功')
      await fetchReimbursementDetail()
    } catch (error) {
      console.error('Error submitting reimbursement:', error)
      message.error('提交失敗')
    } finally {
      isProcessing.value = false
    }
  }

  // 計算總金額
  const totalAmount = computed(() => {
    const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
    if (!items) return 0
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  })

  // 計算總稅額
  const totalTax = computed(() => {
    const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
    if (!items) return 0
    return items.reduce((sum, item) => sum + (Number(item.tax) || 0), 0)
  })

  // 計算總手續費
  const totalFee = computed(() => {
    const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
    if (!items) return 0
    return items.reduce((sum, item) => sum + (Number(item.fee) || 0), 0)
  })

  // 計算總計
  const grandTotal = computed(() => {
    return totalAmount.value + totalTax.value + totalFee.value
  })

  // 格式化數字
  const formatNumberByCurrency = (number: number | undefined | null, currency: 'TWD' | 'CNY') => {
    const num = Number(number) || 0
    
    if (currency === 'TWD') {
      return Math.round(num).toLocaleString()
    }
    return num.toFixed(2)
  }

  // 添加費用明細項
  const addExpenseItem = () => {
    if (!editingData.value) return
    
    editingData.value.items.push({
      accountCode: '',
      accountName: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      quantity: 1,
      amount: 0,
      tax: 0,
      fee: 0,
      total: 0,
      invoiceNumber: '',
      invoiceImage: ''
    })
  }

  // 移除費用明細項
  const removeExpenseItem = (index: number) => {
    if (!editingData.value) return
    editingData.value.items.splice(index, 1)
  }

  // 處理通過
  const handleApprove = async () => {
    if (!record.value) return
    
    isProcessing.value = true
    try {
      await reimbursementApi.reviewReimbursement(record.value.id, {
        status: 'approved',
        reviewComment: '同意'
      })
      message.success('審核通過成功')
      await fetchReimbursementDetail()
    } catch (error) {
      console.error('Error approving reimbursement:', error)
      message.error('審核通過失敗')
    } finally {
      isProcessing.value = false
    }
  }

  // 處理駁回
  const handleReject = () => {
    showRejectModal.value = true
    rejectComment.value = ''
  }

  // 確認駁回
  const confirmReject = async () => {
    if (!record.value) return
    if (!rejectComment.value.trim()) {
      message.error('請輸入駁回原因')
      return
    }

    isProcessing.value = true
    try {
      await reimbursementApi.reviewReimbursement(record.value.id, {
        status: 'rejected',
        reviewComment: rejectComment.value.trim()
      })
      message.success('駁回成功')
      showRejectModal.value = false
      await fetchReimbursementDetail()
    } catch (error) {
      console.error('Error rejecting reimbursement:', error)
      message.error('駁回失敗')
    } finally {
      isProcessing.value = false
    }
  }

  // 處理圖片 URL
  const getImageUrl = (url: string) => {
    if (!url) return ''
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    if (url.startsWith('blob:')) {
      return url
    }
    
    const baseUrl = import.meta.env.VITE_STATIC_URL || ''
    const staticUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    
    return `${staticUrl}/uploads/${url}`
  }

  // 打開圖片預覽
  const openImagePreview = (url: string) => {
    if (!url) return
    previewImageUrl.value = url
    showImagePreview.value = true
  }

  // 打開 PDF 預覽
  const openPdfPreview = (url: string) => {
    if (!url) return
    const baseUrl = import.meta.env.VITE_STATIC_URL || ''
    const staticUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    pdfPreviewUrl.value = url.startsWith('/') ? `${staticUrl}${url}` : url
    showPdfPreview.value = true
  }

  // 處理添加附件按鈕點擊
  const handleAddAttachment = () => {
    if (pdfFileInput.value) {
      pdfFileInput.value.value = ''  // 清空 input，確保可以選擇相同的文件
      pdfFileInput.value.click()
    }
  }

  // 處理 PDF 文件選擇
  const handlePdfFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]
    
    // 檢查文件類型
    if (file.type !== 'application/pdf') {
      message.error('請上傳 PDF 文件')
      return
    }

    // 檢查文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      message.error('文件大小不能超過 20MB')
      return
    }

    try {
      uploading.value = true
      const result = await uploadApi.uploadToTemp(file)
      
      // 更新 editingData.attachments
      if (editingData.value) {
        if (!editingData.value.attachments) {
          editingData.value.attachments = []
        }
        editingData.value.attachments.push({
          filename: result.data.filename,
          url: result.data.url,
          originalName: file.name
        })
      }
      
      message.success('文件上傳成功')
      if (input) {
        input.value = ''
      }
    } catch (error) {
      console.error('文件上傳失敗：', error)
      message.error('文件上傳失敗')
    } finally {
      uploading.value = false
    }
  }

  // 移除附件
  const removeAttachment = async (index: number) => {
    if (!editingData.value?.attachments) return

    try {
      const attachmentToRemove = editingData.value.attachments[index]
      if (!attachmentToRemove) return

      // 如果有 URL，將文件路徑添加到待刪除列表
      if (attachmentToRemove.url) {
        const urlParts = attachmentToRemove.url.split('/uploads/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          pendingDeleteFiles.value.push(filePath)
        }
      }

      // 從 attachments 中移除
      editingData.value.attachments.splice(index, 1)

      message.success('文件已標記為待刪除')
    } catch (error) {
      console.error('移除文件失敗：', error)
      message.error('移除文件失敗')
    }
  }

  // 處理列印
  const handlePrint = async () => {
    if (!record.value) return
    
    try {
      isPrinting.value = true
      
      // 動態導入 html2pdf.js
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.async = true
      
      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
      
      // 創建要列印的內容
      const printContent = document.createElement('div')
      printContent.className = 'reimbursement-detail print-content'
      
      // 複製當前詳情內容的樣式
      const styles = document.querySelectorAll('style')
      styles.forEach(style => {
        printContent.appendChild(style.cloneNode(true))
      })
      
      // 創建內容容器
      const contentWrapper = document.createElement('div')
      contentWrapper.className = 'detail-wrapper'
      
      // 複製當前詳情內容
      const detailContent = document.querySelector('.detail-table')?.cloneNode(true) as HTMLElement
      if (detailContent) {
        // 移除不需要列印的元素
        const actionsToRemove = detailContent.querySelectorAll('.action-buttons, .edit-actions, .attachments-section')
        actionsToRemove.forEach(el => el.remove())
        
        contentWrapper.appendChild(detailContent)
      }
      
      printContent.appendChild(contentWrapper)
      document.body.appendChild(printContent)
      
      // PDF 配置
      const opt = {
        margin: [10, 10],
        filename: `${record.value.serialNumber}_請款單.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2,  // 提高清晰度
          useCORS: true,
          logging: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape'
        }
      }
      
      // 生成 PDF 並獲取 blob URL
      // @ts-ignore
      const pdf = await window.html2pdf().set(opt).from(printContent).output('bloburl')
      
      // 清理臨時創建的元素
      document.body.removeChild(printContent)
      
      // 在 modal 中預覽 PDF
      pdfPreviewUrl.value = pdf
      showPdfPreview.value = true
      
      message.success('PDF 生成成功')
    } catch (error) {
      console.error('Error generating PDF:', error)
      message.error('PDF 生成失敗')
    } finally {
      isPrinting.value = false
      // 清理腳本
      const scripts = document.querySelectorAll('script[src*="html2pdf"]')
      scripts.forEach(script => script.remove())
    }
  }

  // 下載 PDF
  const downloadPdf = () => {
    if (!pdfPreviewUrl.value || !record.value) return
    
    const link = document.createElement('a')
    link.href = pdfPreviewUrl.value
    link.download = `${record.value.serialNumber}_請款單.pdf`
    link.click()
  }

  return {
    isProcessing,
    isLoading,
    isEditing,
    editingData,
    record,
    showRejectModal,
    rejectComment,
    showImagePreview,
    previewImageUrl,
    showPdfPreview,
    pdfPreviewUrl,
    canEdit,
    totalAmount,
    totalTax,
    totalFee,
    grandTotal,
    fetchReimbursementDetail,
    getStatusText,
    formatAmount,
    formatDate,
    handleEdit,
    handleCancel,
    handleConfirm,
    handleFileChange,
    updateItem,
    handleSubmit,
    addExpenseItem,
    removeExpenseItem,
    handleApprove,
    handleReject,
    confirmReject,
    getImageUrl,
    openImagePreview,
    openPdfPreview,
    pdfFileInput,
    uploading,
    handleAddAttachment,
    handlePdfFileChange,
    removeAttachment,
    isPrinting,
    handlePrint,
    downloadPdf
  }
} 