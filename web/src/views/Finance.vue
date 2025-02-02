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
          <base-button 
            type="primary"
            @click="openAddModal"
          >
            <i class="fas fa-plus"></i>
            新增記錄
          </base-button>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="search-section" v-show="isMobile">
      <base-button 
        type="primary"
        @click="openAddModal"
        class="btn-add"
      >
        <i class="fas fa-plus"></i>
        新增記錄
      </base-button>
      <base-input 
        v-model="searchQuery"
        placeholder="搜尋交易記錄"
        class="search-input"
        size="medium"
      />
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
      <base-table
        :data="filteredRecords"
        :columns="[
          { key: 'serialNumber', title: '單號' },
          { key: 'applicant', title: '申請人' },
          { key: 'amount', title: '金額' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #amount="{ row }">
          {{ formatAmount(row.amount) }}
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
            <base-button
              type="primary"
              size="small"
              class="approve-btn"
              @click="handleApprove(row)"
            >
              簽核
            </base-button>
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
          </div>
        </template>
        <template #content>
          <div class="card-content">
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
            <base-button
              type="primary"
              size="small"
              class="approve-btn"
              @click="handleApprove(record)"
            >
              簽核
            </base-button>
          </div>
        </template>
      </base-card>
      <base-card v-if="filteredRecords.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import { useRouter } from 'vue-router'

interface FinanceRecord {
  id: number
  serialNumber: string
  applicant: string
  amount: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

const searchQuery = ref('')
const records = ref<FinanceRecord[]>([])
const isMobile = ref(false)
const router = useRouter()

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 獲取請款記錄
const fetchRecords = async () => {
  try {
    const { data } = await reimbursementApi.getReimbursements({
      status: 'submitted'  // 只獲取待簽核的請款單
    })
    
    // 將請款數據轉換為財務記錄格式
    records.value = data.data.map((item: any) => ({
      id: item.id,
      serialNumber: item.serialNumber.replace(/^[PR]B/, (match: string) => match === 'RB' ? 'A' : 'B'),
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

// 打開新增記錄彈窗
const openAddModal = () => {
  // TODO: 實現新增記錄功能
}

// 格式化金額
const formatAmount = (amount: number) => {
  return `NT$ ${amount.toLocaleString()}`
}

// 查看詳情
const viewDetail = (record: FinanceRecord) => {
  router.push(`/reimbursement/${record.id}`)
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
  padding-right: 200px;  // 增加右側間距，讓按鈕往左移
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
}
</style> 