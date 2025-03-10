import { ref } from 'vue'
import { message } from '@/plugins/message'
import { Search, Delete, Edit, Message } from '@element-plus/icons-vue'

// 定義郵件狀態類型 Define email status type
export type EmailStatus = 'draft' | 'sent' | 'failed' | 'scheduled'

// 定義郵件數據類型
interface Email {
  id: number
  customer_id: number
  subject: string
  content: string
  status: EmailStatus
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

// 定義表格列類型
interface TableColumnData {
  key: string
  title: string
  sortable?: boolean
  width?: string
  fixed?: 'left' | 'right'
}

export function useEmailList() {
  // 當前標籤頁
  const activeTab = ref('list')
  // 搜索關鍵字
  const searchQuery = ref('')
  // 郵件數據
  const emailData = ref<Email[]>([])
  // 加載狀態
  const loading = ref(false)
  // 分頁信息
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 表格列定義
  const columns: TableColumnData[] = [
    {
      key: 'subject',
      title: '主旨',
      width: '300'
    },
    {
      key: 'status',
      title: '狀態',
      width: '120'
    },
    {
      key: 'scheduled_time',
      title: '預定發送時間',
      width: '180'
    },
    {
      key: 'sent_time',
      title: '發送時間',
      width: '180'
    },
    {
      key: 'created_at',
      title: '創建時間',
      width: '180'
    },
    {
      key: 'actions',
      title: '操作',
      width: '200',
      fixed: 'right'
    }
  ]

  // 獲取郵件列表
  const fetchEmailList = async () => {
    try {
      loading.value = true
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(
        `${baseUrl}/customer-emails?page=${pagination.value.current}&limit=${pagination.value.pageSize}${searchQuery.value ? `&search=${searchQuery.value}` : ''}`,
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
      emailData.value = result.data.emails
      pagination.value.total = result.data.total
    } catch (error) {
      console.error('Error fetching email list:', error)
      message.error('獲取郵件列表失敗')
    } finally {
      loading.value = false
    }
  }

  // 搜索處理
  const handleSearch = () => {
    pagination.value.current = 1
    fetchEmailList()
  }

  // 分頁大小變更處理
  const handleSizeChange = (size: number) => {
    pagination.value.pageSize = size
    pagination.value.current = 1
    fetchEmailList()
  }

  // 當前頁變更處理
  const handlePageChange = (page: number) => {
    pagination.value.current = page
    fetchEmailList()
  }

  // 刪除郵件
  const handleDelete = async (row: Email) => {
    try {
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
      fetchEmailList()
    } catch (error) {
      console.error('Error deleting email:', error)
      message.error('刪除郵件失敗')
    }
  }

  // 編輯郵件
  const handleEdit = (row: Email) => {
    console.log('Edit email:', row.id)
  }

  // 發送郵件
  const handleSend = async (row: Email) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${baseUrl}/customer-emails/${row.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('發送郵件失敗')
      }

      message.success('郵件已發送')
      fetchEmailList()
    } catch (error) {
      console.error('Error sending email:', error)
      message.error('發送郵件失敗')
    }
  }

  return {
    activeTab,
    searchQuery,
    emailData,
    loading,
    pagination,
    columns,
    fetchEmailList,
    handleSearch,
    handlePageChange,
    handleSizeChange,
    handleDelete,
    handleEdit,
    handleSend,
    Search,
    Delete,
    Edit,
    Send: Message
  }
} 