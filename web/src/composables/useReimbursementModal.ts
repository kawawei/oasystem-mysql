import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { ReimbursementFormData } from '@/types/reimbursement'

// 請款模態框處理 composable
// Reimbursement modal handling composable
export const useReimbursementModal = (
  formData: Ref<ReimbursementFormData>,
  {
    resetForm,
    generateSerialNumber,
    addExpenseItem
  }: {
    resetForm: () => void
    generateSerialNumber: () => Promise<void>
    addExpenseItem: () => void
  }
) => {
  // 模態框顯示狀態
  // Modal display state
  const showAddModal = ref(false)
  const showPdfPreview = ref(false)
  const pdfPreviewUrl = ref('')

  // 打開新增請款彈窗
  // Open add reimbursement modal
  const openAddModal = async () => {
    resetForm()

    // 檢查是否有草稿數據
    // Check if there is draft data
    const draft = localStorage.getItem('reimbursementDraft')
    if (draft) {
      const draftData = JSON.parse(draft)
      Object.assign(formData.value, draftData)
      localStorage.removeItem('reimbursementDraft')
    } else {
      addExpenseItem()
    }

    showAddModal.value = true
    await generateSerialNumber()
  }

  // 監聽 PDF 預覽窗口關閉事件
  // Listen to PDF preview window close event
  watch(showPdfPreview, (newVal) => {
    if (!newVal && pdfPreviewUrl.value) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = ''
    }
  })

  // 監聽打開新增對話框的事件
  // Listen to open add modal event
  onMounted(() => {
    window.addEventListener('openAddModal', () => openAddModal())
  })

  onUnmounted(() => {
    window.removeEventListener('openAddModal', () => openAddModal())
  })

  return {
    showAddModal,
    showPdfPreview,
    pdfPreviewUrl,
    openAddModal
  }
} 