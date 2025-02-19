import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import useReceipt from '@/composables/finance/useReceipt'
import useAccount from '@/composables/finance/useAccount'
import useJournal from '@/composables/finance/useJournal'
import receiptApi from '@/services/api/receipt'

export type TabType = 'pending' | 'history' | 'journal' | 'settings' | 'receipt'

// 支援的幣種列表
export const currencies = [
  { value: 'TWD', label: '新台幣' },
  { value: 'USD', label: '美元' },
  { value: 'CNY', label: '人民幣' },
  { value: 'JPY', label: '日圓' },
  { value: 'EUR', label: '歐元' },
  { value: 'GBP', label: '英鎊' },
]

// 定義附件類型
interface Attachment {
  filename: string
  originalName: string
  url: string
  file?: File
}

// 帳戶管理相關狀態已移至 useAccount.ts composable
// Account management related states have been moved to useAccount.ts composable

// 帳戶詳情相關
// 生成收款單號
const generateReceiptSerialNumber = async () => {
  try {
    // 使用本地時間
    const now = new Date()
    const dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0')
    
    // 獲取當天的所有收款記錄數量（不論狀態）
    const response = await receiptApi.getReceipts({
      startDate: now.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    })
    
    // 從響應中獲取記錄數量
    const count = response.data.success ? response.data.data.length : 0
    
    // 序號從當前記錄數量+1開始
    const sequence = count + 1
    
    // 格式化序號為3位數字
    const sequenceStr = String(sequence).padStart(3, '0')
    
    // 返回格式化的收款單號
    return `C${dateStr}${sequenceStr}`
  } catch (error) {
    console.error('Error generating receipt number:', error)
    message.error('生成收款單號失敗')
    return ''
  }
}

export interface FinanceRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  applicant: string
  amount: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

export default function useFinance() {
  const searchQuery = ref('')
  const records = ref<FinanceRecord[]>([])
  const isMobile = ref(false)
  const router = useRouter()
  const route = useRoute()

  // 駁回相關
  const showRejectModal = ref(false)
  const rejectComment = ref('')
  const currentRecord = ref<FinanceRecord | null>(null)

  const activeTab = ref<TabType>('pending')

  // 使用帳戶管理可組合函數 Use account management composable
  const account = useAccount()

  // 使用收款管理可組合函數 Use receipt management composable
  const receipt = useReceipt()

  // 使用日記帳管理可組合函數 Use journal management composable
  const journal = useJournal()

  // 初始化數據
  onMounted(() => {
    // 獲取帳戶列表 Get account list
    account.fetchAccounts()

    if (activeTab.value === 'pending' || activeTab.value === 'history') {
      fetchRecords()
    } else if (activeTab.value === 'receipt') {
      receipt.fetchReceiptRecords()
    } else if (activeTab.value === 'journal') {
      journal.fetchJournalRecords()
    } else if (activeTab.value === 'settings') {
      account.fetchAccounts()
    }
  })

  // 獲取請款記錄
  const fetchRecords = async () => {
    try {
      const { data } = await reimbursementApi.getReimbursements({
        status: activeTab.value === 'pending' ? ['submitted', 'approved'] : ['rejected', 'paid']  // 根據頁籤決定獲取的狀態
      })
      
      // 將請款數據轉換為財務記錄格式
      records.value = data.data.map((item: any) => ({
        id: item.id,
        serialNumber: item.serialNumber.replace(/^[PR]B/, (match: string) => match === 'RB' ? 'A' : 'B'),
        type: item.type,
        applicant: item.submitter?.name || '未知',
        amount: item.totalAmount,
        status: item.status,
        createdAt: item.createdAt
      }))
    } catch (error) {
      console.error('Error fetching records:', error)
      message.error('獲取記錄失敗')
    }
  }

  // 過濾記錄
  const filteredRecords = computed(() => {
    if (!searchQuery.value) return records.value
    
    const query = searchQuery.value.toLowerCase()
    return records.value.filter(record => 
      record.serialNumber.toLowerCase().includes(query) ||
      record.applicant.toLowerCase().includes(query)
    )
  })

  // 格式化金額
  const formatAmount = (amount: number | string | null | undefined, currency: string = 'TWD') => {
    console.log('formatAmount input:', { amount, currency, type: typeof amount });
    
    if (amount === null || amount === undefined) {
      console.log('Amount is null or undefined');
      return '-';
    }
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    console.log('numericAmount:', { value: numericAmount, type: typeof numericAmount });
    
    if (isNaN(numericAmount)) {
      console.log('Amount is NaN');
      return '-';
    }

    const currencySymbols: { [key: string]: string } = {
      TWD: 'NT$',
      USD: '$',
      CNY: '¥',
      JPY: '¥',
      EUR: '€',
      GBP: '£'
    }
    
    const result = `${currencySymbols[currency] || ''} ${numericAmount.toLocaleString()}`;
    console.log('formatAmount result:', result);
    return result;
  }

  // 查看詳情
  const viewDetail = (record: FinanceRecord) => {
    router.push({
      path: `/finance/${record.id}`,
      query: { from: 'finance' }
    })
  }

  // 處理簽核
  const handleApprove = async (record: FinanceRecord) => {
    try {
      await reimbursementApi.reviewReimbursement(record.id, {
        status: 'approved',
        reviewComment: '同意'
      })
      message.success('簽核成功')
      // 重新獲取列表
      await fetchRecords()
    } catch (error) {
      console.error('Error approving reimbursement:', error)
      message.error('簽核失敗')
    }
  }

  // 處理駁回
  const handleReject = (record: FinanceRecord) => {
    currentRecord.value = record
    rejectComment.value = ''
    showRejectModal.value = true
  }

  // 確認駁回
  const confirmReject = async () => {
    if (!currentRecord.value) return
    if (!rejectComment.value.trim()) {
      message.error('請輸入駁回原因')
      return
    }

    try {
      await reimbursementApi.reviewReimbursement(currentRecord.value.id, {
        status: 'rejected',
        reviewComment: rejectComment.value.trim()
      })
      message.success('駁回成功')
      showRejectModal.value = false
      // 重新獲取列表
      await fetchRecords()
    } catch (error) {
      console.error('Error rejecting reimbursement:', error)
      message.error('駁回失敗')
    }
  }

  // 監聽路由變化，當從詳情頁返回時刷新數據
  watch(() => route.path, (newPath) => {
    if (newPath === '/finance' && activeTab.value === 'journal') {
      journal.fetchJournalRecords()
    }
  })

  // 監聽頁籤變化
  watch(activeTab, (newTab) => {
    if (newTab === 'pending' || newTab === 'history') {
      fetchRecords()
    } else if (newTab === 'receipt') {
      receipt.fetchReceiptRecords()
    } else if (newTab === 'journal') {
      journal.fetchJournalRecords()
    } else if (newTab === 'settings') {
      account.fetchAccounts()
    }
  })

  let refreshInterval: number | null = null

  onMounted(() => {
    // 初始化數據
    if (activeTab.value === 'pending' || activeTab.value === 'history') {
      fetchRecords()
    } else if (activeTab.value === 'journal') {
      journal.fetchJournalRecords()
    }
    
    // 每分鐘刷新一次數據
    refreshInterval = setInterval(() => {
      if (activeTab.value === 'journal') {
        journal.fetchJournalRecords()
      }
    }, 60000)
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    window.removeEventListener('resize', checkMobile)
  })

  // 檢查是否為移動端
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }

  // 處理帳戶選擇變更
  const handleAccountChange = (accountId: string) => {
    if (!accountId) {
      receipt.receiptForm.value.currency = 'TWD'
      receipt.receiptForm.value.accountId = ''
      receipt.receiptForm.value.accountName = ''
      return
    }
    
    const selectedAccount = account.accounts.value.find(acc => acc.id.toString() === accountId)
    if (selectedAccount) {
      receipt.receiptForm.value.currency = selectedAccount.currency
      receipt.receiptForm.value.accountId = accountId
      receipt.receiptForm.value.accountName = selectedAccount.name
      console.log('Updated receipt form:', receipt.receiptForm.value)
    }
  }

  // 獲取幣種符號
  const getCurrencySymbol = (currency: string) => {
    const currencyMap: { [key: string]: string } = {
      'TWD': 'NT$',
      'USD': '$',
      'CNY': '¥',
      'JPY': '¥',
      'EUR': '€',
      'GBP': '£'
    }
    return currencyMap[currency] || currency
  }

  // 下載附件 Download attachment
  const downloadAttachment = async (file: Attachment) => {
    try {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      message.error('下載附件失敗')
    }
  }

  // 監聽收款彈窗顯示狀態 Watch receipt modal visibility
  watch(receipt.showReceiptModal, async (newValue) => {
    if (newValue) {
      // 確保已獲取帳戶列表 Ensure account list is fetched
      if (account.accounts.value.length === 0) {
        await account.fetchAccounts()
      }
      // 當彈窗打開時，生成新的單號 Generate new receipt number when modal opens
      receipt.receiptForm.value.serialNumber = await generateReceiptSerialNumber()
    }
  })

  return {
    searchQuery,
    records,
    isMobile,
    showRejectModal,
    rejectComment,
    currentRecord,
    activeTab,
    filteredRecords,
    formatAmount,
    viewDetail,
    handleApprove,
    handleReject,
    confirmReject,
    
    // 帳戶管理相關
    accounts: account.accounts,
    showAccountModal: account.showAccountModal,
    accountForm: account.accountForm,
    accountsLoading: account.accountsLoading,
    currencies,
    createAccount: account.createAccount,
    resetAccountForm: account.resetAccountForm,
    selectedAccount: account.selectedAccount,
    showAccountDetailModal: account.showAccountDetailModal,
    showAccountActionModal: account.showAccountActionModal,
    accountTransactions: account.accountTransactions,
    transactionsLoading: account.transactionsLoading,
    currentAction: account.currentAction,
    getActionModalTitle: account.getActionModalTitle,
    getActionModalMessage: account.getActionModalMessage,
    viewAccountDetail: account.viewAccountDetail,
    handleAccountStatus: account.handleAccountStatus,
    confirmAccountAction: account.confirmAccountAction,
    
    // 日記帳相關
    journalRecords: journal.journalRecords,
    journalLoading: journal.journalLoading,
    formatDate: journal.formatDate,
    formatTime: journal.formatTime,
    handleJournalEdit: journal.handleJournalEdit,
    
    // 收款管理相關
    showReceiptModal: receipt.showReceiptModal,
    receiptRecords: receipt.receiptRecords,
    receiptLoading: receipt.receiptLoading,
    receiptForm: receipt.receiptForm,
    receiptFileInput: receipt.receiptFileInput,
    showImagePreview: receipt.showImagePreview,
    previewImageUrl: receipt.previewImageUrl,
    showReceiptDetailModal: receipt.showReceiptDetailModal,
    selectedReceipt: receipt.selectedReceipt,
    fetchReceiptRecords: receipt.fetchReceiptRecords,
    resetReceiptForm: receipt.resetReceiptForm,
    createReceipt: receipt.createReceipt,
    handleConfirmReceipt: receipt.handleConfirmReceipt,
    viewReceiptDetail: receipt.viewReceiptDetail,
    triggerReceiptUpload: receipt.triggerReceiptUpload,
    handleReceiptFileSelected: receipt.handleReceiptFileSelected,
    removeReceiptAttachment: receipt.removeReceiptAttachment,
    openImagePreview: receipt.openImagePreview,
    handleDeleteReceipt: receipt.handleDeleteReceipt,
    downloadAttachment,
    handleAccountChange,
    getCurrencySymbol
  }
}
