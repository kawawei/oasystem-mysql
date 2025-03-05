import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reimbursementApi, type ReimbursementStatus } from '@/services/api'
import { message } from '@/plugins/message'
import type { Reimbursement } from '@/types/reimbursement'

export const useReimbursementList = () => {
  const router = useRouter()
  const searchQuery = ref('')
  const records = ref<Reimbursement[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 過濾記錄
  const filteredRecords = computed(() => {
    if (!searchQuery.value) return records.value
    
    const query = searchQuery.value.toLowerCase()
    return records.value.filter(record => 
      record.serialNumber.toLowerCase().includes(query) ||
      record.payee.toLowerCase().includes(query) ||
      (record.submitter?.name || '').toLowerCase().includes(query)
    )
  })

  // 分頁相關計算
  const totalRecords = computed(() => filteredRecords.value.length)
  const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredRecords.value.slice(start, end)
  })

  // 獲取請款列表
  const fetchRecords = async () => {
    try {
      const { data } = await reimbursementApi.getReimbursements()
      records.value = data.data
    } catch (error) {
      console.error('Error fetching records:', error)
      message.error('獲取請款列表失敗')
    }
  }

  // 刪除請款單
  const removeRecord = async (record: Reimbursement) => {
    try {
      console.log('Deleting reimbursement:', record)
      await reimbursementApi.deleteReimbursement(record.id)
      message.success('請款單刪除成功')
      fetchRecords()
    } catch (error) {
      console.error('Error deleting reimbursement:', error)
      message.error('刪除請款單失敗')
    }
  }

  // 提交請款單
  const submitRecord = async (record: Reimbursement) => {
    try {
      await reimbursementApi.updateReimbursement(record.id, {
        status: 'submitted' as ReimbursementStatus
      })
      message.success('提交成功')
      await fetchRecords()
    } catch (error) {
      console.error('Error submitting reimbursement:', error)
      message.error('提交失敗')
    }
  }

  // 查看詳情
  const viewDetail = (record: Reimbursement) => {
    router.push(`/reimbursement/${record.id}`)
  }

  // 分頁處理
  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1 // 重置到第一頁
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
  }

  // 組件掛載時自動獲取記錄
  // Automatically fetch records when component is mounted
  onMounted(async () => {
    await fetchRecords()
  })

  return {
    searchQuery,
    records,
    currentPage,
    pageSize,
    totalRecords,
    filteredRecords,
    paginatedRecords,
    fetchRecords,
    removeRecord,
    submitRecord,
    viewDetail,
    handleSizeChange,
    handleCurrentChange
  }
} 