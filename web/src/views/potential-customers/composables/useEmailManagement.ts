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
  formatter?: (row: EmailRow) => string
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
  id?: number
  customer_id?: number
  subject: string
  content: string
  status?: string
  scheduled_time?: string
  attachments?: UploadFile[]
}

export interface EmailRow {
  id: number
  customer_id: number
  subject: string
  content: string
  status: string
  scheduled_time?: string
  sent_time?: string
  attachments?: any[]
  created_at: string
  updated_at: string
  customer?: {
    id: number
    status: string
  }
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
      key: 'status',
      title: '狀態',
      prop: 'status',
      label: '狀態',
      width: '100'
    },
    {
      key: 'scheduled_time',
      title: '預定發送時間',
      prop: 'scheduled_time',
      label: '預定發送時間',
      width: '180'
    },
    {
      key: 'created_at',
      title: '建立時間',
      prop: 'created_at',
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
      attachments: [],
      customer_id: 1,
      status: 'draft'
    }
  }

  // 查看郵件詳情
  const viewEmailDetails = async (row: EmailRow) => {
    try {
      emailLoading.value = true
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${baseUrl}/customer-emails/${row.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('獲取郵件詳情失敗')
      }

      const result = await response.json()
      const email = result.data

      // 設置表單數據
      emailForm.value = {
        id: email.id,
        subject: email.subject,
        content: email.content,
        attachments: email.attachments || [],
        customer_id: email.customer_id,
        status: email.status,
        scheduled_time: email.scheduled_time
      }

      isEditEmail.value = true
      emailModalVisible.value = true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '獲取郵件詳情失敗')
    } finally {
      emailLoading.value = false
    }
  }

  // 刪除郵件
  const deleteEmail = async (row: EmailRow) => {
    try {
      const result = await ElMessageBox.confirm(
        '確定要刪除這封郵件嗎？',
        '警告',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      if (result === 'confirm') {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${baseUrl}/customer-emails/${row.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('刪除郵件失敗')
        }

        message.success('郵件已刪除')
        fetchEmailList()  // 重新獲取郵件列表
      }
    } catch (error) {
      if (error !== 'cancel') {
        message.error(error instanceof Error ? error.message : '刪除郵件失敗')
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
          
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('未登入或登入已過期，請重新登入')
          }
          
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          const url = isEditEmail.value ? 
            `${baseUrl}/customer-emails/${emailForm.value.id}` : 
            `${baseUrl}/customer-emails`
          
          const method = isEditEmail.value ? 'PUT' : 'POST'
          
          const response = await fetch(url, {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              customer_id: emailForm.value.customer_id,
              subject: emailForm.value.subject,
              content: emailForm.value.content,
              status: emailForm.value.status || 'draft',
              scheduled_time: emailForm.value.scheduled_time,
              attachments: emailForm.value.attachments
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || (isEditEmail.value ? '更新郵件失敗' : '創建郵件失敗'))
          }

          message.success(isEditEmail.value ? '郵件已更新' : '郵件已儲存為草稿')
          emailModalVisible.value = false
          fetchEmailList()  // 重新獲取郵件列表
          
        } catch (error) {
          console.error('郵件操作錯誤:', error)
          message.error(error instanceof Error ? error.message : '儲存失敗')
          if (error instanceof Error && error.message.includes('未登入')) {
            // 可以在這裡添加重定向到登入頁面的邏輯
            window.location.href = '/login'
          }
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(
        `${baseUrl}/customer-emails?page=${emailPagination.value.current}&limit=${emailPagination.value.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '獲取郵件列表失敗')
      }

      const result = await response.json()
      emailList.value = result.data.emails
      emailPagination.value.total = result.data.total
    } catch (error) {
      console.error('獲取郵件列表錯誤:', error)
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
    // 暫時禁用發送功能
    const emailSubject = email ? `"${email.subject}"` : '此郵件'
    message.info(`${emailSubject} 的發送功能即將推出`)
    return
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