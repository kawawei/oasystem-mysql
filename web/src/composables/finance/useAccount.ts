// 引入所需的依賴 Import required dependencies
import { ref, computed } from 'vue'
import { message } from '@/plugins/message'
import { accountApi } from '@/services/api/account'
import type { Account, AccountTransaction, AccountActionType } from '@/types/account'

// 導出帳戶管理的可組合函數 Export account management composable
export default function useAccount() {
  // 帳戶列表相關狀態 Account list related states
  const accounts = ref<Account[]>([])
  const accountsLoading = ref(false)
  const showAccountModal = ref(false)
  
  // 帳戶表單 Account form
  const accountForm = ref({
    name: '',
    currency: 'TWD',
    initialBalance: '0'
  })

  // 帳戶詳情相關 Account detail related
  const selectedAccount = ref<Account | null>(null)
  const showAccountDetailModal = ref(false)
  const showAccountActionModal = ref(false)
  const accountTransactions = ref<AccountTransaction[]>([])
  const transactionsLoading = ref(false)
  const currentAction = ref<AccountActionType | null>(null)

  // 獲取帳戶列表 Get account list
  const fetchAccounts = async () => {
    try {
      accountsLoading.value = true
      const response = await accountApi.getAccounts()
      
      if (response.data.success) {
        accounts.value = response.data.data.map(account => ({
          id: account.id,
          name: account.name,
          currency: account.currency,
          initialBalance: account.initialBalance,
          currentBalance: account.currentBalance,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          is_deleted: account.is_deleted,
          deleted_at: account.deleted_at,
          deleted_by: account.deleted_by,
          last_transaction_date: account.last_transaction_date
        }))
      } else {
        message.error(response.data.message || '獲取帳戶列表失敗 / Failed to get account list')
        accounts.value = []
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      message.error('獲取帳戶列表失敗 / Failed to get account list')
      accounts.value = []
    } finally {
      accountsLoading.value = false
    }
  }

  // 新增帳戶 Create account
  const createAccount = async () => {
    try {
      if (!accountForm.value.name.trim()) {
        message.error('請輸入帳戶名稱 / Please enter account name')
        return
      }

      const initialBalance = parseFloat(accountForm.value.initialBalance)
      if (isNaN(initialBalance)) {
        message.error('請輸入有效的金額 / Please enter valid amount')
        return
      }

      await accountApi.createAccount({
        name: accountForm.value.name,
        currency: accountForm.value.currency,
        initial_balance: initialBalance
      })
      
      message.success('新增帳戶成功 / Account created successfully')
      showAccountModal.value = false
      resetAccountForm()
      await fetchAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      message.error('新增帳戶失敗 / Failed to create account')
    }
  }

  // 重置帳戶表單 Reset account form
  const resetAccountForm = () => {
    accountForm.value = {
      name: '',
      currency: 'TWD',
      initialBalance: '0'
    }
  }

  // 查看帳戶詳情 View account detail
  const viewAccountDetail = async (account: Account) => {
    selectedAccount.value = account
    showAccountDetailModal.value = true
    await fetchAccountTransactions(account.id)
  }

  // 獲取帳戶交易記錄 Get account transactions
  const fetchAccountTransactions = async (accountId: number) => {
    try {
      transactionsLoading.value = true
      const response = await accountApi.getAccountTransactions(accountId)
      if (response.data.success) {
        accountTransactions.value = response.data.data.map(transaction => ({
          id: transaction.id,
          date: transaction.date,
          type: transaction.type,
          amount: transaction.amount,
          balance: transaction.balance,
          description: transaction.description,
          sourceType: transaction.sourceType,
          sourceId: transaction.sourceId
        }))
      } else {
        message.error(response.data.message || '獲取交易記錄失敗 / Failed to get transaction records')
        accountTransactions.value = []
      }
    } catch (error) {
      console.error('Error fetching account transactions:', error)
      message.error('獲取交易記錄失敗 / Failed to get transaction records')
      accountTransactions.value = []
    } finally {
      transactionsLoading.value = false
    }
  }

  // 處理帳戶狀態變更 Handle account status change
  const handleAccountStatus = (account: Account, action: AccountActionType) => {
    selectedAccount.value = account
    currentAction.value = action
    showAccountActionModal.value = true
  }

  // 獲取操作彈窗標題 Get action modal title
  const getActionModalTitle = computed(() => {
    switch (currentAction.value) {
      case 'enable':
        return '啟用帳戶 / Enable Account'
      case 'disable':
        return '停用帳戶 / Disable Account'
      case 'delete':
        return '刪除帳戶 / Delete Account'
      default:
        return '帳戶操作 / Account Action'
    }
  })

  // 獲取操作彈窗訊息 Get action modal message
  const getActionModalMessage = computed(() => {
    if (!selectedAccount.value) return ''
    
    switch (currentAction.value) {
      case 'enable':
        return `確定要啟用帳戶「${selectedAccount.value.name}」嗎？\nAre you sure to enable account "${selectedAccount.value.name}"?`
      case 'disable':
        return `確定要停用帳戶「${selectedAccount.value.name}」嗎？\nAre you sure to disable account "${selectedAccount.value.name}"?`
      case 'delete':
        return `確定要刪除帳戶「${selectedAccount.value.name}」嗎？此操作無法復原。\nAre you sure to delete account "${selectedAccount.value.name}"? This action cannot be undone.`
      default:
        return ''
    }
  })

  // 確認帳戶操作 Confirm account action
  const confirmAccountAction = async () => {
    if (!selectedAccount.value || !currentAction.value) return
    
    try {
      switch (currentAction.value) {
        case 'enable':
          await accountApi.enableAccount(selectedAccount.value.id)
          message.success('帳戶已啟用 / Account enabled')
          break
        case 'disable':
          await accountApi.disableAccount(selectedAccount.value.id)
          message.success('帳戶已停用 / Account disabled')
          break
        case 'delete':
          await accountApi.deleteAccount(selectedAccount.value.id)
          message.success('帳戶已刪除 / Account deleted')
          break
      }
      
      await fetchAccounts()
      showAccountActionModal.value = false
    } catch (error: any) {
      console.error('Error performing account action:', error)
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error(`操作失敗 / Operation failed: ${error.message}`)
      }
    }
  }

  return {
    // 狀態 States
    accounts,
    accountsLoading,
    showAccountModal,
    accountForm,
    selectedAccount,
    showAccountDetailModal,
    showAccountActionModal,
    accountTransactions,
    transactionsLoading,
    currentAction,
    getActionModalTitle,
    getActionModalMessage,

    // 方法 Methods
    fetchAccounts,
    createAccount,
    resetAccountForm,
    viewAccountDetail,
    handleAccountStatus,
    confirmAccountAction
  }
} 