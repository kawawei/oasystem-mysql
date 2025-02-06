<template>
  <div class="reimbursement-detail">
    <!-- Debug info -->
    <div style="display: none;">
      isLoading: {{ isLoading }}
      hasRecord: {{ !!record }}
      recordType: {{ typeof record }}
    </div>
    
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      載入中...
    </div>

    <!-- 當數據載入完成時顯示內容 -->
    <template v-if="!isLoading">
      <div v-if="!!record" class="detail-wrapper">
        <!-- 頂部導航 -->
        <header class="header">
          <div class="header-content">
            <div class="back-section">
              <base-button
                type="text"
                @click="router.back()"
                class="btn-back"
              >
                <i class="fas fa-arrow-left"></i>
                返回
              </base-button>
            </div>
            <div class="action-buttons">
              <base-button
                v-if="isFromFinance && record?.status === 'submitted'"
                type="primary"
                class="approve-btn"
                @click="handleApprove"
                :loading="isProcessing"
              >
                通過
              </base-button>
              <base-button
                v-if="isFromFinance && record?.status === 'submitted'"
                type="primary"
                class="reject-btn"
                @click="handleReject"
                :loading="isProcessing"
              >
                駁回
              </base-button>
              <base-button
                v-if="canEdit"
                type="secondary"
                @click="handleEdit"
                :loading="isProcessing"
              >
                編輯
              </base-button>
              <base-button
                v-if="canEdit"
                type="primary"
                @click="handleSubmit"
                :loading="isProcessing"
              >
                提交
              </base-button>
            </div>
          </div>
        </header>

        <!-- 表格式詳情內容 -->
        <div class="detail-table">
          <div class="title-section">
            <h1 class="table-title">{{ record?.type === 'reimbursement' ? '請款單' : '應付款項單' }}</h1>
          </div>
          <table>
            <tr>
              <td class="label">申請日期</td>
              <td>{{ formatDate(record.createdAt) }}</td>
              <td class="label">申請部門</td>
              <td>
                <template v-if="isEditing && editingData">
                  <base-input
                    :model-value="editingData.submitter?.department || ''"
                    @update:model-value="value => {
                      if (editingData && editingData.submitter) {
                        editingData.submitter.department = value
                      }
                    }"
                    size="small"
                  />
                </template>
                <template v-else>
                  {{ record.submitter?.department }}
                </template>
              </td>
            </tr>
            <tr>
              <td class="label">序號</td>
              <td>{{ record.serialNumber }}</td>
              <td class="label">幣種</td>
              <td>
                <template v-if="isEditing && editingData">
                  <select 
                    :value="editingData.currency"
                    @change="event => {
                      if (editingData) {
                        editingData.currency = (event.target as HTMLSelectElement).value as 'TWD' | 'CNY'
                      }
                    }"
                    class="currency-select"
                  >
                    <option value="TWD">新台幣 (NT$)</option>
                    <option value="CNY">人民幣 (¥)</option>
                  </select>
                </template>
                <template v-else>
                  {{ record.currency === 'TWD' ? '新台幣 (NT$)' : '人民幣 (¥)' }}
                </template>
              </td>
            </tr>
            <tr>
              <td class="label">申請人</td>
              <td>{{ record.submitter?.name }}</td>
              <td class="label">簽核</td>
              <td>
                <span :class="['status-badge', record.status]">
                  {{ getStatusText(record.status) }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="label">付款帳號</td>
              <td>
                <template v-if="isEditing && editingData">
                  <base-input
                    :model-value="editingData.accountNumber"
                    @update:model-value="value => {
                      if (editingData) {
                        editingData.accountNumber = value
                      }
                    }"
                    size="small"
                  />
                </template>
                <template v-else>
                  {{ record.accountNumber }}
                </template>
              </td>
              <td class="label">支付帳號</td>
              <td>
                <template v-if="isEditing && editingData">
                  <base-input
                    :model-value="editingData.bankInfo"
                    @update:model-value="value => {
                      if (editingData) {
                        editingData.bankInfo = value
                      }
                    }"
                    size="small"
                  />
                </template>
                <template v-else>
                  {{ record.bankInfo }}
                </template>
              </td>
            </tr>
          </table>

          <!-- 編輯模式下的添加明細按鈕 -->
          <div v-if="isEditing" class="add-detail-button">
            <base-button
              type="primary"
              size="small"
              @click="addExpenseItem"
            >
              <i class="fas fa-plus"></i>
              添加明細
            </base-button>
          </div>

          <!-- 費用明細表格 -->
          <table class="expense-table">
            <thead>
              <tr>
                <th>會計科目</th>
                <th>科目名稱</th>
                <th>發票號碼</th>
                <th>摘要</th>
                <th>數量</th>
                <th>金額</th>
                <th>稅額</th>
                <th>手續費</th>
                <th>總計</th>
                <th>付款日期</th>
                <th>發票圖片</th>
                <th v-if="isEditing">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in (isEditing && editingData ? editingData.items : record.items)" :key="index">
                <td>
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="item.accountCode"
                      @update:model-value="value => updateItem(index, 'accountCode', value)"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ item.accountCode }}
                  </template>
                </td>
                <td>
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="item.accountName"
                      @update:model-value="value => updateItem(index, 'accountName', value)"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ item.accountName }}
                  </template>
                </td>
                <td>
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="item.invoiceNumber || ''"
                      @update:model-value="value => updateItem(index, 'invoiceNumber', value)"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ item.invoiceNumber || '-' }}
                  </template>
                </td>
                <td>
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="item.description"
                      @update:model-value="value => updateItem(index, 'description', value)"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ item.description }}
                  </template>
                </td>
                <td class="quantity">
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="String(item.quantity)"
                      @update:model-value="value => updateItem(index, 'quantity', Number(value))"
                      type="number"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ item.quantity }}
                  </template>
                </td>
                <td class="amount">
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="String(item.amount)"
                      @update:model-value="value => updateItem(index, 'amount', Number(value))"
                      type="number"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ formatAmount(item.amount, isEditing ? editingData?.currency : record?.currency) }}
                  </template>
                </td>
                <td class="amount">
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="String(item.tax)"
                      @update:model-value="value => updateItem(index, 'tax', Number(value))"
                      type="number"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ formatAmount(item.tax, isEditing ? editingData?.currency : record?.currency) }}
                  </template>
                </td>
                <td class="amount">
                  <template v-if="isEditing && editingData">
                    <base-input
                      :model-value="String(item.fee)"
                      @update:model-value="value => updateItem(index, 'fee', Number(value))"
                      type="number"
                      size="small"
                    />
                  </template>
                  <template v-else>
                    {{ formatAmount(item.fee, isEditing ? editingData?.currency : record?.currency) }}
                  </template>
                </td>
                <td class="amount">
                  {{ formatAmount(item.total, isEditing ? editingData?.currency : record?.currency) }}
                </td>
                <td class="date">
                  <template v-if="isEditing && editingData">
                    <input
                      type="date"
                      :value="item.date"
                      @input="event => updateItem(index, 'date', (event.target as HTMLInputElement).value)"
                      class="date-input"
                    />
                  </template>
                  <template v-else>
                    {{ item.date ? formatDate(item.date) : '-' }}
                  </template>
                </td>
                <td class="action">
                  <template v-if="isEditing && editingData">
                    <div class="upload-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        class="file-input"
                        @change="event => handleFileChange(event, index)"
                        id="file-input"
                      />
                      <label for="file-input" class="upload-button">
                        <i class="fas fa-upload"></i>
                        上傳發票
                      </label>
                    </div>
                  </template>
                  <template v-else>
                    <div v-if="item.invoiceImage" class="invoice-preview">
                      <img 
                        :src="getImageUrl(item.invoiceImage)" 
                        alt="發票圖片"
                        class="thumbnail"
                        @click="openImagePreview(getImageUrl(item.invoiceImage))"
                      />
                    </div>
                    <template v-else>
                      <span class="no-image">無發票圖片</span>
                    </template>
                  </template>
                </td>
                <td v-if="isEditing" class="action">
                  <base-button 
                    type="text" 
                    class="delete-btn"
                    @click="removeExpenseItem(index)"
                  >
                    <i class="fas fa-trash" style="color: #ff4d4f;"></i>
                  </base-button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right">合計：</td>
                <td class="amount">{{ formatAmount(totalAmount, isEditing ? editingData?.currency : record?.currency) }}</td>
                <td class="amount">{{ formatAmount(totalTax, isEditing ? editingData?.currency : record?.currency) }}</td>
                <td class="amount">{{ formatAmount(totalFee, isEditing ? editingData?.currency : record?.currency) }}</td>
                <td class="amount">{{ formatAmount(grandTotal, isEditing ? editingData?.currency : record?.currency) }}</td>
                <td colspan="2"></td>
                <td v-if="isEditing"></td>
              </tr>
            </tfoot>
          </table>

          <!-- 添加 PDF 附件區域 -->
          <div class="attachments-section" v-if="isEditing || (!isEditing && record?.attachments && record.attachments.length > 0)">
            <div class="section-header">
              <h3 class="section-title">PDF 附件</h3>
              <div v-if="isEditing" class="section-actions">
                <base-button
                  type="primary"
                  size="small"
                  @click="handleAddAttachment"
                  :loading="uploading"
                >
                  <i class="fas fa-plus"></i>
                  添加附件
                </base-button>
              </div>
            </div>
            <div class="pdf-files-list">
              <div 
                v-for="(attachment, index) in (isEditing ? editingData?.attachments : record?.attachments)" 
                :key="index" 
                class="pdf-file-card"
              >
                <div class="pdf-icon">
                  <i class="fas fa-file-pdf"></i>
                </div>
                <div class="pdf-content">
                  <div class="pdf-name">{{ attachment.originalName }}</div>
                </div>
                <div class="pdf-actions">
                  <base-button
                    type="text"
                    class="action-btn view"
                    @click="openPdfPreview(attachment.url)"
                    title="查看"
                  >
                    <i class="fas fa-eye"></i>
                  </base-button>
                  <base-button
                    v-if="isEditing"
                    type="text"
                    class="action-btn delete"
                    @click="removeAttachment(index)"
                    title="移除"
                  >
                    <i class="fas fa-times"></i>
                  </base-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 添加隱藏的文件輸入框 -->
          <input
            ref="pdfFileInput"
            type="file"
            accept=".pdf,application/pdf"
            style="display: none"
            @change="handlePdfFileChange"
          />

          <!-- 添加 PDF 預覽彈窗 -->
          <base-modal
            v-model="showPdfPreview"
            title="PDF 文件預覽"
            :width="1000"
            :show-footer="false"
            content-class="pdf-preview-modal"
          >
            <div class="pdf-preview-container">
              <iframe
                :src="pdfPreviewUrl"
                frameborder="0"
                width="100%"
                height="600px"
              ></iframe>
            </div>
          </base-modal>

          <!-- 駁回原因區塊 -->
          <div v-if="record.status === 'rejected'" class="reject-reason-section">
            <div class="reject-reason-header">
              <i class="fas fa-exclamation-circle"></i>
              駁回原因
            </div>
            <div class="reject-reason-content">
              {{ record.reviewComment || '無' }}
            </div>
          </div>

          <!-- 編輯模式下的按鈕組 -->
          <div v-if="isEditing" class="edit-actions">
            <div class="right-actions">
              <base-button
                type="secondary"
                @click="handleCancel"
                :loading="isProcessing"
              >
                取消
              </base-button>
              <base-button
                type="primary"
                @click="handleConfirm"
                :loading="isProcessing"
              >
                確認
              </base-button>
            </div>
          </div>
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
      <div v-else class="no-data">
        <i class="fas fa-exclamation-circle"></i>
        無法載入請款詳情
      </div>
    </template>

    <!-- 圖片預覽彈窗 -->
    <base-modal
      v-model="showImagePreview"
      title="發票圖片預覽"
      :width="800"
      :show-footer="false"
      content-class="image-preview-modal"
    >
      <div class="preview-image-container">
        <img :src="previewImageUrl" alt="發票預覽" class="preview-image" />
      </div>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseModal from '@/common/base/Modal.vue'
import { useReimbursementDetail } from '@/composables/useReimbursementDetail'

const router = useRouter()
const route = useRoute()

// 使用 composable
const {
  isProcessing,
  isLoading,
  isEditing,
  editingData,
  record,
  showRejectModal,
  rejectComment,
  showImagePreview,
  previewImageUrl,
  canEdit,
  totalAmount,
  totalTax,
  totalFee,
  grandTotal,
  fetchReimbursementDetail,
  getStatusText,
  formatAmount,
  formatDate,
  handleEdit,
  handleCancel,
  handleConfirm,
  handleFileChange,
  updateItem,
  handleSubmit,
  addExpenseItem,
  removeExpenseItem,
  handleApprove,
  handleReject,
  confirmReject,
  getImageUrl,
  openImagePreview,
  showPdfPreview,
  pdfPreviewUrl,
  openPdfPreview,
  handleAddAttachment,
  removeAttachment,
  handlePdfFileChange,
  uploading
} = useReimbursementDetail(route.params.id)

// 判斷是否來自財務管理頁面
const isFromFinance = computed(() => {
  return route.query.from === 'finance'
})

// 組件掛載時獲取數據
onMounted(() => {
  fetchReimbursementDetail()
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/reimbursementDetail.scss';
</style> 