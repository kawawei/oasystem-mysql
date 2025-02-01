<template>
  <div class="reimbursement">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>請款</h1>
        <div class="header-filters">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋請款單"
            class="search-input"
            size="medium"
          />
          <base-button 
            type="primary"
            @click="openAddModal"
          >
            <i class="fas fa-plus"></i>
            新增請款
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
        新增請款
      </base-button>
      <base-input 
        v-model="searchQuery"
        placeholder="搜尋請款單"
        class="search-input"
        size="medium"
      />
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
      <base-table
        :data="filteredRecords"
        :columns="[
          { key: 'date', title: '申請日期' },
          { key: 'applicant', title: '申請人' },
          { key: 'amount', title: '金額' },
          { key: 'category', title: '類別' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #status="{ row }">
          <span :class="['status-badge', row.status]">
            {{ getStatusText(row.status) }}
          </span>
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
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無請款記錄</div>
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
            <h3>{{ record.category }}</h3>
            <span :class="['status-badge', record.status]">
              {{ getStatusText(record.status) }}
            </span>
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
            <div class="info-item">
              <span class="label">申請日期：</span>
              <span class="value">{{ formatDate(record.date) }}</span>
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
          </div>
        </template>
      </base-card>
      <base-card v-if="filteredRecords.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無請款記錄</div>
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
import { useRouter } from 'vue-router'

interface ReimbursementRecord {
  id: number
  date: string
  applicant: string
  amount: number
  category: string
  status: 'pending' | 'approved' | 'rejected'
  description?: string
  attachments?: string[]
}

const searchQuery = ref('')
const records = ref<ReimbursementRecord[]>([])
const isMobile = ref(false)
const router = useRouter()

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 過濾記錄
const filteredRecords = computed(() => {
  if (!searchQuery.value) return records.value
  
  const query = searchQuery.value.toLowerCase()
  return records.value.filter(record => 
    record.applicant.toLowerCase().includes(query) ||
    record.category.toLowerCase().includes(query)
  )
})

// 格式化狀態文字
const getStatusText = (status: ReimbursementRecord['status']) => {
  const statusMap = {
    pending: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
  }
  return statusMap[status]
}

// 格式化金額
const formatAmount = (amount: number) => {
  return `NT$ ${amount.toLocaleString()}`
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

// 打開新增請款彈窗
const openAddModal = () => {
  // TODO: 實現新增請款功能
}

// 查看請款詳情
const viewDetail = (record: ReimbursementRecord) => {
  router.push({
    path: `/reimbursement/${record.id}`,
    query: { 
      applicant: record.applicant,
      category: record.category,
      status: record.status
    }
  })
}

// 在組件掛載時初始化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/reimbursement.scss';
</style> 