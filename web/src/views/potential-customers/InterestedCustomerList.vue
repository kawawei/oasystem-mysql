# 意向客戶列表頁面 - 電訪人員使用
<template>
  <div class="customer-list-page">
    <!-- 頁面標題區域 -->
    <div class="page-header">
      <h2>意向客戶列表</h2>
    </div>

    <!-- 標籤頁和搜索區域容器 -->
    <div class="tab-container">
      <div class="tab-header">
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

    <!-- 客戶列表區域 -->
    <div class="table-section">
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
            :status="getStatusType(
              row.contactHistory?.[0]?.result || 'new',
              row.contactHistory?.[0]?.intention
            )"
            :text="getStatusText(
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
                  :class="{ active: selectedHistoryRecord === record.id }"
                  @click="toggleHistoryDetails(record.id)"
                >
                  {{ index + 1 }}
                </div>
                <div class="record-time">{{ dayjs(record.callTime).format('MM-DD HH:mm') }}</div>
              </div>
            </div>
            <div v-if="selectedHistoryRecord" class="history-details">
              <div 
                v-for="record in (row.contactHistory || []).slice(0, 3)" 
                :key="record.id"
                v-show="selectedHistoryRecord === record.id"
                class="record-details"
              >
                <div class="record-info">
                  <StatusBadge
                    :status="getStatusType(record.result, record.intention)"
                    :text="getStatusText(record.result, record.intention)"
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
              :icon="Phone"
              circle
              @click="showCallModal(row)"
            />
            <span 
              class="record-text"
              @click="showHistoryModal(row)"
            >完整記錄</span>
          </div>
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

        <!-- Email列 -->
        <template #email="{ row }">
          <el-input
            v-model="row.email"
            placeholder="請輸入Email"
            @change="(value: string) => handleCellEdit(row, 'email', value)"
            style="max-width: 200px;"
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

      <!-- 分頁 -->
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

    <!-- 通話記錄表單對話框 -->
    <base-modal
      v-model="callModalVisible"
      title="添加通話記錄"
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
            placeholder="請選擇通話時間"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="通話結果" prop="result">
          <base-select
            v-model="callForm.result"
            :options="resultOptions"
            placeholder="請選擇通話結果"
          />
        </el-form-item>
        <el-form-item 
          label="意向程度" 
          prop="intention"
          v-if="callForm.result === 'answered'"
        >
          <base-select
            v-model="callForm.intention"
            :options="intentionOptions"
            placeholder="請選擇意向程度"
          />
        </el-form-item>
        <el-form-item label="備註" prop="notes">
          <base-input
            v-model="callForm.notes"
            type="textarea"
            :rows="4"
            placeholder="請輸入備註"
          />
        </el-form-item>
      </el-form>
    </base-modal>

    <!-- 通話記錄歷史對話框 -->
    <base-modal
      v-model="historyModalVisible"
      title="通話記錄歷史"
      width="800"
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
                  :status="getStatusType(record.result, record.intention)"
                  :text="getStatusText(record.result, record.intention)"
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
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { useInterestedCustomerListView } from './scripts/interested-customer-list'

const {
  submitting,
  loading,
  searchQuery,
  selectedCity,
  selectedDistrict,
  customerData,
  pagination,
  cities,
  districts,
  columns,
  resultOptions,
  intentionOptions,
  callModalVisible,
  callForm,
  callFormRef,
  callFormRules,
  historyModalVisible,
  callHistory,
  selectedHistoryRecord,
  fetchCustomerList,
  handleSearch,
  handleAreaChange,
  handleSizeChange,
  handleCurrentChange,
  showCallModal,
  showHistoryModal,
  handleCellEdit,
  handleCallRecord,
  toggleHistoryDetails,
  getStatusType,
  getStatusText,
  dayjs,
  Search,
  Phone,
  InfoFilled
} = useInterestedCustomerListView()

// 在組件掛載時獲取數據
fetchCustomerList()
</script>

<style lang="scss">
@import './styles/customer-list.scss';
</style> 