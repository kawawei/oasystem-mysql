<template>
  <div class="finance">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>財務管理</h1>
        <div class="header-filters">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋交易記錄"
            class="search-input"
            size="medium"
          >
            <template #prefix>
              <i class="fas fa-search"></i>
            </template>
          </base-input>
        </div>
      </div>
    </header>

    <!-- 頁籤切換 -->
    <div class="tab-container">
      <div class="tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          請款申請
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'receipt' }"
          @click="activeTab = 'receipt'"
        >
          收款管理
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          查看紀錄
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'journal' }"
          @click="activeTab = 'journal'"
        >
          日記帳
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          帳戶管理
        </div>
      </div>
      <base-button
        v-if="activeTab === 'receipt'"
        type="primary"
        @click="() => $refs.receiptManagement?.openNewReceiptModal()"
      >
        <i class="fas fa-plus"></i>
        新增收款
      </base-button>
    </div>

    <!-- 請款申請標籤頁 -->
    <pending-list
      v-if="activeTab === 'pending'"
      :isMobile="isMobile"
      :filteredRecords="filteredRecords"
      :formatAmount="formatAmount"
      :viewDetail="viewDetail"
      :handleApprove="handleApprove"
      :handleReject="handleReject"
    />

    <!-- 收款管理標籤頁 -->
    <receipt-management
      v-if="activeTab === 'receipt'"
      ref="receiptManagement"
      :receipt-records="receiptRecords"
      :loading="receiptLoading"
      :format-amount="formatAmount"
      :format-date="formatDate"
      :view-receipt-detail="viewReceiptDetail"
      :handle-delete-receipt="handleDeleteReceipt"
      :handle-confirm-receipt="handleConfirmReceipt"
      :get-currency-symbol="getCurrencySymbol"
      :open-image-preview="openImagePreview"
      :download-attachment="downloadAttachment"
      v-model:selected-receipt="selectedReceipt"
      v-model:show-receipt-detail-modal="showReceiptDetailModal"
      :accounts="accounts"
      :create-receipt="createReceipt"
      :reset-receipt-form="resetReceiptForm"
      :receipt-form="receiptForm"
      :handle-account-change="handleAccountChange"
      :trigger-receipt-upload="triggerReceiptUpload"
      :handle-receipt-file-selected="handleReceiptFileSelected"
      :remove-receipt-attachment="removeReceiptAttachment"
    />

    <!-- 查看紀錄標籤頁 -->
    <history-list
      v-if="activeTab === 'history'"
      :isMobile="isMobile"
      :filteredRecords="filteredRecords"
      :formatAmount="formatAmount"
      :viewDetail="viewDetail"
    />

    <!-- 日記帳標籤頁 -->
    <journal
      v-if="activeTab === 'journal'"
      :journalRecords="journalRecords"
      :loading="journalLoading"
      :formatDate="formatDate"
      :formatTime="formatTime"
      :formatAmount="formatAmount"
      :handleJournalEdit="handleJournalEdit"
    />

    <!-- 帳戶管理標籤頁 -->
    <account-settings
      v-if="activeTab === 'settings'"
      :accounts="accounts"
      v-model:showAccountModal="showAccountModal"
      :formatAmount="formatAmount"
      :formatDate="formatDate"
      :viewAccountDetail="viewAccountDetail"
      :handleAccountStatus="handleAccountStatus"
      :createAccount="createAccount"
      :resetAccountForm="resetAccountForm"
      :accountForm="accountForm"
      :getCurrencySymbol="getCurrencySymbol"
    />

    <!-- 駁回原因彈窗 -->
    <base-modal
      v-model="showRejectModal"
      title="駁回原因"
      width="500px"
    >
      <div class="reject-form">
        <base-input
          v-model="rejectComment"
          type="textarea"
          :rows="4"
          placeholder="請輸入駁回原因"
        />
      </div>
      <template #footer>
        <div class="modal-footer">
          <base-button @click="showRejectModal = false">取消</base-button>
          <base-button type="primary" class="reject-btn" @click="confirmReject">確定</base-button>
        </div>
      </template>
    </base-modal>

    <!-- 帳戶詳情彈窗 -->
    <base-modal
      v-model="showAccountDetailModal"
      :title="selectedAccount ? `${selectedAccount.name} - 帳戶詳情` : '帳戶詳情'"
      width="800px"
    >
      <div class="account-detail" v-if="selectedAccount">
        <div class="detail-header">
          <div class="status-info">
            <span class="status-label">狀態：</span>
            <span 
              class="status-value"
              :class="{ 'active': !selectedAccount.is_deleted, 'inactive': selectedAccount.is_deleted }"
            >
              {{ selectedAccount.is_deleted ? '已停用' : '使用中' }}
            </span>
          </div>
          <div class="balance-info">
            <span class="balance-label">當前餘額：</span>
            <span class="balance-value">
              {{ formatAmount(selectedAccount.currentBalance, selectedAccount.currency) }}
            </span>
          </div>
        </div>
        <div class="transaction-history">
          <h4>交易歷史</h4>
          <base-table
            :columns="[
              { key: 'date', title: '日期' },
              { key: 'type', title: '類型' },
              { key: 'amount', title: '金額' },
              { key: 'balance', title: '餘額' },
              { key: 'description', title: '說明' }
            ]"
            :data="accountTransactions"
            :loading="transactionsLoading"
          >
            <template #date="{ row }">
              {{ formatDate(row.date) }}
            </template>
            <template #type="{ row }">
              <span :class="{ 'income': row.type === 'income', 'expense': row.type === 'expense' }">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </span>
            </template>
            <template #amount="{ row }">
              <span :class="{ 'income': row.type === 'income', 'expense': row.type === 'expense' }">
                {{ formatAmount(row.amount, selectedAccount.currency) }}
              </span>
            </template>
            <template #balance="{ row }">
              {{ formatAmount(row.balance, selectedAccount.currency) }}
            </template>
          </base-table>
        </div>
      </div>
    </base-modal>

    <!-- 帳戶操作確認彈窗 -->
    <base-modal
      v-model="showAccountActionModal"
      :title="getActionModalTitle"
      width="400px"
    >
      <div class="confirm-content">
        <p>{{ getActionModalMessage }}</p>
        <template v-if="currentAction === 'disable'">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>停用後，此帳戶將無法進行新的交易，但保留所有歷史記錄。</span>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="modal-footer">
          <base-button @click="showAccountActionModal = false" style="margin-right: 12px;">取消</base-button>
          <base-button 
            :type="currentAction === 'enable' ? 'primary' : 'danger'"
            @click="confirmAccountAction"
          >
            確定
          </base-button>
        </div>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import useFinance from './Finance'

// 引入拆分後的組件
import PendingList from '@/views/Finance/components/PendingList.vue'
import ReceiptManagement from '@/views/Finance/components/ReceiptManagement.vue'
import HistoryList from '@/views/Finance/components/HistoryList.vue'
import Journal from '@/views/Finance/components/Journal.vue'
import AccountSettings from '@/views/Finance/components/AccountSettings.vue'

const {
  searchQuery,
  isMobile,
  showRejectModal,
  rejectComment,
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
  getActionModalTitle,
  getActionModalMessage,
  currentAction,
  confirmAccountAction,
  handleAccountStatus,
  viewAccountDetail,
  // 收款管理相關
  receiptRecords,
  viewReceiptDetail,
  handleConfirmReceipt,
  resetReceiptForm,
  createReceipt,
  receiptForm,
  receiptLoading,
  triggerReceiptUpload,
  handleReceiptFileSelected,
  removeReceiptAttachment,
  openImagePreview,
  handleAccountChange,
  getCurrencySymbol,
  handleDeleteReceipt,
  selectedReceipt,
  showReceiptDetailModal,
  downloadAttachment,
  createAccount,
  resetAccountForm,
  accountForm
} = useFinance()
</script>

<style lang="scss" scoped>
@import '@/styles/views/finance.scss';
</style> 