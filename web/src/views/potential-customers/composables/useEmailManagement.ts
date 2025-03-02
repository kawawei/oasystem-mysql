import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { message } from '@/plugins/message'

// 定義列類型
export interface Column {
  key: string
  title: string
  prop: string
  label: string
  width: string
  fixed?: 'left' | 'right'
}

// 定義類型
export interface UploadFile extends File {
  uid: string
  name: string
  size: number
}

export interface EmailPagination {
  current: number
  pageSize: number
  total: number
}

export interface EmailForm {
  subject: string
  content: string
  attachments?: UploadFile[]
}

export interface EmailRow {
  id: number
  subject: string
  content: string
  status: string
  recipients: string[]
  attachments?: UploadFile[]
  createdAt: string
  updatedAt: string
}

// Email 管理組合式函數
export function useEmailManagement() {
  // Email 相關狀態
  const emailLoading = ref(false)
  const emailList = ref<EmailRow[]>([])
  const emailModalVisible = ref(false)
  const emailSubmitting = ref(false)
  const isEditEmail = ref(false)
  const emailFormRef = ref<FormInstance>()
  const uploadRef = ref()

  // Email 表單
  const emailForm = ref<EmailForm>({
    subject: '',
    content: '',
    attachments: []
  })

  // Email 表單驗證規則
  const emailFormRules = {
    subject: [
      { required: true, message: '請輸入郵件主旨', trigger: 'blur' },
      { min: 2, max: 100, message: '長度在 2 到 100 個字符', trigger: 'blur' }
    ],
    content: [
      { required: true, message: '請輸入郵件內容', trigger: 'blur' }
    ]
  }

  // 郵件分頁
  const emailPagination = ref<EmailPagination>({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 郵件表格列定義
  const emailColumns: Column[] = [
    {
      key: 'subject',
      title: '主旨',
      prop: 'subject',
      label: '主旨',
      width: '300'
    },
    {
      key: 'recipients',
      title: '收件人',
      prop: 'recipients',
      label: '收件人',
      width: '150'
    },
    {
      key: 'status',
      title: '狀態',
      prop: 'status',
      label: '狀態',
      width: '100'
    },
    {
      key: 'createdAt',
      title: '建立時間',
      prop: 'createdAt',
      label: '建立時間',
      width: '180'
    },
    {
      key: 'actions',
      title: '操作',
      prop: 'actions',
      label: '操作',
      width: '150',
      fixed: 'right'
    }
  ]

  // 上傳相關配置
  const uploadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload`

  // 獲取郵件狀態文字
  const getEmailStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      sent: '已發送',
      failed: '發送失敗'
    }
    return statusMap[status] || status
  }

  // 顯示郵件對話框
  const showEmailModal = () => {
    emailModalVisible.value = true
    isEditEmail.value = false
    emailForm.value = {
      subject: '',
      content: '',
      attachments: []
    }
  }

  // 查看郵件詳情
  const viewEmailDetails = (row: EmailRow) => {
    emailModalVisible.value = true
    isEditEmail.value = true
    emailForm.value = {
      subject: row.subject,
      content: row.content,
      attachments: row.attachments
    }
  }

  // 刪除郵件
  const deleteEmail = async (row: EmailRow) => {
    try {
      await ElMessageBox.confirm(
        '確定要刪除此郵件嗎？',
        '警告',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 模擬刪除郵件
      // Simulate deleting email
      const index = emailList.value.findIndex(email => email.id === row.id)
      if (index !== -1) {
        emailList.value.splice(index, 1)
        message.success('郵件已刪除')
      }
    } catch (error) {
      if (error !== 'cancel') {
        message.error('刪除失敗')
      }
    }
  }

  // 文件上傳前的驗證
  const beforeUpload = (file: File) => {
    const isLt25M = file.size / 1024 / 1024 < 25
    if (!isLt25M) {
      message.error('文件大小不能超過 25MB!')
      return false
    }
    return true
  }

  // 處理文件選擇
  const handleFileChange = (file: UploadFile) => {
    if (!emailForm.value.attachments) {
      emailForm.value.attachments = []
    }
    emailForm.value.attachments.push(file)
  }

  // 處理文件移除
  const handleFileRemove = (file: UploadFile) => {
    if (!emailForm.value.attachments) return
    const index = emailForm.value.attachments.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      emailForm.value.attachments.splice(index, 1)
    }
  }

  // 手動移除附件
  const removeAttachment = (index: number) => {
    if (!emailForm.value.attachments) return
    emailForm.value.attachments.splice(index, 1)
  }

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return size + ' B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    }
  }

  // 處理郵件提交（儲存為草稿）
  const handleEmailSubmit = async () => {
    if (!emailFormRef.value) return
    
    await emailFormRef.value.validate(async (valid: boolean) => {
      if (valid) {
        try {
          emailSubmitting.value = true
          
          // 模擬儲存郵件
          // Simulate saving email
          const newEmail: EmailRow = {
            id: Date.now(),  // 使用時間戳作為臨時 ID
            subject: emailForm.value.subject,
            content: emailForm.value.content,
            status: 'draft',
            recipients: [],  // 暫時為空
            attachments: emailForm.value.attachments,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          // 如果是編輯模式，更新現有郵件
          if (isEditEmail.value) {
            const index = emailList.value.findIndex(email => email.subject === emailForm.value.subject)
            if (index !== -1) {
              emailList.value[index] = { ...emailList.value[index], ...newEmail }
            }
          } else {
            // 新增郵件到列表
            emailList.value.unshift(newEmail)
          }

          message.success(isEditEmail.value ? '郵件已更新' : '郵件已儲存為草稿')
          emailModalVisible.value = false
          fetchEmailList()  // 重新獲取郵件列表
          
        } catch (error) {
          message.error(error instanceof Error ? error.message : '儲存失敗')
        } finally {
          emailSubmitting.value = false
        }
      }
    })
  }

  // 獲取郵件列表
  const fetchEmailList = async () => {
    try {
      emailLoading.value = true
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/emails?page=${emailPagination.value.current}&pageSize=${emailPagination.value.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('獲取郵件列表失敗')
      }

      const result = await response.json()
      emailList.value = result.data
      emailPagination.value.total = result.total
    } catch (error) {
      message.error(error instanceof Error ? error.message : '獲取郵件列表失敗')
    } finally {
      emailLoading.value = false
    }
  }

  // 處理郵件分頁大小變更
  const handleEmailSizeChange = (val: number) => {
    emailPagination.value.pageSize = val
    fetchEmailList()  // 調用 fetchEmailList 重新獲取數據
  }

  // 處理郵件分頁頁碼變更
  const handleEmailCurrentChange = (val: number) => {
    emailPagination.value.current = val
    fetchEmailList()  // 調用 fetchEmailList 重新獲取數據
  }

  // 處理郵件寄送
  const handleEmailSend = async (email?: EmailRow) => {
    // 如果傳入了郵件對象，直接發送該郵件
    if (email) {
      try {
        emailSubmitting.value = true
        
        // 模擬發送郵件
        const index = emailList.value.findIndex(e => e.id === email.id)
        if (index !== -1) {
          emailList.value[index] = {
            ...email,
            status: 'sent',
            updatedAt: new Date().toISOString()
          }
        }

        message.success('郵件已成功寄送')
        fetchEmailList()  // 重新獲取郵件列表
      } catch (error) {
        message.error(error instanceof Error ? error.message : '郵件寄送失敗')
      } finally {
        emailSubmitting.value = false
      }
      return
    }

    // 從編輯器發送郵件的邏輯
    if (!emailFormRef.value) return
    
    await emailFormRef.value.validate(async (valid: boolean) => {
      if (valid) {
        try {
          emailSubmitting.value = true
          
          // 模擬發送郵件
          // Simulate sending email
          const newEmail: EmailRow = {
            id: Date.now(),
            subject: emailForm.value.subject,
            content: emailForm.value.content,
            status: 'sent',
            recipients: [],  // 暫時為空
            attachments: emailForm.value.attachments,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          // 新增郵件到列表
          // Add new email to list
          emailList.value.unshift(newEmail)

          message.success('郵件已成功寄送')
          emailModalVisible.value = false
          fetchEmailList()  // 重新獲取郵件列表
        } catch (error) {
          message.error(error instanceof Error ? error.message : '郵件寄送失敗')
        } finally {
          emailSubmitting.value = false
        }
      }
    })
  }

  return {
    // 狀態
    emailLoading,
    emailList,
    emailModalVisible,
    emailSubmitting,
    isEditEmail,
    emailFormRef,
    uploadRef,
    emailForm,
    emailFormRules,
    emailPagination,
    emailColumns,
    uploadUrl,

    // 方法
    getEmailStatusText,
    showEmailModal,
    viewEmailDetails,
    deleteEmail,
    beforeUpload,
    handleFileChange,
    handleFileRemove,
    removeAttachment,
    formatFileSize,
    handleEmailSubmit,
    handleEmailSizeChange,
    handleEmailCurrentChange,
    handleEmailSend,
    fetchEmailList
  }
} 