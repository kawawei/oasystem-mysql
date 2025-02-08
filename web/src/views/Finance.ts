import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import { accountApi } from '@/services/api/account'
import { Account } from '@/types/account'

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

export default function useFinance() {
  const searchQuery = ref('')
  const records = ref<FinanceRecord[]>([])
  const isMobile = ref(false)
  const router = useRouter()

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

  // 初始化帳戶列表
  onMounted(() => {
    fetchAccounts()
  })

  // 獲取帳戶列表
  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...');
      const response = await accountApi.getAccounts();
      console.log('Response:', response);
      
      // 直接使用 response.data
      if (response && Array.isArray(response.data)) {
        accounts.value = response.data;
        console.log('Accounts after assignment:', accounts.value);
        
        // 檢查每個賬戶的金額
        accounts.value.forEach((account, index) => {
          console.log(`Account ${index + 1}:`, {
            name: account.name,
            initialBalance: account.initialBalance,
            currentBalance: account.currentBalance,
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

  // 監聽頁籤變化
  watch(activeTab, (newTab) => {
    if (newTab === 'pending' || newTab === 'history') {
      fetchRecords()
    }
  })

  // 在組件掛載時初始化
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetchRecords()  // 獲取請款記錄
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  // 監聽頁籤變化，當切換到設置頁時獲取帳戶列表
  watch(activeTab, (newTab) => {
    if (newTab === 'settings') {
      fetchAccounts()
    } else if (newTab === 'pending' || newTab === 'history') {
      fetchRecords()
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
    accounts,
    showAccountModal,
    accountForm,
    currencies,
    createAccount,
    resetAccountForm
  }
}
