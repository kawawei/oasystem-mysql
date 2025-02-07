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
      </div>
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseInput from '@/common/base/Input.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import { useRouter } from 'vue-router'

interface FinanceRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  applicant: string
  amount: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

const searchQuery = ref('')
const records = ref<FinanceRecord[]>([])
const isMobile = ref(false)
const router = useRouter()

// 駁回相關
const showRejectModal = ref(false)
const rejectComment = ref('')
const currentRecord = ref<FinanceRecord | null>(null)

// 當前激活的頁籤
const activeTab = ref<'pending' | 'history'>('pending')

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
const formatAmount = (amount: number) => {
  return `NT$ ${amount.toLocaleString()}`
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
watch(activeTab, () => {
  fetchRecords()
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
</script>

<style lang="scss" scoped>
@import '@/styles/views/finance.scss';

:deep(.base-table) {
  th:last-child {
    text-align: center;  // 將標題置中
    padding-right: 60px;  // 稍微往右偏移
  }
  
  td:last-child {
    text-align: right;  // 按鈕靠右對齊
    padding-right: 160px;  // 增加右側間距，讓按鈕往左移
  }
}

.actions {
  display: flex;
  gap: 12px;  // 增加按鈕之間的間距
  justify-content: flex-end;  // 按鈕靠右對齊
  padding-right: 160px;  // 增加右側間距，讓按鈕往左移
}

.card-actions {
  display: flex;
  gap: 12px;  // 增加按鈕之間的間距
  justify-content: flex-end;  // 按鈕靠右對齊
  padding-right: 160px;  // 增加右側間距，讓按鈕往左移
}

:deep(.base-button) {
  i {
    margin-right: 4px;  // 圖標和文字之間的間距
  }

  &.approve-btn {
    background-color: #52c41a;  // 使用綠色作為簽核按鈕的顏色
    border-color: #52c41a;
    
    &:hover {
      background-color: #73d13d;
      border-color: #73d13d;
    }
  }

  &.reject-btn {
    background-color: #ff4d4f;  // 使用紅色作為駁回按鈕的顏色
    border-color: #ff4d4f;
    
    &:hover {
      background-color: #ff7875;
      border-color: #ff7875;
    }
  }
}

.reject-form {
  padding: 20px;
  
  :deep(.base-input) {
    width: 100%;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.tab-container {
  margin: 20px 0;
  border-bottom: 1px solid #e8e8e8;
  
  .tabs {
    display: flex;
    gap: 20px;
    
    .tab-item {
      padding: 12px 24px;
      cursor: pointer;
      position: relative;
      color: #666;
      
      &.active {
        color: #1890ff;
        font-weight: 500;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #1890ff;
        }
      }
      
      &:hover {
        color: #40a9ff;
      }
    }
  }
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.pending {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  &.submitted {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  
  &.approved {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.rejected {
    background-color: #fff1f0;
    color: #f5222d;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
  }
}
</style> 