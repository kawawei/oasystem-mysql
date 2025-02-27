<!-- 帳戶轉帳標籤頁 Account Transfer Tab -->
<template>
  <div class="transfer-management">
    <!-- 轉帳記錄列表 Transfer Records List -->
    <div class="transfer-records">
      <base-table
        :columns="[
          { key: 'transferNumber', title: '轉帳編號' },
          { key: 'fromAccount', title: '轉出帳戶' },
          { key: 'toAccount', title: '轉入帳戶' },
          { key: 'amount', title: '金額' },
          { key: 'transferDate', title: '轉帳日期' },
          { key: 'status', title: '狀態' },
          { key: 'description', title: '備註' },
          { key: 'actions', title: '操作' }
        ]"
        :data="transferRecords"
        :loading="loading"
      >
        <template #fromAccount="{ row }">
          {{ row.fromAccountName }}
        </template>
        <template #toAccount="{ row }">
          {{ row.toAccountName }}
        </template>
        <template #amount="{ row }">
          {{ formatAmount(row.amount, row.currency) }}
        </template>
        <template #transferDate="{ row }">
          {{ formatDate(row.transferDate) }}
        </template>
        <template #status="{ row }">
          <span class="status-badge" :class="row.status">
            {{ getStatusText(row.status) }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="action-buttons">
            <base-button
              type="primary"
              size="small"
              @click="viewTransferDetail(row)"
            >
              查看
            </base-button>
            <base-button
              type="danger"
              size="small"
              @click="handleDeleteTransfer(row)"
            >
              刪除
            </base-button>
          </div>
        </template>
      </base-table>
    </div>

    <!-- 新增轉帳彈窗 New Transfer Modal -->
    <base-modal
      v-model="showTransferModal"
      title="新增轉帳"
      width="800px"
      @close="showTransferModal = false"
    >
      <div class="transfer-form">
        <!-- 轉帳單號 Transfer Number -->
        <div class="form-row">
          <div class="form-group">
            <label>轉帳單號</label>
            <base-input
              v-model="transferForm.transferNumber"
              disabled
              placeholder="系統自動生成"
            />
          </div>
        </div>

        <!-- 帳戶選擇區域 -->
        <div class="accounts-section">
          <!-- 轉出帳戶 -->
          <div class="account-column">
            <label>轉出帳戶<span class="required">*</span></label>
            <base-select
              v-model="transferForm.fromAccountId"
              :options="accountOptions"
              placeholder="請選擇轉出帳戶"
              @change="handleFromAccountChange"
            >
              <template #option="{ option }">
                <div class="account-option">
                  <span class="account-name">{{ option.name }}</span>
                  <span class="account-info">
                    <span class="currency">{{ option.currency }}</span>
                    <span class="balance">{{ props.formatAmount(option.currentBalance, option.currency) }}</span>
                  </span>
                </div>
              </template>
            </base-select>
            <div class="account-balance-display" v-if="fromAccountBalance">
              <span class="label">帳戶餘額：</span>
              <span class="amount">{{ fromAccountBalance }}</span>
            </div>
          </div>

          <!-- 轉入帳戶 -->
          <div class="account-column">
            <label>轉入帳戶<span class="required">*</span></label>
            <base-select
              v-model="transferForm.toAccountId"
              :options="filteredToAccounts"
              placeholder="請選擇轉入帳戶"
              @change="handleToAccountChange"
            >
              <template #option="{ option }">
                <div class="account-option">
                  <span class="account-name">{{ option.name }}</span>
                  <span class="account-info">
                    <span class="currency">{{ option.currency }}</span>
                    <span class="balance">{{ props.formatAmount(option.currentBalance, option.currency) }}</span>
                  </span>
                </div>
              </template>
            </base-select>
            <div class="account-balance-display" v-if="toAccountBalance">
              <span class="label">帳戶餘額：</span>
              <span class="amount">{{ toAccountBalance }}</span>
            </div>
          </div>
        </div>

        <!-- 會計科目 -->
        <div class="form-row">
          <div class="form-group">
            <label>會計科目<span class="required">*</span></label>
            <base-select
              v-model="transferForm.accountingSubject"
              :options="accountingSubjects"
              placeholder="請選擇會計科目"
            />
          </div>
        </div>

        <!-- 轉帳金額和日期 -->
        <div class="form-row">
          <div class="form-group">
            <label>轉帳金額<span class="required">*</span></label>
            <base-input
              v-model.number="transferForm.amount"
              type="number"
              placeholder="請輸入轉帳金額"
              :min="0"
              :step="0.01"
            />
          </div>
          <div class="form-group">
            <label>轉帳日期<span class="required">*</span></label>
            <base-date-picker
              v-model="transferForm.transferDate"
              type="date"
              placeholder="請選擇轉帳日期"
            />
          </div>
        </div>

        <!-- 備註 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>備註</label>
            <base-input
              v-model="transferForm.description"
              type="textarea"
              :rows="3"
              placeholder="請輸入轉帳備註"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <base-button @click="showTransferModal = false">取消</base-button>
          <base-button type="primary" @click="handleSubmitTransfer" :loading="isSubmitting">
            確認轉帳
          </base-button>
        </div>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import { message } from '@/plugins/message'

// 定義 emits Define emits
const emit = defineEmits<{
  (e: 'update:transferRecords', records: any[]): void
}>()

// 定義 props Define props
const props = defineProps<{
  accounts: Array<{
    id: number | string
    name: string
    currency: string
    currentBalance: number
    is_deleted?: boolean
  }>
  loading?: boolean
  transferRecords: Array<{
    id: number | string
    transferNumber: string
    fromAccountId: number | string
    fromAccountName: string
    toAccountId: number | string
    toAccountName: string
    amount: number
    currency: string
    transferDate: string
    status: 'pending' | 'completed' | 'failed'
    description?: string
  }>
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
}>()

// 轉換帳戶列表為選項格式，只包含已啟用的帳戶
// Convert accounts list to options format, only include enabled accounts
const accountOptions = computed(() => {
  console.log('All accounts:', props.accounts); // 調試用 Debug use
  const filteredAccounts = props.accounts.filter(account => {
    console.log('Account:', account.name, 'is_deleted:', account.is_deleted); // 調試用 Debug use
    // 包含所有未被標記為已刪除的帳戶 Include all accounts not marked as deleted
    return !account.is_deleted;
  });
  console.log('Filtered accounts:', filteredAccounts); // 調試用 Debug use
  
  return filteredAccounts.map(account => ({
    label: `${account.name} (${account.currency})`, // 修改標籤格式，添加幣種資訊 Modify label format, add currency info
    value: account.id.toString(),
    currency: account.currency,
    currentBalance: account.currentBalance,
    name: account.name
  }));
})

// 新增會計科目選項（包含科目名稱）
const accountingSubjects = [
  { label: '1112 銀行存款', value: '1112' },
  { label: '1113 零用金', value: '1113' },
  { label: '1122 應收帳款', value: '1122' },
  { label: '1139 其他應收款', value: '1139' },
]

// 修改轉帳表單，只保留一個會計科目
const transferForm = ref({
  transferNumber: '',
  fromAccountId: '',
  toAccountId: '',
  amount: '',
  transferDate: '',
  description: '',
  accountingSubject: ''
})

const isSubmitting = ref(false)
const showTransferModal = ref(false)

// 計算可選的轉入帳戶（排除已選的轉出帳戶）
// Calculate available to accounts (exclude selected from account)
const filteredToAccounts = computed(() => {
  return accountOptions.value.filter(account => account.value !== transferForm.value.fromAccountId)
})

// 計算轉出帳戶餘額
const fromAccountBalance = computed(() => {
  if (!transferForm.value.fromAccountId) return ''
  const account = props.accounts.find(acc => acc.id.toString() === transferForm.value.fromAccountId)
  if (account) {
    return props.formatAmount(account.currentBalance, account.currency)
  }
  return ''
})

// 計算轉入帳戶餘額
const toAccountBalance = computed(() => {
  if (!transferForm.value.toAccountId) return ''
  const account = props.accounts.find(acc => acc.id.toString() === transferForm.value.toAccountId)
  if (account) {
    return props.formatAmount(account.currentBalance, account.currency)
  }
  return ''
})

// 處理轉出帳戶變更
// Handle from account change
const handleFromAccountChange = () => {
  // 如果轉入帳戶與轉出帳戶相同，清空轉入帳戶
  if (transferForm.value.toAccountId === transferForm.value.fromAccountId) {
    transferForm.value.toAccountId = ''
  }
}

// 處理轉入帳戶變更
// Handle to account change
const handleToAccountChange = () => {
  // 可以在這裡添加額外的邏輯
}

// 獲取狀態文字
// Get status text
const getStatusText = (status: string) => {
  const statusMap = {
    pending: '處理中',
    completed: '已完成',
    failed: '失敗'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// 更新重置表單方法
const resetTransferForm = () => {
  transferForm.value = {
    transferNumber: '',
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    transferDate: '',
    description: '',
    accountingSubject: ''
  }
}

// 生成轉帳單號 Generate transfer number
const generateTransferNumber = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0') // 臨時使用隨機數，實際應該從後端獲取
  return `T${year}${month}${day}${sequence}`
}

// 更新 openNewTransferModal 方法
const openNewTransferModal = () => {
  resetTransferForm()
  // 生成新的轉帳單號 Generate new transfer number
  transferForm.value.transferNumber = generateTransferNumber()
  showTransferModal.value = true
}

// 更新提交方法的驗證
const handleSubmitTransfer = async () => {
  if (!transferForm.value.fromAccountId) {
    message.error('請選擇轉出帳戶')
    return
  }
  if (!transferForm.value.toAccountId) {
    message.error('請選擇轉入帳戶')
    return
  }
  const amount = parseFloat(transferForm.value.amount)
  if (!amount || amount <= 0) {
    message.error('請輸入有效的轉帳金額')
    return
  }
  if (!transferForm.value.transferDate) {
    message.error('請選擇轉帳日期')
    return
  }
  if (!transferForm.value.accountingSubject) {
    message.error('請選擇會計科目')
    return
  }

  isSubmitting.value = true
  try {
    // 獲取帳戶信息 Get account information
    const fromAccount = props.accounts.find(acc => acc.id.toString() === transferForm.value.fromAccountId)
    const toAccount = props.accounts.find(acc => acc.id.toString() === transferForm.value.toAccountId)

    // 構建新的轉帳記錄 Build new transfer record
    const newTransfer = {
      id: Date.now(), // 臨時使用時間戳作為ID Temporarily use timestamp as ID
      transferNumber: transferForm.value.transferNumber,
      fromAccountId: transferForm.value.fromAccountId,
      fromAccountName: fromAccount?.name || '',
      toAccountId: transferForm.value.toAccountId,
      toAccountName: toAccount?.name || '',
      amount: amount,
      currency: fromAccount?.currency || 'TWD',
      transferDate: transferForm.value.transferDate,
      status: 'pending',
      description: transferForm.value.description || ''
    }

    // 更新轉帳記錄列表 Update transfer records list
    emit('update:transferRecords', [...props.transferRecords, newTransfer])
    
    message.success('轉帳申請已提交')
    resetTransferForm()
    showTransferModal.value = false
  } catch (error) {
    console.error('Transfer error:', error)
    message.error('轉帳失敗，請稍後重試')
  } finally {
    isSubmitting.value = false
  }
}

// 查看轉帳詳情
// View transfer detail
const viewTransferDetail = (transfer: any) => {
  // TODO: 實現查看轉帳詳情的邏輯
  console.log('View transfer detail:', transfer)
}

// 刪除轉帳記錄
// Delete transfer record
const handleDeleteTransfer = (transfer: any) => {
  // TODO: 實現刪除轉帳記錄的邏輯
  if (confirm(`確定要刪除轉帳記錄 ${transfer.transferNumber} 嗎？`)) {
    const updatedRecords = props.transferRecords.filter(record => record.id !== transfer.id)
    emit('update:transferRecords', updatedRecords)
    message.success('轉帳記錄已刪除')
  }
}

// 暴露方法給父組件
defineExpose({
  openNewTransferModal
})
</script>

<style lang="scss" scoped>
.transfer-management {
  .transfer-form {
    padding: 24px;

    .form-row {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;

      .form-group {
        flex: 1;
        min-width: 0;

        &.full-width {
          width: 100%;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: var(--el-text-color-primary);
          font-weight: 500;

          .required {
            color: var(--el-color-danger);
            margin-left: 4px;
          }
        }

        :deep(.base-input),
        :deep(.base-select),
        :deep(.base-date-picker) {
          width: 100%;

          .el-input__wrapper {
            background-color: var(--el-fill-color-light);
            border-radius: 4px;
            padding: 1px 11px;
            height: 40px;
            line-height: 38px;
          }

          .el-input__inner {
            height: 38px;
            line-height: 38px;
            color: var(--el-text-color-regular);
          }

          &.is-disabled {
            .el-input__wrapper {
              background-color: var(--el-fill-color-light);
              border-color: var(--el-border-color-light);
              cursor: not-allowed;
            }

            .el-input__inner {
              color: var(--el-text-color-regular);
            }
          }

          &.el-textarea {
            .el-textarea__inner {
              background-color: var(--el-fill-color-light);
              border-color: var(--el-border-color-light);
              color: var(--el-text-color-regular);
              
              &:disabled {
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }

    .account-balance-display {
      margin-top: 8px;
      padding: 8px 12px;
      background-color: var(--el-fill-color-light);
      border-radius: 4px;
      font-size: 14px;

      .label {
        color: var(--el-text-color-secondary);
      }

      .amount {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }

  .account-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;

    .account-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .currency {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        background-color: var(--el-fill-color-light);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .balance {
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
  }

  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;

    &.pending {
      background-color: #fff7e6;
      color: #fa8c16;
    }

    &.completed {
      background-color: #f6ffed;
      color: #52c41a;
    }

    &.failed {
      background-color: #fff1f0;
      color: #f5222d;
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 16px;  // 增加按鈕之間的間距

    :deep(.base-button) {
      min-width: 60px;
      padding: 4px 16px;
      
      &:not(:last-child) {
        margin-right: 8px;  // 為每個按鈕（除了最後一個）添加右邊距
      }
    }
  }
}

// 新增帳戶選擇區域的樣式
.accounts-section {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;

  .account-column {
    flex: 1;
    min-width: 0;
  }
}
</style> 