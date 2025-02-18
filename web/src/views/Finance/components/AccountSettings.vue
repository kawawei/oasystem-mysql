<!-- 帳戶管理標籤頁 -->
<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>帳戶管理</h2>
      <base-button
        type="primary"
        @click="handleAddAccount"
      >
        新增帳戶
      </base-button>
    </div>

    <!-- 帳戶列表 -->
    <div class="accounts-list" v-if="accounts && accounts.length > 0">
      <div 
        v-for="account in accounts" 
        :key="account.id"
        class="account-card"
        :class="{ 'disabled': account.is_deleted }"
      >
        <div class="account-header">
          <div class="account-title">
            <h3>{{ account.name }}</h3>
            <span class="currency-badge">{{ account.currency }}</span>
            <span 
              class="status-badge"
              :class="{ 'active': !account.is_deleted, 'inactive': account.is_deleted }"
            >
              {{ account.is_deleted ? '已停用' : '使用中' }}
            </span>
          </div>
          <div class="account-actions">
            <base-button
              type="text"
              size="small"
              class="action-btn view"
              @click="viewAccountDetail(account)"
              title="查看詳情"
            >
              <i class="fas fa-eye"></i>
            </base-button>
            <base-button
              v-if="!account.is_deleted"
              type="text"
              size="small"
              class="action-btn disable"
              @click="handleAccountStatus(account, 'disable')"
              title="停用帳戶"
            >
              <i class="fas fa-ban"></i>
            </base-button>
            <base-button
              v-if="account.is_deleted"
              type="text"
              size="small"
              class="action-btn enable"
              @click="handleAccountStatus(account, 'enable')"
              title="啟用帳戶"
            >
              <i class="fas fa-check-circle"></i>
            </base-button>
            <base-button
              v-if="!account.hasTransactions"
              type="text"
              size="small"
              class="action-btn delete"
              @click="handleAccountStatus(account, 'delete')"
              title="刪除帳戶"
            >
              <i class="fas fa-trash"></i>
            </base-button>
          </div>
        </div>
        <div class="account-content">
          <div class="info-item">
            <span class="label">目前金額：</span>
            <span class="value" :class="{ 'disabled-text': account.is_deleted }">
              {{ formatAmount(account.currentBalance || account.initialBalance, account.currency) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">初始金額：</span>
            <span class="value" :class="{ 'disabled-text': account.is_deleted }">
              {{ formatAmount(account.initialBalance, account.currency) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">幣種：</span>
            <span class="value">{{ account.currency }}</span>
          </div>
          <div class="info-item">
            <span class="label">建立日期：</span>
            <span class="value">{{ formatDate(account.createdAt) }}</span>
          </div>
          <div class="info-item" v-if="account.is_deleted">
            <span class="label">停用日期：</span>
            <span class="value">{{ formatDate(account.deletedAt) }}</span>
          </div>
          <div class="info-item" v-if="account.lastTransactionDate">
            <span class="label">最後交易：</span>
            <span class="value">{{ formatDate(account.lastTransactionDate) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>沒有帳戶，請點擊「新增帳戶」按鈕新增</p>
    </div>

    <!-- 新增帳戶彈窗 -->
    <base-modal
      :model-value="showAccountModal"
      @update:model-value="value => emit('update:showAccountModal', value)"
      title="新增帳戶"
      width="500px"
      @close="resetAccountForm"
    >
      <div class="account-form">
        <div class="form-item">
          <label>帳戶名稱<span class="required">*</span></label>
          <base-input
            v-model="accountForm.name"
            placeholder="請輸入帳戶名稱"
          />
        </div>
        <div class="form-item">
          <label>幣種<span class="required">*</span></label>
          <base-select
            v-model="accountForm.currency"
            :options="currencies"
            placeholder="請選擇幣種"
          />
        </div>
        <div class="form-item">
          <label>初始金額<span class="required">*</span></label>
          <div class="amount-input-wrapper">
            <div class="currency-symbol">{{ getCurrencySymbol(accountForm.currency) }}</div>
            <base-input
              v-model="accountForm.initialBalance"
              type="number"
              placeholder="請輸入初始金額"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <base-button @click="emit('update:showAccountModal', false)">取消</base-button>
          <base-button type="primary" @click="createAccount">確定</base-button>
        </div>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
// 引入基礎組件
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseModal from '@/common/base/Modal.vue'
import type { AccountActionType } from '@/types/account'

// 支援的幣種列表
const currencies = [
  { value: 'TWD', label: '新台幣' },
  { value: 'USD', label: '美元' },
  { value: 'CNY', label: '人民幣' },
  { value: 'JPY', label: '日圓' },
  { value: 'EUR', label: '歐元' },
  { value: 'GBP', label: '英鎊' },
]

// 定義 props
defineProps<{
  accounts: any[]
  showAccountModal: boolean
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  viewAccountDetail: (account: any) => void
  handleAccountStatus: (account: any, action: AccountActionType) => void
  createAccount: () => void
  resetAccountForm: () => void
  accountForm: {
    name: string
    currency: string
    initialBalance: string
  }
  getCurrencySymbol: (currency: string) => string
}>()

// 定義 emits
const emit = defineEmits<{
  (e: 'update:showAccountModal', value: boolean): void
}>()

// 處理新增帳戶按鈕點擊
const handleAddAccount = () => {
  emit('update:showAccountModal', true)
}
</script>

<style lang="scss" scoped>
.settings-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid #f0f0f0;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        width: 4px;
        height: 24px;
        background: var(--el-color-primary);
        border-radius: 2px;
      }
    }
  }

  .accounts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
    margin-top: var(--spacing-lg);
  }

  .account-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    &.disabled {
      background-color: #fafafa;
      border: 1px solid #f5f5f5;

      .account-header {
        background-color: #f5f5f5;
      }

      .disabled-text {
        color: #999;
      }
    }

    .account-header {
      padding: 16px 20px;
      background: #f8faff;
      border-bottom: 1px solid #f0f0f0;

      .account-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .currency-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          background: white;
          color: var(--el-color-primary);
          border: 1px solid var(--el-color-primary-light-3);
          font-weight: 500;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;

          &.active {
            background: #f6ffed;
            color: #52c41a;
            border: 1px solid #b7eb8f;
          }

          &.inactive {
            background: #fff1f0;
            color: #ff4d4f;
            border: 1px solid #ffa39e;
          }
        }
      }

      .account-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;

        .action-btn {
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s ease;

          i {
            font-size: 16px;
          }

          &.view {
            color: var(--el-color-primary);
            &:hover {
              background: var(--el-color-primary-light-9);
            }
          }

          &.disable {
            color: #ff4d4f;
            &:hover {
              background: #fff1f0;
            }
          }

          &.enable {
            color: #52c41a;
            &:hover {
              background: #f6ffed;
            }
          }

          &.delete {
            color: #ff4d4f;
            &:hover {
              background: #fff1f0;
            }
          }
        }
      }
    }

    .account-content {
      padding: 20px;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px dashed #f0f0f0;

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        &:first-child {
          padding-top: 0;
        }

        .label {
          color: #666;
          font-size: 14px;
        }

        .value {
          font-size: 15px;
          font-weight: 500;
          color: var(--el-text-color-primary);

          &.amount {
            color: var(--el-color-primary);
            font-size: 18px;
            font-weight: 600;
          }

          &.disabled-text {
            color: #999;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: #666;
    font-size: 16px;
    background: #fafafa;
    border-radius: 8px;
    margin-top: 24px;

    i {
      font-size: 48px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }

    p {
      margin: 8px 0 0;
      color: #999;
    }
  }
}

// 帳戶表單樣式
.account-form {
  padding: var(--spacing-lg);

  .form-item {
    margin-bottom: var(--spacing-md);

    label {
      display: block;
      margin-bottom: var(--spacing-sm);
      color: var(--el-text-color-primary);
      font-weight: 500;

      .required {
        color: var(--color-error);
        margin-left: 4px;
      }
    }

    :deep(.base-input),
    :deep(.base-select) {
      width: 100%;
    }
  }
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  .currency-symbol {
    font-size: 18px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    min-width: 30px;
    text-align: center;
  }

  .base-input {
    flex: 1;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-light);
}
</style> 