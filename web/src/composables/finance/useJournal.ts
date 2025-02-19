// 引入所需的依賴 Import required dependencies
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'

// 定義日記帳記錄類型 Define journal record type
interface JournalRecord {
  id: number
  date: string
  time: string
  accountNumber: string
  paymentTarget: string
  amount: number
  currency: 'TWD' | 'CNY'
  type: 'income' | 'expense'
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
  serialNumber?: string
  description?: string
  sourceType?: 'reimbursement' | 'payable' | 'manual'
  sourceId?: number
  accountName?: string
}

// 導出日記帳管理的可組合函數 Export journal management composable
export default function useJournal() {
  const router = useRouter()
  const journalLoading = ref(false)
  const journalRecords = ref<JournalRecord[]>([])

  // 獲取日記帳記錄 Get journal records
  const fetchJournalRecords = async () => {
    try {
      journalLoading.value = true
      
      // 獲取已付款的請款單 Get paid reimbursements
      const { data } = await reimbursementApi.getReimbursements({
        status: ['paid']
      })
      
      console.log('Fetched paid records:', data)
      
      // 將請款單轉換為日記帳格式 Transform reimbursements to journal format
      journalRecords.value = data.data.map((item: any) => {
        console.log('Processing record:', item)
        
        // 確保從正確的位置獲取支付帳戶名稱 Ensure getting payment account name from correct location
        const accountName = item.bankInfo || (item.account ? `${item.account.name} (${item.account.currency})` : '-')
        
        // 使用 reviewedAt 作為付款時間戳，並轉換為台北時間
        // Use reviewedAt as payment timestamp and convert to Taipei time
        const paymentTimestamp = new Date(item.reviewedAt)
        
        // 格式化日期和時間 Format date and time
        const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'Asia/Taipei'
        })
        
        const timeFormatter = new Intl.DateTimeFormat('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Taipei'
        })
        
        return {
          id: item.id,
          date: dateFormatter.format(paymentTimestamp),
          time: timeFormatter.format(paymentTimestamp),
          serialNumber: item.serialNumber,
          accountName: accountName,
          accountNumber: item.accountNumber,
          paymentTarget: item.paymentTarget || item.payee,
          amount: item.totalAmount,
          currency: item.currency,
          type: 'expense',
          status: item.status,
          description: item.title,
          sourceType: item.type,
          sourceId: item.id
        }
      })

      // 按日期和時間降序排序 Sort by date and time in descending order
      journalRecords.value.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`).getTime()
        const dateB = new Date(`${b.date} ${b.time}`).getTime()
        return dateB - dateA
      })
      
      console.log('Processed journal records:', journalRecords.value)
      
    } catch (error) {
      console.error('Error fetching journal records:', error)
      message.error('獲取日記帳記錄失敗')
    } finally {
      journalLoading.value = false
    }
  }

  // 格式化日期 Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 格式化時間 Format time
  const formatTime = (time: string) => {
    if (!time) return '-'
    return time.split('.')[0]  // 移除毫秒部分 Remove milliseconds
  }

  // 處理日記帳記錄編輯 Handle journal record edit
  const handleJournalEdit = (record: JournalRecord) => {
    if (record.sourceType === 'reimbursement' || record.sourceType === 'payable') {
      // 如果是請款單，跳轉到請款單詳情 If it's a reimbursement, navigate to reimbursement detail
      router.push({
        path: `/finance/${record.sourceId}`,
        query: { from: 'finance' }
      })
    }
  }

  // 初始化數據 Initialize data
  onMounted(() => {
    fetchJournalRecords()
  })

  return {
    // 狀態 States
    journalLoading,
    journalRecords,

    // 方法 Methods
    fetchJournalRecords,
    formatDate,
    formatTime,
    handleJournalEdit
  }
} 