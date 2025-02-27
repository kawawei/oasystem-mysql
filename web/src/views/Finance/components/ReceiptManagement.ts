// 引入基礎組件和工具 Import base components and utilities
import { ref, onMounted, h } from 'vue'
import type { Ref } from 'vue'
import { message } from '@/plugins/message'
import receiptApi from '@/services/api/receipt'
import { createApp } from 'vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseButton from '@/common/base/Button.vue'

// 定義收款記錄類型 Define receipt record type
interface ReceiptRecord {
  id: number
  receiptNumber: string
  accountId: number
  accountName: string
  currency: string
  amount: number
  payer: string
  receiptDate: string
  status: 'PENDING' | 'CONFIRMED'
  description?: string
  createdAt: string
  attachments?: Array<{
    filename: string
    originalName: string
    url: string
  }>
}

// 定義 emit 類型 Define emit types
interface Emits {
  (e: 'update:selectedReceipt', value: any): void
  (e: 'update:showReceiptDetailModal', value: boolean): void
}

// 定義 props Define props
interface Props {
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  getCurrencySymbol: (currency: string) => string
  openImagePreview: (url: string) => void
  downloadAttachment: (file: any) => void
  accounts: Array<{ id: number; name: string; currency: string }>
  handleAccountChange: (value: string) => void
  triggerReceiptUpload: () => void
  handleReceiptFileSelected: (event: Event) => void
  removeReceiptAttachment: (index: number) => void
}

export default function useReceiptManagement(props: Props, emit: Emits) {
  // 編輯模式相關 Edit mode related
  const isEditMode = ref(false)
  const editingReceipt = ref<any>(null)

  // 狀態相關 State related
  const loading = ref(false)
  const receiptRecords = ref<any[]>([])
  const selectedReceipt = ref<any>(null)
  const showReceiptDetailModal = ref(false)

  // 獲取當天的收款記錄數量 Get receipt count for today
  const getTodayReceiptCount = async () => {
    try {
      // 使用台灣時區 Use Taiwan timezone
      const now = new Date()
      const taiwanDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
      const year = taiwanDate.getFullYear()
      const month = String(taiwanDate.getMonth() + 1).padStart(2, '0')
      const day = String(taiwanDate.getDate()).padStart(2, '0')
      const dateStr = `${year}${month}${day}`
      
      console.log('Fetching receipts for date:', dateStr)
      
      // 獲取當天所有收款單號 Get all receipt numbers for today
      const response = await receiptApi.getReceipts({})
      
      if (!response.data.success) {
        throw new Error('獲取收款記錄失敗')
      }

      // 過濾出當天的收據並按收據號碼降序排序
      const todayReceipts = (response.data.data || [])
        .filter((receipt: any) => {
          if (!receipt.receiptNumber) return false
          return receipt.receiptNumber.startsWith(`C${dateStr}`)
        })
        .sort((a: any, b: any) => b.receiptNumber.localeCompare(a.receiptNumber))

      console.log('Today receipts:', todayReceipts)
      
      // 如果有收據，返回最大序號；否則返回0
      if (todayReceipts.length > 0) {
        const latestReceiptNumber = todayReceipts[0].receiptNumber
        const currentSequence = parseInt(latestReceiptNumber.slice(-3))
        return currentSequence
      }
      
      return 0
    } catch (error) {
      console.error('Error getting today receipt count:', error)
      return 0
    }
  }

  // 生成收款單號 Generate receipt number
  const generateReceiptNumber = async () => {
    try {
      // 使用台灣時區 Use Taiwan timezone
      const now = new Date()
      const taiwanDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
      const year = taiwanDate.getFullYear()
      const month = String(taiwanDate.getMonth() + 1).padStart(2, '0')
      const day = String(taiwanDate.getDate()).padStart(2, '0')
      const dateStr = `${year}${month}${day}`
      
      // 獲取當天最大序號 Get max sequence for today
      const maxSequence = await getTodayReceiptCount()
      console.log(`Current max sequence for today: ${maxSequence}`)
      
      // 序號加1 Increment sequence
      const nextSequence = maxSequence + 1
      
      // 格式化序號為3位數字 Format sequence to 3 digits
      const sequenceStr = String(nextSequence).padStart(3, '0')
      
      // 返回格式化的收款單號 Return formatted receipt number
      const receiptNumber = `C${dateStr}${sequenceStr}`
      console.log(`Generated receipt number: ${receiptNumber}`)
      return receiptNumber
    } catch (error) {
      console.error('Error generating receipt number:', error)
      message.error('生成收款單號失敗')
      return ''
    }
  }

  // 收款表單相關 Receipt form related
  const receiptForm = ref<any>({
    receiptNumber: '', // 初始化時不生成單號 Don't generate number when initializing
    accountId: '',
    amount: '',
    receiptDate: '',
    payer: '',
    description: '',
    attachments: [],
    currency: ''
  })

  // 關閉彈窗時清空選中的收款記錄 Clear selected receipt when closing modal
  const handleCloseModal = () => {
    // 更新本地狀態
    selectedReceipt.value = null
    showReceiptDetailModal.value = false
    isEditMode.value = false
    editingReceipt.value = null
    
    // 通知父組件
    emit('update:selectedReceipt', null)
    emit('update:showReceiptDetailModal', false)
  }

  // 新增收款相關 Add receipt related
  const showReceiptModal: Ref<boolean> = ref(false)

  // 處理新增收款對話框關閉 Handle close new receipt dialog
  const handleCloseNewReceipt = () => {
    showReceiptModal.value = false
    resetReceiptForm()
  }

  // 重置收款表單 Reset receipt form
  const resetReceiptForm = () => {
    receiptForm.value = {
      receiptNumber: '', // 不在這裡生成新的單號 Don't generate new number here
      accountId: '',
      amount: '',
      receiptDate: '',
      payer: '',
      description: '',
      attachments: [],
      currency: ''
    }
  }

  // 處理創建收款 Handle create receipt
  const handleCreateReceipt = async () => {
    try {
      // 表單驗證 Form validation
      if (!receiptForm.value.accountId) {
        message.error('請選擇收款帳戶')
        return
      }
      if (!receiptForm.value.amount || receiptForm.value.amount <= 0) {
        message.error('請輸入有效的收款金額')
        return
      }
      if (!receiptForm.value.receiptDate) {
        message.error('請選擇收款日期')
        return
      }
      if (!receiptForm.value.payer) {
        message.error('請輸入付款方')
        return
      }

      loading.value = true
      
      // 構建符合後端要求的數據格式 Build data format that matches backend requirements
      const requestData = {
        receiptNumber: receiptForm.value.receiptNumber, // 包含前端生成的收款單號 Include frontend generated receipt number
        receiptDate: new Date(receiptForm.value.receiptDate).toISOString(),
        amount: Number(receiptForm.value.amount),
        paymentMethod: 'BANK_TRANSFER' as const,
        payer: receiptForm.value.payer,
        description: receiptForm.value.description || '',
        accountId: Number(receiptForm.value.accountId),
        attachments: receiptForm.value.attachments || [],
        notes: '',
        receiverId: 0,
        status: 'PENDING' as const
      }

      console.log('Creating receipt with data:', requestData)
      const response = await receiptApi.createReceipt(requestData)

      if (response.data.success) {
        message.success('創建收款記錄成功')
        showReceiptModal.value = false
        resetReceiptForm()
        await fetchReceiptRecords()
      } else {
        message.error(response.data.message || '創建收款記錄失敗')
      }
    } catch (error: any) {
      console.error('Error creating receipt:', error)
      message.error(error.response?.data?.message || '創建收款記錄失敗')
    } finally {
      loading.value = false
    }
  }

  // 打開新增收款對話框 Open new receipt dialog
  const openNewReceiptModal = async () => {
    try {
      showReceiptModal.value = true
      // 重置表單 Reset form
      resetReceiptForm()
      // 生成新的收款單號 Generate new receipt number
      const receiptNumber = await generateReceiptNumber()
      if (receiptNumber) {
        receiptForm.value.receiptNumber = receiptNumber
      }
    } catch (error) {
      console.error('Error opening new receipt modal:', error)
      message.error('開啟新增收款對話框失敗')
    }
  }

  // 開始編輯收款記錄 Start editing receipt
  const startEdit = () => {
    if (!selectedReceipt.value) return
    editingReceipt.value = { 
      ...selectedReceipt.value,
      receiptDate: selectedReceipt.value.receiptDate
    }
    isEditMode.value = true
  }

  // 取消編輯 Cancel edit
  const cancelEdit = () => {
    isEditMode.value = false
    editingReceipt.value = null
  }

  // 保存編輯 Save edit
  const saveEdit = async () => {
    try {
      if (!editingReceipt.value) return

      // 表單驗證 Form validation
      if (!editingReceipt.value.accountId) {
        message.error('請選擇收款帳戶')
        return
      }
      if (!editingReceipt.value.amount || editingReceipt.value.amount <= 0) {
        message.error('請輸入有效的收款金額')
        return
      }
      if (!editingReceipt.value.receiptDate) {
        message.error('請選擇收款日期')
        return
      }
      if (!editingReceipt.value.payer) {
        message.error('請輸入付款方')
        return
      }

      loading.value = true
      const updateData = {
        ...editingReceipt.value,
        receiptDate: editingReceipt.value.receiptDate,
        amount: Number(editingReceipt.value.amount),
        accountId: Number(editingReceipt.value.accountId)
      }
      const response = await receiptApi.updateReceipt(
        editingReceipt.value.id,
        updateData
      )

      if (response.data.success) {
        message.success('更新收款成功')
        isEditMode.value = false
        editingReceipt.value = null
        await fetchReceiptRecords()
      } else {
        message.error('更新收款失敗')
      }
    } catch (error) {
      console.error('Error updating receipt:', error)
      message.error('更新收款失敗')
    } finally {
      loading.value = false
    }
  }

  // 獲取收款記錄列表 Get receipt records
  const fetchReceiptRecords = async () => {
    try {
      loading.value = true
      const response = await receiptApi.getReceipts({})
      
      // 檢查響應數據格式
      if (!response.data.success) {
        throw new Error('獲取收款記錄失敗')
      }

      const receiptsData = response.data.data || []
      
      // 將 API 返回的數據轉換為前端需要的格式
      receiptRecords.value = receiptsData.map(receipt => {
        // 找到對應的帳戶信息
        const account = props.accounts.find(acc => acc.id === receipt.accountId)
        
        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          accountId: receipt.accountId || 0,
          accountName: account?.name || '',
          currency: account?.currency || 'TWD',
          amount: receipt.amount || 0,
          payer: receipt.payer || '',
          receiptDate: receipt.receiptDate || receipt.createdAt || new Date().toISOString(),
          status: receipt.status || 'PENDING',
          description: receipt.description || '',
          createdAt: receipt.createdAt || new Date().toISOString(),
          attachments: (receipt.attachments || []).map((attachment: { fileName: string; fileUrl: string; originalName?: string }) => ({
            filename: attachment.fileName,
            originalName: attachment.originalName || attachment.fileName,
            url: attachment.fileUrl
          }))
        }
      })
      
      console.log('Component received receipt records:', receiptRecords.value)
    } catch (error: any) {
      console.error('Error fetching receipt records:', error)
      message.error(error.message || '獲取收款記錄失敗')
      receiptRecords.value = []
    } finally {
      loading.value = false
    }
  }

  // 查看收款詳情 View receipt detail
  const viewReceiptDetail = (receipt: any) => {
    selectedReceipt.value = receipt
    showReceiptDetailModal.value = true
  }

  // 刪除收款記錄 Delete receipt record
  const handleDeleteReceipt = async (receipt: ReceiptRecord) => {
    try {
      // 如果是已確認的收款，顯示確認提示 If receipt is confirmed, show confirmation prompt
      if (receipt.status === 'CONFIRMED') {
        const confirmResult = await new Promise<boolean>((resolve) => {
          const modalContainer = document.createElement('div');
          const app = createApp({
            render() {
              return h(BaseModal, {
                modelValue: true,
                title: '確認刪除',
                width: '400px',
                'onUpdate:modelValue': (value: boolean) => {
                  if (!value) {
                    resolve(false);
                    // 清理 DOM Clean up DOM
                    setTimeout(() => {
                      document.body.removeChild(modalContainer);
                      app.unmount();
                    }, 200);
                  }
                }
              }, {
                default: () => [
                  h('div', { class: 'confirm-content' }, [
                    h('div', { class: 'warning-icon' }, [
                      h('i', { class: 'fas fa-exclamation-triangle' })
                    ]),
                    h('div', { class: 'warning-message-container' }, [
                      h('p', { class: 'warning-title' }, '確定要刪除此收款記錄嗎？'),
                      h('div', { class: 'warning-details' }, [
                        h('p', null, [
                          '收款帳戶：',
                          h('span', { class: 'highlight' }, receipt.accountName)
                        ]),
                        h('p', null, [
                          '收款金額：',
                          h('span', { class: 'highlight' }, props.formatAmount(receipt.amount, receipt.currency))
                        ])
                      ]),
                      h('div', { class: 'warning-alert' }, [
                        h('i', { class: 'fas fa-exclamation-circle' }),
                        h('span', null, '刪除後將自動從帳戶中扣除對應金額，此操作無法恢復！')
                      ])
                    ])
                  ])
                ],
                footer: () => h('div', { class: 'dialog-footer' }, [
                  h(BaseButton, {
                    class: 'cancel-button',
                    onClick: () => {
                      resolve(false);
                      // 清理 DOM Clean up DOM
                      setTimeout(() => {
                        document.body.removeChild(modalContainer);
                        app.unmount();
                      }, 200);
                    }
                  }, () => '取消'),
                  h(BaseButton, {
                    type: 'danger',
                    class: 'confirm-button',
                    onClick: () => {
                      resolve(true);
                      // 清理 DOM Clean up DOM
                      setTimeout(() => {
                        document.body.removeChild(modalContainer);
                        app.unmount();
                      }, 200);
                    }
                  }, () => '確定刪除')
                ])
              });
            }
          });
          
          // 添加樣式 Add styles
          const style = document.createElement('style');
          style.textContent = `
            .confirm-content {
              padding: 20px;
              text-align: center;
            }
            .warning-icon {
              font-size: 48px;
              color: #ff4d4f;
              margin-bottom: 16px;
            }
            .warning-message-container {
              text-align: left;
            }
            .warning-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
              text-align: center;
            }
            .warning-details {
              background-color: #f5f5f5;
              border-radius: 4px;
              padding: 12px;
              margin-bottom: 16px;
            }
            .warning-details p {
              margin: 8px 0;
              color: #666;
            }
            .highlight {
              color: #1890ff;
              font-weight: bold;
              margin-left: 8px;
            }
            .warning-alert {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #ff4d4f;
              font-size: 14px;
            }
            .dialog-footer {
              display: flex;
              justify-content: flex-end;
              gap: 12px;
              padding-top: 16px;
            }
            .cancel-button {
              min-width: 80px;
            }
            .confirm-button {
              min-width: 80px;
            }
          `;
          document.head.appendChild(style);
          
          app.component('base-modal', BaseModal);
          app.component('base-button', BaseButton);
          app.mount(modalContainer);
          document.body.appendChild(modalContainer);
        });
        
        if (!confirmResult) {
          return;
        }
      }

      loading.value = true;
      const response = await receiptApi.deleteReceipt(receipt.id);
      
      // 檢查響應是否成功 Check if response is successful
      if (response.data.success) {
        // 從本地列表中移除該記錄 Remove record from local list
        receiptRecords.value = receiptRecords.value.filter(r => r.id !== receipt.id);
        message.success('刪除收款記錄成功');
        // 重新獲取最新數據 Refresh data
        await fetchReceiptRecords();
      } else {
        throw new Error(response.data.message || '刪除收款記錄失敗');
      }
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      message.error(error.message || '刪除收款記錄失敗');
      // 刪除失敗時也重新獲取數據，確保列表狀態與後端一致 Refresh data on deletion failure to ensure list state is consistent with backend
      await fetchReceiptRecords();
    } finally {
      loading.value = false;
    }
  };

  // 確認收款 Confirm receipt
  const handleConfirmReceipt = async (receipt: any) => {
    try {
      loading.value = true
      const response = await receiptApi.updateReceiptStatus(receipt.id, 'CONFIRMED')
      if (response.data.success) {
        message.success('確認收款成功')
        await fetchReceiptRecords()
      } else {
        message.error('確認收款失敗')
      }
    } catch (error) {
      console.error('Error confirming receipt:', error)
      message.error('確認收款失敗')
    } finally {
      loading.value = false
    }
  }

  // 更新帳戶信息 Update account information
  const updateAccountInfo = (accountId: string) => {
    const selectedAccount = props.accounts.find(account => account.id.toString() === accountId)
    if (selectedAccount) {
      receiptForm.value.currency = selectedAccount.currency
      console.log('Updated receipt form:', receiptForm.value)
    }
    props.handleAccountChange(accountId)
  }

  // 在組件掛載時獲取收款記錄 Get receipt records when component is mounted
  onMounted(() => {
    fetchReceiptRecords()
  })

  return {
    // 狀態 State
    loading,
    receiptRecords,
    selectedReceipt,
    showReceiptDetailModal,
    handleCloseModal,
    showReceiptModal,
    handleCloseNewReceipt,
    handleCreateReceipt,
    openNewReceiptModal,
    isEditMode,
    editingReceipt,
    startEdit,
    cancelEdit,
    saveEdit,
    receiptForm,
    fetchReceiptRecords,
    viewReceiptDetail,
    handleDeleteReceipt,
    handleConfirmReceipt,
    updateAccountInfo
  }
} 