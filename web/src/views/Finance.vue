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
          { key: 'date', title: '日期' },
          { key: 'type', title: '類型' },
          { key: 'amount', title: '金額' },
          { key: 'category', title: '類別' },
          { key: 'description', title: '描述' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #empty>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-table>
    </div>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-show="isMobile">
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

interface FinanceRecord {
  id: number
  date: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
}

const searchQuery = ref('')
const records = ref<FinanceRecord[]>([])
const isMobile = ref(false)

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 過濾記錄
const filteredRecords = computed(() => {
  if (!searchQuery.value) return records.value
  
  const query = searchQuery.value.toLowerCase()
  return records.value.filter(record => 
    record.description.toLowerCase().includes(query) ||
    record.category.toLowerCase().includes(query)
  )
})

// 打開新增記錄彈窗
const openAddModal = () => {
  // TODO: 實現新增記錄功能
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
@import '@/styles/views/finance.scss';
</style> 