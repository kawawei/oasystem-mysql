// 引入所需的依賴 Import required dependencies
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reimbursementApi } from '@/services/api'
import receiptApi from '@/services/api/receipt'
import { message } from '@/plugins/message'
import { formatDate, formatTime } from './useFinance'

// 定義日記帳記錄類型 Define journal record type
interface JournalRecord {
  id: number
  date: string
  time: string
  accountNumber: string
  paymentTarget: string
  amount: number
  currency: 'TWD' | 'CNY' | 'USD' | 'JPY' | 'EUR' | 'GBP'
  type: 'income' | 'expense'
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'confirmed'
  serialNumber?: string
  description?: string
  sourceType?: 'receipt' | 'reimbursement' | 'payable' | 'manual'
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
      
      // 獲取已付款的請款單和已確認的收款記錄
      const [reimbursementResponse, receiptResponse] = await Promise.all([
        // 獲取已付款的請款單 Get paid reimbursements
        reimbursementApi.getReimbursements({
          status: ['paid']
        }),
        // 獲取已確認的收款記錄 Get confirmed receipts
        receiptApi.getReceipts({
          status: 'CONFIRMED'
        })
      ])
      
      // 處理請款記錄 Process reimbursement records
      const reimbursementRecords: JournalRecord[] = reimbursementResponse.data.data.map((item: any) => {
        const accountName = item.bankInfo || (item.account ? `${item.account.name} (${item.account.currency})` : '-')
        const paymentTimestamp = new Date(item.reviewedAt)
        
        return {
          id: Number(item.id),
          date: formatDateToTaipei(paymentTimestamp),
          time: formatTimeToTaipei(paymentTimestamp),
          serialNumber: String(item.serialNumber),
          accountName: accountName,
          accountNumber: String(item.accountNumber || ''),
          paymentTarget: String(item.paymentTarget || item.payee || ''),
          amount: Number(item.totalAmount),
          currency: (item.currency || 'TWD') as JournalRecord['currency'],
          type: 'expense',
          status: 'paid',
          description: String(item.title || ''),
          sourceType: 'reimbursement',
          sourceId: Number(item.id)
        }
      })

      // 處理收款記錄 Process receipt records
      const receiptRecords: JournalRecord[] = receiptResponse.data.data.map((item: any) => {
        const timestamp = new Date(item.receiptDate || item.createdAt)
        
        return {
          id: Number(item.id),
          date: formatDateToTaipei(timestamp),
          time: formatTimeToTaipei(timestamp),
          serialNumber: String(item.receiptNumber || ''),
          accountName: String(item.accountName || ''),
          accountNumber: '',  // 收款記錄可能沒有帳號
          paymentTarget: String(item.payer || ''),
          amount: Number(item.amount),
          currency: (item.currency || 'TWD') as JournalRecord['currency'],
          type: 'income',
          status: 'confirmed',
          description: String(item.description || ''),
          sourceType: 'receipt',
          sourceId: Number(item.id)
        }
      })

      // 合併所有記錄 Merge all records
      journalRecords.value = [...reimbursementRecords, ...receiptRecords]

      // 按日期和時間降序排序 Sort by date and time in descending order
      journalRecords.value.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`).getTime()
        const dateB = new Date(`${b.date} ${b.time}`).getTime()
        return dateB - dateA
      })
      
    } catch (error) {
      console.error('Error fetching journal records:', error)
      message.error('獲取日記帳記錄失敗')
    } finally {
      journalLoading.value = false
    }
  }

  // 格式化日期為台北時間 Format date to Taipei time
  const formatDateToTaipei = (date: Date): string => {
    return formatDate(date.toISOString())
  }

  // 格式化時間為台北時間 Format time to Taipei time
  const formatTimeToTaipei = (date: Date): string => {
    return formatTime(date.toISOString())
  }

  // 處理日記帳記錄編輯 Handle journal record edit
  const handleJournalEdit = (record: JournalRecord) => {
    if (record.sourceType === 'reimbursement' || record.sourceType === 'payable') {
      // 如果是請款單，跳轉到請款單詳情 If it's a reimbursement, navigate to reimbursement detail
      router.push({
        path: `/finance/${record.sourceId}`,
        query: { from: 'finance' }
      })
    } else if (record.sourceType === 'receipt') {
      // 如果是收款記錄，觸發收款詳情彈窗 If it's a receipt, trigger receipt detail modal
      // TODO: 實現收款詳情查看邏輯 Implement receipt detail view logic
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