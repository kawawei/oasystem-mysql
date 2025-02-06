import { ref } from 'vue'
import { uploadApi, type ReimbursementFormData } from '@/services/api'
import { message } from '@/plugins/message'

export function useFileUpload(formData: { value: ReimbursementFormData }) {
  const fileInput = ref<HTMLInputElement | null>(null)
  const pdfFileInput = ref<HTMLInputElement | null>(null)
  const uploading = ref(false)
  const currentUploadIndex = ref<number>(-1)

  // PDF 預覽相關
  const showPdfPreview = ref(false)
  const pdfPreviewUrl = ref('')
  
  // 圖片預覽相關
  const showImagePreview = ref(false)
  const previewImageUrl = ref('')

  // 選中的 PDF 文件列表
  const selectedPdfFiles = ref<Array<{ name: string; file: File; url?: string }>>([])

  // 處理添加附件按鈕點擊
  const handleAddAttachment = () => {
    if (pdfFileInput.value) {
      pdfFileInput.value.value = ''  // 清空 input，確保可以選擇相同的文件
      pdfFileInput.value.click()
    }
  }

  // 打開圖片預覽
  const openImagePreview = (url: string) => {
    if (!url) return
    previewImageUrl.value = url
    showImagePreview.value = true
  }

  // 觸發文件上傳
  const triggerUpload = (index: number) => {
    currentUploadIndex.value = index
    if (fileInput.value) {
      fileInput.value.value = ''  // 清空 input，確保可以選擇相同的文件
      fileInput.value.click()
    }
  }

  // 處理文件選擇
  const handleFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const file = input.files[0]
      // 檢查是否為圖片文件
      if (!file.type.startsWith('image/')) {
        message.error('只能上傳圖片文件')
        return
      }
      // 檢查文件大小（20MB）
      if (file.size > 20 * 1024 * 1024) {
        message.error('文件大小不能超過 20MB')
        return
      }

      // 創建本地預覽 URL
      const previewUrl = URL.createObjectURL(file)
      
      // 更新對應明細項的發票圖片和文件
      if (currentUploadIndex.value !== -1 && formData.value?.items) {
        formData.value.items[currentUploadIndex.value].invoiceImage = previewUrl
        // 保存文件對象以供後續上傳
        formData.value.items[currentUploadIndex.value]._file = file
      }

      // 清空 input
      if (input) {
        input.value = ''
      }
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
      
      // 更新 selectedPdfFiles
      selectedPdfFiles.value.push({
        name: file.name,
        file: file,
        url: result.data.url
      })

      // 更新 formData.attachments
      formData.value.attachments.push({
        filename: result.data.filename,
        url: result.data.url,
        originalName: file.name,
        file: file
      })
      
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

  // 查看 PDF 文件
  const viewPdfFile = (index: number) => {
    const file = selectedPdfFiles.value[index]
    if (file) {
      const fileUrl = file.url || URL.createObjectURL(file.file)
      pdfPreviewUrl.value = fileUrl
      showPdfPreview.value = true
    }
  }

  // 移除 PDF 文件
  const removePdfFile = async (index: number) => {
    try {
      const fileToRemove = selectedPdfFiles.value[index]
      if (!fileToRemove) return

      // 如果有 URL，則刪除暫存文件
      if (fileToRemove.url) {
        const urlParts = fileToRemove.url.split('/uploads/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await uploadApi.deleteFile(filePath)
        }
      }

      // 從 selectedPdfFiles 中移除
      selectedPdfFiles.value.splice(index, 1)

      // 從 formData.attachments 中移除
      formData.value.attachments = formData.value.attachments.filter(
        (attachment) => attachment.url !== fileToRemove.url
      )

      message.success('文件已移除')
    } catch (error) {
      console.error('移除文件失敗：', error)
      message.error('移除文件失敗')
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    fileInput,
    pdfFileInput,
    uploading,
    showPdfPreview,
    pdfPreviewUrl,
    showImagePreview,
    previewImageUrl,
    selectedPdfFiles,
    triggerUpload,
    handleFileSelected,
    handlePdfFileChange,
    viewPdfFile,
    removePdfFile,
    formatFileSize,
    handleAddAttachment,
    openImagePreview
  }
} 