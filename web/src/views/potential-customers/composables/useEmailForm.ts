import { ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'

// 表單數據類型定義
export interface Attachment {
  filename: string
  url: string
  size: number
  content?: string
  mimeType?: string
}

export interface EmailForm {
  customer_id?: number
  to: string
  subject: string
  content: string
  status?: string
  scheduled_time?: string
  attachments: Attachment[]
}

// Props 類型定義
interface EmailProps {
  visible: boolean
  isEdit: boolean
  emailData?: {
    id?: number
    customer_id?: number
    to?: string
    subject?: string
    content?: string
    status?: string
    scheduled_time?: string
    attachments?: Array<{
      filename: string
      url: string
      size: number
    }>
  }
}

export function useEmailForm(props: EmailProps, emit: any) {
  // 表單數據
  const form = ref<EmailForm>({
    customer_id: undefined,
    to: '',
    subject: '',
    content: '',
    status: 'draft',
    scheduled_time: undefined,
    attachments: []
  })

  // 對話框可見性
  const dialogVisible = ref(props.visible)

  // 監聽 visible prop 的變化
  watch(() => props.visible, (newVal) => {
    dialogVisible.value = newVal
  })

  // 監聽對話框可見性的變化
  watch(dialogVisible, (newVal) => {
    emit('update:visible', newVal)
  })

  // 監聽 emailData 的變化
  watch(() => props.emailData, (newVal) => {
    if (newVal) {
      form.value = {
        customer_id: newVal.customer_id,
        to: newVal.to || '',
        subject: newVal.subject || '',
        content: newVal.content || '',
        status: newVal.status || 'draft',
        scheduled_time: newVal.scheduled_time,
        attachments: newVal.attachments || []
      }
    } else {
      form.value = {
        customer_id: undefined,
        to: '',
        subject: '',
        content: '',
        status: 'draft',
        scheduled_time: undefined,
        attachments: []
      }
    }
  }, { immediate: true })

  // 檢查表單是否有變更
  const hasChanges = () => {
    if (!props.emailData) {
      return Boolean(form.value.to || form.value.subject || form.value.content)
    }
    return (
      form.value.to !== props.emailData.to ||
      form.value.subject !== props.emailData.subject ||
      form.value.content !== props.emailData.content
    )
  }

  // 關閉對話框
  const handleClose = async () => {
    if (hasChanges()) {
      try {
        await ElMessageBox.confirm(
          '您有未保存的更改，確定要關閉嗎？',
          '提示',
          {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (e) {
        return
      }
    }
    dialogVisible.value = false
  }

  // 驗證表單
  const validateForm = () => {
    if (!form.value.subject || !form.value.subject.trim()) {
      ElMessageBox.alert('請輸入郵件主旨', '提示')
      return false
    }
    if (!form.value.content || !form.value.content.trim()) {
      ElMessageBox.alert('請輸入郵件內容', '提示')
      return false
    }
    return true
  }

  // 保存為草稿
  const handleSave = () => {
    emit('save', {
      ...form.value,
      to: form.value.to?.trim() || '',
      subject: form.value.subject?.trim() || '',
      content: form.value.content?.trim() || ''
    })
  }

  return {
    form,
    dialogVisible,
    hasChanges,
    handleClose,
    validateForm,
    handleSave
  }
} 