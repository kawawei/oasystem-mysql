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
            :class="{ active: activeTab === 'email' }"
            @click="activeTab = 'email'"
          >
            寄送郵件
          </div>
        </div>
        <div v-if="activeTab === 'list'" class="search-area">
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
        :data="customerData.filter(customer => {
          // 如果客戶狀態是 not_interested，則不顯示
          if (customer.status === 'not_interested') {
            return false;
          }

          const latestRecord = customer.contactHistory?.[0];
          // 如果最新記錄是 removed_from_interested，則不顯示
          if (latestRecord?.result === 'removed_from_interested') {
            return false;
          }
          // 如果最新記錄是已接聽，則根據意向判斷
          if (latestRecord?.result === 'answered') {
            return latestRecord.intention === 'interested' || 
                   latestRecord.intention === 'considering' || 
                   latestRecord.intention === 'visited';
          }
          // 如果最新記錄不是已接聽，則查找最近一次有意向的記錄
          return customer.contactHistory?.some(record => 
            record.result === 'answered' && 
            (record.intention === 'interested' || 
             record.intention === 'considering' || 
             record.intention === 'visited')
          );
        })"
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
            <el-button
              v-if="!isLatestStatusPositive(row)"
              type="danger"
              :icon="Delete"
              circle
              @click="handleRemoveFromList(row)"
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
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
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

    <!-- 郵件列表標籤頁 -->
    <div v-if="activeTab === 'email'" class="email-section">
      <div class="email-header">
        <base-button type="primary" @click="showEmailModal">
          <i class="fas fa-plus"></i>
          新增郵件
        </base-button>
      </div>

      <base-table
        :loading="emailLoading"
        :data="emailList"
        :columns="emailColumns"
        row-key="id"
      >
        <!-- 狀態列 Status Column -->
        <template #status="{ row }">
          <StatusBadge
            :status="row.status"
            :text="row.status === 'draft' ? '草稿' : '已寄送'"
          />
        </template>

        <!-- 收件人列 Recipients Column -->
        <template #recipients="{ row }">
          {{ row.recipients.length }} 位收件人
        </template>

        <!-- 操作列 Actions Column -->
        <template #actions="{ row }">
          <div class="action-buttons">
            <base-button
              type="primary"
              size="small"
              @click="viewEmailDetails(row)"
            >
              {{ row.status === 'draft' ? '編輯' : '查看' }}
            </base-button>
            <base-button
              v-if="row.status === 'draft'"
              type="secondary"
              size="small"
              @click="handleEmailSend(row)"
            >
              寄出
            </base-button>
            <base-button
              v-if="row.status === 'draft'"
              type="danger"
              size="small"
              @click="deleteEmail(row)"
            >
              刪除
            </base-button>
          </div>
        </template>
      </base-table>

      <!-- 郵件分頁 Email Pagination -->
      <div class="pagination-area">
        <el-pagination
          v-model:current-page="emailPagination.current"
          v-model:page-size="emailPagination.pageSize"
          :total="emailPagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleEmailSizeChange"
          @current-change="handleEmailCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/編輯郵件對話框 Add/Edit Email Modal -->
    <base-modal
      v-model="emailModalVisible"
      :title="isEditEmail ? '編輯郵件' : '新增郵件'"
      width="1200px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :close-on-click-overlay="false"
      :confirm-loading="emailSubmitting"
      @confirm="handleEmailSubmit"
    >
      <el-form
        ref="emailFormRef"
        :model="emailForm"
        :rules="emailFormRules"
        label-width="80px"
        class="email-compose-form"
      >
        <el-form-item label="主旨" prop="subject">
          <el-input
            v-model="emailForm.subject"
            placeholder="請輸入郵件主旨"
          />
        </el-form-item>
        <el-form-item label="內容" prop="content">
          <div class="editor-wrapper">
            <div
              ref="richEditor"
              class="rich-editor"
              contenteditable
              @input="handleEditorInput"
              @paste="handleEditorPaste"
            />
          </div>
        </el-form-item>
        <el-form-item label="附件" prop="attachments">
          <div class="attachment-area">
            <el-upload
              ref="uploadRef"
              :action="uploadUrl"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              multiple
            >
              <template #trigger>
                <el-button type="primary">
                  <el-icon><Paperclip /></el-icon>
                  添加附件
                </el-button>
              </template>
              <template #tip>
                <div class="attachment-tip">
                  支持任意文件類型，單個文件不超過 25MB
                </div>
              </template>
            </el-upload>
            <!-- 已選擇的附件列表 -->
            <div v-if="emailForm.attachments?.length" class="attachment-list">
              <div 
                v-for="(file, index) in emailForm.attachments" 
                :key="index"
                class="attachment-item"
              >
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <el-icon 
                  class="delete-icon"
                  @click="removeAttachment(index)"
                >
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <base-button @click="emailModalVisible = false">取消</base-button>
          <base-button type="secondary" @click="handleEmailSubmit">
            {{ isEditEmail ? '更新' : '儲存' }}
          </base-button>
          <base-button type="primary" @click="handleEmailSendClick">
            寄送郵件
          </base-button>
        </div>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { useInterestedCustomerListView } from './scripts/interested-customer-list'
import { useEmailManagement } from './composables/useEmailManagement'
import { ElMessageBox } from 'element-plus'
import { Delete, Paperclip, Document } from '@element-plus/icons-vue'
import { message } from '@/plugins/message'
import BaseButton from '@/common/base/Button.vue'

// 定義客戶類型
interface Customer {
  id: number | string
  status?: string
  email?: string
  contactHistory?: Array<{
    id: number
    result: string
    intention?: string
  }>
}

// 標籤頁狀態
const activeTab = ref('list')

// 使用客戶列表組合式函數
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

// 使用郵件管理組合式函數
const {
  emailLoading,
  emailList,
  emailModalVisible,
  emailSubmitting,
  isEditEmail,
  emailFormRef,
  uploadRef,
  emailForm,
  emailFormRules,
  emailPagination,
  emailColumns,
  uploadUrl,
  showEmailModal,
  viewEmailDetails,
  deleteEmail,
  beforeUpload,
  handleFileChange,
  handleFileRemove,
  removeAttachment,
  formatFileSize,
  handleEmailSubmit,
  handleEmailSizeChange,
  handleEmailCurrentChange,
  handleEmailSend
} = useEmailManagement()

// 編輯器相關 Editor related
const richEditor = ref<HTMLElement | null>(null)

// 監聽編輯器內容變更
const handleEditorInput = () => {
  if (richEditor.value) {
    emailForm.value.content = richEditor.value.innerHTML
  }
}

// 處理編輯器貼上
const handleEditorPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// 從意向列表中移除
const handleRemoveFromList = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      '確定要將此客戶從意向列表中移除嗎？',
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/customers/${row.id}/remove-from-interested`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('移除失敗')
    }

    message.success('已從意向列表中移除')
    fetchCustomerList() // 重新獲取列表數據
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error:', error)
      message.error('移除失敗')
    }
  }
}

// 檢查最新狀態是否為正面意向（有意願、考慮中、已約訪）
const isLatestStatusPositive = (row: Customer): boolean => {
  const latestRecord = row.contactHistory?.[0]
  if (latestRecord?.result === 'answered') {
    return ['interested', 'considering', 'visited'].includes(latestRecord.intention || '')
  }
  return false
}

// 添加一個包裝函數來處理發送郵件的點擊事件
// Add a wrapper function to handle email send click event
const handleEmailSendClick = () => {
  handleEmailSend()
}

// 在組件掛載時獲取數據
fetchCustomerList()
</script>

<style lang="scss" scoped>
@import './styles/customer-list.scss';

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;  // 添加按鈕之間的間隔
}
</style> 