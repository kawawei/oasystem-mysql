import { message } from '@/plugins/message'
import type { Ref } from 'vue'
import type { ReimbursementFormData } from '@/types/reimbursement'

// 表單提交處理 composable
// Form submission handling composable
export const useFormSubmit = (
  formData: Ref<ReimbursementFormData>,
  selectedPdfFiles: Ref<any[]>,
  showAddModal: Ref<boolean>,
  {
    submitForm,
    fetchRecords
  }: {
    submitForm: () => Promise<boolean>
    fetchRecords: () => Promise<void>
  }
) => {
  // 處理表單提交
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const result = await submitForm()
      if (result) {
        // 清理所有預覽 URL
        // Clean up all preview URLs
        formData.value.items.forEach(item => {
          if (item.invoiceImage && item.invoiceImage.startsWith('blob:')) {
            URL.revokeObjectURL(item.invoiceImage)
          }
        })
        selectedPdfFiles.value.forEach(file => {
          if (file.url && file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url)
          }
        })

        // 清空選中的文件
        // Clear selected files
        selectedPdfFiles.value = []
        
        // 關閉模態框
        // Close modal
        showAddModal.value = false
        
        // 重新獲取列表
        // Refresh list
        await fetchRecords()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      message.error('提交失敗')
    }
  }

  return {
    handleSubmit
  }
} 