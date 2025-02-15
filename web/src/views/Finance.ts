import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import { accountApi } from '@/services/api/account'
import type { Account, AccountTransaction, AccountActionType } from '@/types/account'

export interface FinanceRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  applicant: string
  amount: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

export type TabType = 'pending' | 'history' | 'journal' | 'settings'

// 支援的幣種列表
export const currencies = [
  { value: 'TWD', label: '新台幣' },
  { value: 'USD', label: '美元' },
  { value: 'CNY', label: '人民幣' },
  { value: 'JPY', label: '日圓' },
  { value: 'EUR', label: '歐元' },
  { value: 'GBP', label: '英鎊' },
]

// 定義日記帳記錄類型
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

// 帳戶詳情相關
const showAccountDetailModal = ref(false)
const showAccountActionModal = ref(false)
const selectedAccount = ref<Account | null>(null)
const accountTransactions = ref<AccountTransaction[]>([])
const transactionsLoading = ref(false)
const currentAction = ref<AccountActionType | null>(null)

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

  // 帳戶管理相關
  const accounts = ref<Account[]>([])
  const showAccountModal = ref(false)
  const accountForm = ref({
    name: '',
    currency: 'TWD',
    initialBalance: '0'
  })

  // 日記帳相關
  const journalLoading = ref(false)
  const journalRecords = ref<JournalRecord[]>([])

  // 初始化帳戶列表
  onMounted(() => {
    fetchAccounts()
  })

  // 獲取帳戶列表
  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...');
      const response = await accountApi.getAccounts({ includeDeleted: true });
      console.log('Response:', response);
      
      if (response && Array.isArray(response.data)) {
        accounts.value = response.data;
        console.log('Accounts after assignment:', accounts.value);
        
        // 檢查每個賬戶的金額和狀態
        accounts.value.forEach((account, index) => {
          console.log(`Account ${index + 1}:`, {
            name: account.name,
            initialBalance: account.initialBalance,
            currentBalance: account.currentBalance,
            isDeleted: account.is_deleted,
            type: {
              initialBalance: typeof account.initialBalance,
              currentBalance: typeof account.currentBalance
            }
          });
        });
      } else {
        console.error('Invalid response format:', response);
        accounts.value = [];
      }
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      accounts.value = [];
      message.error('獲取帳戶列表失敗');
    }
  }

  // 新增帳戶
  const createAccount = async () => {
    try {
      if (!accountForm.value.name.trim()) {
        message.error('請輸入帳戶名稱')
        return
      }

      const initialBalance = parseFloat(accountForm.value.initialBalance)
      if (isNaN(initialBalance)) {
        message.error('請輸入有效的金額')
        return
      }

      await accountApi.createAccount({
        name: accountForm.value.name,
        currency: accountForm.value.currency,
        initial_balance: initialBalance
      })
      
      message.success('新增帳戶成功')
      showAccountModal.value = false
      resetAccountForm()
      // 重新獲取帳戶列表
      await fetchAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      message.error('新增帳戶失敗')
    }
  }

  // 重置表單
  const resetAccountForm = () => {
    accountForm.value = {
      name: '',
      currency: 'TWD',
      initialBalance: '0'
    }
  }


  // 檢查是否為移動端
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }

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

  // 獲取日記帳記錄
  const fetchJournalRecords = async () => {
    try {
      journalLoading.value = true
      
      // 獲取已付款的請款單
      const { data } = await reimbursementApi.getReimbursements({
        status: ['paid']
      })
      
      console.log('Fetched paid records:', data)
      
      // 將請款單轉換為日記帳格式
      journalRecords.value = data.data.map((item: any) => {
        console.log('Processing record:', item)
        
        // 確保從正確的位置獲取支付帳戶名稱
        const accountName = item.bankInfo || (item.account ? `${item.account.name} (${item.account.currency})` : '-')
        
        // 使用 reviewedAt 作為付款時間戳，並轉換為台北時間
        const paymentTimestamp = new Date(item.reviewedAt)
        
        // 格式化日期和時間
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

      // 按日期和時間降序排序
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

  // 監聽路由變化，當從詳情頁返回時刷新數據
  watch(() => route.path, (newPath) => {
    if (newPath === '/finance' && activeTab.value === 'journal') {
      fetchJournalRecords()
    }
  })

  // 監聽頁籤變化
  watch(activeTab, (newTab) => {
    if (newTab === 'pending' || newTab === 'history') {
      fetchRecords()
    } else if (newTab === 'journal') {
      fetchJournalRecords()
    } else if (newTab === 'settings') {
      fetchAccounts()
    }
  })

  // 格式化日期
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 格式化時間
  const formatTime = (time: string) => {
    if (!time) return '-'
    return time.split('.')[0]  // 移除毫秒部分
  }

  // 處理日記帳記錄編輯
  const handleJournalEdit = (record: JournalRecord) => {
    if (record.sourceType === 'reimbursement' || record.sourceType === 'payable') {
      // 如果是請款單，跳轉到請款單詳情
      router.push({
        path: `/finance/${record.sourceId}`,
        query: { from: 'finance' }
      })
    }
  }

  let refreshInterval: number | null = null  // 修改為 number 類型

  onMounted(() => {
    // 初始化數據
    if (activeTab.value === 'pending' || activeTab.value === 'history') {
      fetchRecords()
    } else if (activeTab.value === 'journal') {
      fetchJournalRecords()
    }
    
    // 每分鐘刷新一次數據
    refreshInterval = setInterval(() => {
      if (activeTab.value === 'journal') {
        fetchJournalRecords()
      }
    }, 60000)
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    window.removeEventListener('resize', checkMobile)
  })

  // 查看帳戶詳情
  const viewAccountDetail = async (account: Account) => {
    selectedAccount.value = account
    showAccountDetailModal.value = true
    await fetchAccountTransactions(account.id)
  }

  // 獲取帳戶交易記錄
  const fetchAccountTransactions = async (accountId: number) => {
    try {
      transactionsLoading.value = true
      const response = await accountApi.getAccountTransactions(accountId)
      accountTransactions.value = response.data
    } catch (error) {
      console.error('Error fetching account transactions:', error)
      message.error('獲取交易記錄失敗')
    } finally {
      transactionsLoading.value = false
    }
  }

  // 處理帳戶狀態變更
  const handleAccountStatus = (account: Account, action: AccountActionType) => {
    selectedAccount.value = account
    currentAction.value = action
    showAccountActionModal.value = true
  }

  // 獲取操作彈窗標題
  const getActionModalTitle = computed(() => {
    switch (currentAction.value) {
      case 'enable':
        return '啟用帳戶'
      case 'disable':
        return '停用帳戶'
      case 'delete':
        return '刪除帳戶'
      default:
        return '帳戶操作'
    }
  })

  // 獲取操作彈窗訊息
  const getActionModalMessage = computed(() => {
    if (!selectedAccount.value) return ''
    
    switch (currentAction.value) {
      case 'enable':
        return `確定要啟用帳戶「${selectedAccount.value.name}」嗎？`
      case 'disable':
        return `確定要停用帳戶「${selectedAccount.value.name}」嗎？`
      case 'delete':
        return `確定要刪除帳戶「${selectedAccount.value.name}」嗎？此操作無法復原。`
      default:
        return ''
    }
  })

  // 確認帳戶操作
  const confirmAccountAction = async () => {
    if (!selectedAccount.value || !currentAction.value) return
    
    try {
      switch (currentAction.value) {
        case 'enable':
          await accountApi.enableAccount(selectedAccount.value.id)
          message.success('帳戶已啟用')
          break
        case 'disable':
          await accountApi.disableAccount(selectedAccount.value.id)
          message.success('帳戶已停用')
          break
        case 'delete':
          await accountApi.deleteAccount(selectedAccount.value.id)
          message.success('帳戶已刪除')
          break
      }
      
      // 重新獲取帳戶列表
      await fetchAccounts()
      showAccountActionModal.value = false
    } catch (error: any) {
      console.error('Error performing account action:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      })
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error(`操作失敗: ${error.message}`)
      }
    }
  }

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
    accounts,
    showAccountModal,
    accountForm,
    currencies,
    createAccount,
    resetAccountForm,
    // 日記帳相關
    journalRecords,
    journalLoading,
    formatDate,
    formatTime,
    handleJournalEdit,
    // 帳戶詳情相關
    selectedAccount,
    showAccountDetailModal,
    showAccountActionModal,
    accountTransactions,
    transactionsLoading,
    currentAction,
    getActionModalTitle,
    getActionModalMessage,
    viewAccountDetail,
    handleAccountStatus,
    confirmAccountAction
  }
}
