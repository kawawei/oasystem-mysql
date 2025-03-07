# 客戶列表頁面 - 電訪人員使用
<template>
  <div class="customer-list-page">
    <!-- 頁面標題和標籤頁區域 -->
    <div class="page-header">
      <h2>陌生客戶列表</h2>
    </div>

    <!-- 標籤頁和搜索區域容器 -->
    <div class="tab-container">
      <div class="tab-header">
        <div class="tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'list' }"
            @click="activeTab = 'list'"
          >
            客戶列表
          </div>
          <div 
            v-if="isAdmin"
            class="tab-item" 
            :class="{ active: activeTab === 'manage' }"
            @click="activeTab = 'manage'"
          >
            名單管理
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'analysis' }"
            @click="activeTab = 'analysis'"
          >
            數據分析
          </div>
        </div>
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
            v-model="selectedCity"
            placeholder="選擇縣市"
            class="city-select"
            clearable
            @change="handleAreaChange"
          >
            <el-option
              v-for="city in cities"
              :key="city.value"
              :label="city.label"
              :value="city.value"
            />
          </el-select>
          <el-select
            v-model="selectedDistrict"
            placeholder="選擇區域"
            class="district-select"
            clearable
            :disabled="!selectedCity"
            @change="handleAreaChange"
          >
            <el-option
              v-for="district in districts"
              :key="district.value"
              :label="district.label"
              :value="district.value"
            />
          </el-select>
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
          <StatusBadge
            :status="statusUtils.getStatusType(
              row.contactHistory?.[0]?.result || 'new',
              row.contactHistory?.[0]?.intention
            )"
            :text="statusUtils.getStatusText(
              row.contactHistory?.[0]?.result || 'new',
              row.contactHistory?.[0]?.intention
            )"
          />
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
                  <StatusBadge
                    :status="statusUtils.getStatusType(record.result, record.intention)"
                    :text="statusUtils.getStatusText(record.result, record.intention)"
                  />
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
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 名單管理標籤頁 -->
    <div v-if="activeTab === 'manage'">
      <customer-list-management @data-updated="handleDataUpdated" />
    </div>

    <!-- 數據分析標籤頁 -->
    <div v-if="activeTab === 'analysis'">
      <data-analysis />
    </div>

    <!-- 通話記錄對話框 -->
    <base-modal
      v-model="callModalVisible"
      title="新增通話記錄"
      width="800"
      :confirm-loading="submitting"
      @confirm="handleCallRecord"
    >
      <el-form
        ref="callFormRef"
        :model="callForm"
        :rules="callFormRules"
        label-width="100px"
      >
        <el-form-item label="通話時間" prop="callTime">
          <base-date-picker
            v-model="callForm.callTime"
            type="datetime"
            placeholder="選擇通話時間"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :default-time="new Date(2000, 1, 1, 0, 0, 0)"
          />
        </el-form-item>
        <el-form-item label="通話結果" prop="result">
          <base-select
            v-model="callForm.result"
            placeholder="請選擇通話結果"
            :options="resultOptions"
          />
        </el-form-item>
        <el-form-item 
          label="意向程度" 
          prop="intention"
          v-if="callForm.result === 'answered'"
        >
          <base-select
            v-model="callForm.intention"
            placeholder="請選擇意向程度"
            :options="intentionOptions"
          />
        </el-form-item>
        <el-form-item label="備註" prop="notes">
          <base-input
            v-model="callForm.notes"
            type="textarea"
            :rows="3"
            placeholder="請輸入通話備註"
          />
        </el-form-item>
      </el-form>
    </base-modal>

    <!-- 通話歷史記錄對話框 -->
    <base-modal
      v-model="historyModalVisible"
      title="通話歷史記錄"
      width="800"
      :show-footer="false"
    >
      <div class="history-timeline horizontal">
        <div 
          v-for="(record, index) in callHistory" 
          :key="record.id"
          class="timeline-item"
          :class="{ active: selectedHistoryRecord === record.id }"
          @click="toggleHistoryDetails(record.id)"
        >
          <div class="timeline-number">{{ index + 1 }}</div>
          <div class="timeline-content">
            <div class="timeline-time">{{ dayjs(record.callTime).format('MM-DD HH:mm') }}</div>
            <div v-if="selectedHistoryRecord === record.id" class="timeline-details">
              <div class="record-info">
                <StatusBadge
                  :status="statusUtils.getStatusType(record.result, record.intention)"
                  :text="statusUtils.getStatusText(record.result, record.intention)"
                />
                <div v-if="record.notes" class="notes">
                  {{ record.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Search, InfoFilled, Phone } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { useCustomerList } from './composables/useCustomerList'
import * as statusUtils from './utils/statusUtils'
import CustomerListManagement from './components/CustomerListManagement.vue'
import { useStore } from '@/store'
import DataAnalysis from '@/components/customer/DataAnalysis.vue'

// 配置 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Taipei')

// 標籤頁狀態
const activeTab = ref<'list' | 'manage' | 'analysis'>('list')

// 獲取用戶信息
const userStore = useStore()
const isAdmin = computed(() => {
  console.log('User Info:', userStore.user)
  console.log('User Role:', userStore.user?.role)
  console.log('Is Admin:', userStore.user?.role === 'admin')
  return userStore.user?.role === 'admin'
})

// 如果不是管理員，強制切換到客戶列表標籤
watch(() => isAdmin.value, (newValue) => {
  if (!newValue && activeTab.value === 'manage') {
    activeTab.value = 'list'
  }
}, { immediate: true })

// 選中的記錄 ID
const selectedRecord = ref<number | null>(null)

// 切換記錄詳情顯示
const toggleRecordDetails = (recordId: number) => {
  selectedRecord.value = selectedRecord.value === recordId ? null : recordId
}

// 提交狀態
const submitting = ref(false)

// 選項定義
const resultOptions = [
  { label: '已接聽', value: 'answered' },
  { label: '未接聽', value: 'no_answer' },
  { label: '忙碌中', value: 'busy' },
  { label: '空號', value: 'invalid' },
  { label: '號碼有誤', value: 'wrong_number' }
]

const intentionOptions = [
  { label: '有意願', value: 'interested' },
  { label: '無意願', value: 'not_interested' },
  { label: '考慮中', value: 'considering' },
  { label: '不相關', value: 'irrelevant' },
  { label: '已約訪', value: 'visited' }
]

// 使用組合式函數
const {
  loading,
  searchQuery,
  selectedCity,
  selectedDistrict,
  customerData,
  pagination,
  cities,
  districts,
  columns,
  callModalVisible,
  callForm,
  callFormRef,
  callFormRules,
  fetchCustomerList,
  handleSearch,
  handleAreaChange,
  handleSizeChange,
  handleCurrentChange,
  showCallModal,
  showHistoryModal,
  handleCellEdit,
  handleCallRecord,
  historyModalVisible,
  callHistory,
  selectedHistoryRecord,
  toggleHistoryDetails
} = useCustomerList()

// 處理名單數據更新
const handleDataUpdated = () => {
  // 重新獲取客戶列表數據
  fetchCustomerList()
}

// 監聽標籤頁切換，重新獲取數據
watch(activeTab, (newValue) => {
  if (newValue === 'list') {
    fetchCustomerList() // 切換到客戶列表標籤時重新獲取數據
  }
})

// 在組件掛載時獲取數據
fetchCustomerList()
</script>

<style lang="scss" scoped>
@import './styles/customer-list.scss';

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px;
}
</style> 