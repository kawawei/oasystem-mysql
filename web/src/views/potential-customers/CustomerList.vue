# 客戶列表頁面 - 電訪人員使用
<template>
  <div class="customer-list-page">
    <!-- 頁面標題和搜索區域 -->
    <div class="page-header">
      <h2>陌生客戶列表</h2>
      <div class="search-area">
        <el-input
          v-model="searchQuery"
          placeholder="搜索客戶名稱、電話或補習班"
          class="search-input"
          :suffix-icon="Search"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        <el-select
          v-model="selectedArea"
          placeholder="選擇區域"
          class="area-select"
          @change="handleAreaChange"
        >
          <el-option
            v-for="area in areas"
            :key="area.value"
            :label="area.label"
            :value="area.value"
          />
        </el-select>
      </div>
    </div>

    <!-- 標籤頁切換 -->
    <div class="tab-container">
      <div class="tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          客戶列表
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'manage' }"
          @click="activeTab = 'manage'"
        >
          名單管理
        </div>
      </div>
    </div>

    <!-- 客戶列表標籤頁 -->
    <div v-if="activeTab === 'list'" class="table-section">
      <base-table
        :columns="columns"
        :data="customerData"
        :loading="loading"
        row-key="id"
        @cell-edit="handleCellEdit"
      >
        <!-- 狀態列 -->
        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <!-- 最近聯繫記錄列 -->
        <template #contactHistory="{ row }">
          <div class="contact-history">
            <div class="history-numbers">
              <div 
                v-for="(record, index) in (row.contactHistory || []).slice(0, 3)" 
                :key="record.id"
                class="history-number-wrapper"
              >
                <div 
                  class="history-number"
                  :class="{ active: selectedRecord === record.id }"
                  @click="toggleRecordDetails(record.id)"
                >
                  {{ index + 1 }}
                </div>
                <div class="record-time">{{ dayjs(record.callTime).format('MM-DD HH:mm') }}</div>
              </div>
            </div>
            <div v-if="selectedRecord" class="history-details">
              <div 
                v-for="record in (row.contactHistory || []).slice(0, 3)" 
                :key="record.id"
                v-show="selectedRecord === record.id"
                class="record-details"
              >
                <div class="record-info">
                  <StatusBadge :status="getResultType(record.result)" :text="getResultText(record.result)" />
                  <el-tooltip 
                    v-if="record.notes"
                    :content="record.notes" 
                    placement="top"
                    :show-after="500"
                  >
                    <el-icon class="notes-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 操作列 -->
        <template #actions="{ row }">
          <div class="action-buttons">
            <el-button 
              type="primary" 
              circle
              @click="showCallModal(row)"
            >
              <el-icon><Phone /></el-icon>
            </el-button>
            <el-button 
              type="info" 
              link 
              @click="showHistoryModal(row)"
            >
              完整記錄
            </el-button>
          </div>
        </template>

        <!-- Email 列 -->
        <template #email="{ row }">
          <el-input
            v-model="row.email"
            placeholder="請輸入 Email"
            @change="(value: string) => handleCellEdit(row, 'email', value)"
          />
        </template>

        <!-- 窗口列 -->
        <template #contact="{ row }">
          <el-input
            v-model="row.contact"
            placeholder="請輸入窗口"
            @change="(value: string) => handleCellEdit(row, 'contact', value)"
            style="max-width: 120px;"
          />
        </template>

        <!-- 備註列 -->
        <template #notes="{ row }">
          <el-tooltip
            v-if="row.notes"
            :content="row.notes"
            placement="top"
            :show-after="200"
          >
            <el-button
              type="info"
              :icon="InfoFilled"
              circle
            />
          </el-tooltip>
          <el-button
            v-else
            type="info"
            :icon="InfoFilled"
            circle
            disabled
          />
        </template>
      </base-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 名單管理標籤頁 -->
    <div v-if="activeTab === 'manage'">
      <customer-list-management />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, InfoFilled, Phone } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import BaseTable from '@/common/base/Table.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { useCustomerList } from './composables/useCustomerList'
import {
  getResultType,
  getResultText
} from './utils/statusUtils'
import CustomerListManagement from './components/CustomerListManagement.vue'

// 選中的記錄 ID
const selectedRecord = ref<number | null>(null)

// 切換記錄詳情顯示
const toggleRecordDetails = (recordId: number) => {
  selectedRecord.value = selectedRecord.value === recordId ? null : recordId
}

// 標籤頁狀態
const activeTab = ref('list')

// 使用組合式函數
const {
  loading,
  searchQuery,
  selectedArea,
  customerData,
  pagination,
  areas,
  columns,
  fetchCustomerList,
  handleSearch,
  handleAreaChange,
  handleSizeChange,
  handleCurrentChange,
  showCallModal,
  showHistoryModal,
  handleCellEdit
} = useCustomerList()

// 在組件掛載時獲取數據
fetchCustomerList()
</script>

<style lang="scss" scoped>
@import './styles/customer-list.scss';

// 標籤頁樣式
.tab-container {
  margin: 20px 0;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
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
</style> 