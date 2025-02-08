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
          />
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
          設置
        </div>
      </div>
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile && (activeTab === 'pending' || activeTab === 'history')">
      <base-table
        :data="filteredRecords"
        :columns="[
          { key: 'serialNumber', title: '單號' },
          { key: 'type', title: '類型' },
          { key: 'applicant', title: '申請人' },
          { key: 'amount', title: '金額' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #type="{ row }">
          {{ row.type === 'reimbursement' ? '請款' : '應付款項' }}
        </template>
        <template #amount="{ row }">
          {{ formatAmount(row.amount) }}
        </template>
        <template #status="{ row }">
          <status-badge :status="row.status" />
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <base-button
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              查看
            </base-button>
            <template v-if="activeTab === 'pending' && row.status === 'submitted'">
              <base-button
                type="primary"
                size="small"
                class="approve-btn"
                @click="handleApprove(row)"
              >
                簽核
              </base-button>
              <base-button
                type="primary"
                size="small"
                class="reject-btn"
                @click="handleReject(row)"
              >
                駁回
              </base-button>
            </template>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-table>
    </div>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-show="isMobile">
      <base-card
        v-for="record in filteredRecords"
        :key="record.id"
        class="record-card"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ record.serialNumber }}</h3>
            <status-badge :status="record.status" />
          </div>
        </template>
        <template #content>
          <div class="card-content">
            <div class="info-item">
              <span class="label">類型：</span>
              <span class="value">{{ record.type === 'reimbursement' ? '請款' : '應付款項' }}</span>
            </div>
            <div class="info-item">
              <span class="label">申請人：</span>
              <span class="value">{{ record.applicant }}</span>
            </div>
            <div class="info-item">
              <span class="label">金額：</span>
              <span class="value">{{ formatAmount(record.amount) }}</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="card-actions">
            <base-button
              type="primary"
              size="small"
              @click="viewDetail(record)"
            >
              查看
            </base-button>
            <template v-if="activeTab === 'pending' && record.status === 'submitted'">
              <base-button
                type="primary"
                size="small"
                class="approve-btn"
                @click="handleApprove(record)"
              >
                簽核
              </base-button>
              <base-button
                type="primary"
                size="small"
                class="reject-btn"
                @click="handleReject(record)"
              >
                駁回
              </base-button>
            </template>
          </div>
        </template>
      </base-card>
      <base-card v-if="filteredRecords.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-card>
    </div>

    <!-- 日記帳內容 -->
    <div class="journal-container" v-show="activeTab === 'journal'">
      <div class="empty-state">
        <p>日記帳功能開發中</p>
      </div>
    </div>

    <!-- 設置內容 -->
    <div class="settings-container" v-show="activeTab === 'settings'">
      <div class="settings-header">
        <h2>帳戶管理</h2>
        <base-button
          type="primary"
          @click="showAccountModal = true"
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
        >
          <div class="account-header">
            <h3>{{ account.name }}</h3>
            <span class="currency-badge">{{ account.currency }}</span>
          </div>
          <div class="account-content">
            <div class="info-item">
              <span class="label">目前金額：</span>
              <span class="value">{{ formatAmount(account.currentBalance || account.initialBalance, account.currency) }}</span>
            </div>
            <div class="info-item">
              <span class="label">初始金額：</span>
              <span class="value">{{ formatAmount(account.initialBalance, account.currency) }}</span>
            </div>
            <div class="info-item">
              <span class="label">幣種：</span>
              <span class="value">{{ account.currency }}</span>
            </div>
            <div class="info-item">
              <span class="label">建立日期：</span>
              <span class="value">{{ new Date(account.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>沒有帳戶，請點擊「新增帳戶」按鈕新增</p>
      </div>
    </div>

    <!-- 新增帳戶彈窗 -->
    <base-modal
      v-model="showAccountModal"
      title="新增帳戶"
      width="500px"
      @close="resetAccountForm"
    >
      <div class="account-form">
        <div class="form-item">
          <label>帳戶名稱</label>
          <base-input
            v-model="accountForm.name"
            placeholder="請輸入帳戶名稱"
          />
        </div>
        <div class="form-item">
          <label>幣種</label>
          <base-select
            v-model="accountForm.currency"
            :options="currencies"
            placeholder="請選擇幣種"
          />
        </div>
        <div class="form-item">
          <label>初始金額</label>
          <base-input
            v-model="accountForm.initialBalance"
            type="number"
            placeholder="請輸入初始金額"
          />
        </div>
      </div>
      <template #footer>
          <base-button type="danger" @click="showAccountModal = false">取消</base-button>
          <base-button type="primary" @click="createAccount">確定</base-button>
      </template>
    </base-modal>

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
  </div>
</template>

<script setup lang="ts">
import BaseInput from '@/common/base/Input.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseSelect from '@/common/base/Select.vue'
import useFinance from './Finance'

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
  accountForm,
  currencies,
  createAccount,
  resetAccountForm
} = useFinance()
</script>

<style lang="scss" scoped>
@import '@/styles/views/finance.scss';
</style> 