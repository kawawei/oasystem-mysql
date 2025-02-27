<!-- 收款管理標籤頁 -->
<template>
  <div class="receipt-management">
    <div class="table-container">
      <base-table
        :data="receiptRecords || []"
        :loading="loading"
        :columns="[
          { key: 'receiptNumber', title: '收款單號' },
          { key: 'accountName', title: '收款帳戶' },
          { key: 'amount', title: '金額' },
          { key: 'payer', title: '付款方' },
          { key: 'receiptDate', title: '收款日期' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #accountName="{ row }">
          {{ ensureString(row.accountName) || '-' }} ({{ ensureString(row.currency) || 'TWD' }})
        </template>
        <template #amount="{ row }">
          {{ props.formatAmount(ensureNumber(row.amount), ensureString(row.currency) || 'TWD') }}
        </template>
        <template #receiptDate="{ row }">
          {{ props.formatDate(ensureString(row.receiptDate)) }}
        </template>
        <template #status="{ row }">
          <status-badge :status="ensureStatus(row.status)" />
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <base-button
              type="primary"
              size="small"
              @click="() => viewReceiptDetail(row)"
            >
              查看
            </base-button>
            <base-button
              type="danger"
              size="small"
              @click="handleDeleteReceipt(row)"
            >
              刪除
            </base-button>
            <base-button
              v-if="ensureStatus(row.status) === 'PENDING'"
              type="primary"
              size="small"
              class="approve-btn"
              @click="handleConfirmReceipt(row)"
            >
              確認收款
            </base-button>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無收款記錄</div>
        </template>
        <template #loading>
          <div class="loading-content">
            <i class="fas fa-spinner fa-spin"></i>
            <span>載入中...</span>
          </div>
        </template>
      </base-table>
    </div>

    <!-- 收款詳情彈窗 -->
    <base-modal
      v-model="showReceiptDetailModal"
      title="收款詳情"
      width="800px"
      @close="handleCloseModal"
    >
      <div class="receipt-form" v-if="selectedReceipt">
        <!-- 收款單號和收款帳戶 -->
        <div class="form-row">
          <div class="form-group">
            <label>收款單號</label>
            <base-input
              :model-value="selectedReceipt.receiptNumber || '系統將在確認時自動生成'"
              disabled
              placeholder="系統將在確認時自動生成"
            />
          </div>
          <div class="form-group">
            <label>收款帳戶<span class="required">*</span></label>
            <template v-if="isEditMode && editingReceipt">
              <base-select
                :model-value="editingReceipt ? ensureSelectValue(editingReceipt.accountId) : ''"
                @update:model-value="value => {
                  if (editingReceipt) {
                    editingReceipt.accountId = ensureNumber(value);
                    handleAccountChange(String(value));
                  }
                }"
                :options="accounts.map(account => ({
                  value: account.id,
                  label: `${account.name} (${account.currency})`
                }))"
                placeholder="請選擇收款帳戶"
              />
            </template>
            <base-input
              v-else
              :model-value="ensureString(selectedReceipt.accountName)"
              disabled
              placeholder="請選擇收款帳戶"
            />
          </div>
        </div>

        <!-- 收款金額和收款日期 -->
        <div class="form-row">
          <div class="form-group">
            <label>收款金額<span class="required">*</span></label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">{{ props.getCurrencySymbol(ensureString(selectedReceipt.currency) || 'TWD') }}</span>
              <base-input
                v-if="isEditMode && editingReceipt"
                :model-value="editingReceipt ? String(editingReceipt.amount || '') : ''"
                @update:model-value="value => editingReceipt && (editingReceipt.amount = ensureNumber(value))"
                type="number"
                placeholder="請輸入收款金額"
              />
              <base-input
                v-else
                :model-value="formattedAmount"
                disabled
                type="text"
                placeholder="請輸入收款金額"
              />
            </div>
          </div>
          <div class="form-group">
            <label>幣種</label>
            <base-input
              :model-value="ensureString(selectedReceipt.currency ? `${getCurrencyLabel(selectedReceipt.currency)} (${selectedReceipt.currency})` : '')"
              disabled
              placeholder="選擇帳戶後自動帶入"
            />
          </div>
          <div class="form-group">
            <label>收款日期<span class="required">*</span></label>
            <base-date-picker
              v-if="isEditMode && editingReceipt"
              v-model="editingReceipt.receiptDate"
              type="date"
              placeholder="請選擇收款日期"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
            />
            <base-date-picker
              v-else
              :model-value="formattedDate"
              disabled
              type="date"
              placeholder="請選擇收款日期"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>

        <!-- 付款方 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>付款方<span class="required">*</span></label>
            <base-input
              v-if="isEditMode && editingReceipt"
              v-model="editingReceipt.payer"
              placeholder="請輸入付款方名稱"
            />
            <base-input
              v-else
              :model-value="selectedReceipt.payer"
              disabled
              placeholder="付款方"
            />
          </div>
          <div class="form-group">
            <label>建立日期</label>
            <base-input
              :model-value="formatDate(selectedReceipt?.createdAt || '')"
              disabled
              placeholder="建立日期"
            />
          </div>
          <div class="form-group">
            <label>狀態</label>
            <div class="status-wrapper">
              <status-badge :status="selectedReceipt.status" />
            </div>
          </div>
        </div>

        <!-- 收款說明 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>收款說明</label>
            <base-input
              v-if="isEditMode && editingReceipt"
              v-model="editingReceipt.description"
              type="textarea"
              :rows="3"
              placeholder="請輸入收款說明"
            />
            <base-input
              v-else
              :model-value="selectedReceipt.description || ''"
              type="textarea"
              :rows="3"
              disabled
              placeholder="請輸入收款說明"
            />
          </div>
        </div>

        <!-- 附件列表 -->
        <div class="form-row" v-if="selectedReceipt.attachments?.length">
          <div class="form-group full-width">
            <label>附件</label>
            <div class="upload-section">
              <div v-if="isEditMode" style="display: flex; justify-content: flex-end;">
                <base-button type="primary" @click="triggerReceiptUpload">
                  <i class="fas fa-plus"></i>
                  上傳附件
                </base-button>
              </div>
              <div class="attachments-list">
                <div 
                  v-for="(file, index) in (isEditMode && editingReceipt ? editingReceipt.attachments : selectedReceipt?.attachments)" 
                  :key="index"
                  class="attachment-item"
                >
                  <i class="fas fa-file"></i>
                  <span class="filename">{{ file.fileName }}</span>
                  <div class="actions">
                    <base-button
                      type="text"
                      size="small"
                      @click="openImagePreview(file.fileUrl)"
                      title="預覽"
                    >
                      <i class="fas fa-eye"></i>
                    </base-button>
                    <base-button
                      type="text"
                      size="small"
                      @click="downloadAttachment(file)"
                      title="下載"
                    >
                      <i class="fas fa-download"></i>
                    </base-button>
                    <base-button
                      v-if="isEditMode"
                      type="text"
                      size="small"
                      class="delete-btn"
                      @click="removeReceiptAttachment(index)"
                      title="刪除"
                    >
                      <i class="fas fa-trash"></i>
                    </base-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <template v-if="isEditMode">
            <base-button type="danger" @click="cancelEdit">取消</base-button>
            <base-button type="primary" @click="saveEdit">保存</base-button>
          </template>
          <template v-else>
            <base-button type="danger" @click="handleCloseModal">關閉</base-button>
            <base-button 
              v-if="selectedReceipt?.status === 'PENDING'"
              type="primary"
              @click="handleConfirmReceipt(selectedReceipt)"
            >
              確認收款
            </base-button>
            <base-button 
              v-if="selectedReceipt?.status === 'PENDING'"
              type="primary"
              @click="startEdit"
            >
              編輯
            </base-button>
          </template>
        </div>
      </template>
    </base-modal>

    <!-- 新增收款彈窗 -->
    <base-modal
      v-model="showReceiptModal"
      title="新增收款"
      width="800px"
      @close="handleCloseNewReceipt"
    >
      <div class="receipt-form">
        <!-- 收款單號和收款帳戶 -->
        <div class="form-row">
          <div class="form-group">
            <label>收款單號</label>
            <base-input
              :model-value="receiptForm.receiptNumber"
              disabled
              placeholder="系統將自動生成"
            />
          </div>
          <div class="form-group">
            <label>收款帳戶<span class="required">*</span></label>
            <base-select
              :model-value="ensureSelectValue(receiptForm.accountId)"
              @update:model-value="value => {
                receiptForm.accountId = ensureNumber(value);
                updateAccountInfo(String(value));
              }"
              :options="accounts.map(account => ({
                value: account.id,
                label: `${account.name} (${account.currency})`
              }))"
              placeholder="請選擇收款帳戶"
            />
          </div>
        </div>

        <!-- 收款金額和收款日期 -->
        <div class="form-row">
          <div class="form-group">
            <label>收款金額<span class="required">*</span></label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">{{ props.getCurrencySymbol(ensureString(receiptForm.currency) || 'TWD') }}</span>
              <base-input
                :model-value="String(receiptForm.amount || '')"
                @update:model-value="value => receiptForm.amount = ensureNumber(value)"
                type="number"
                placeholder="請輸入收款金額"
              />
            </div>
          </div>
          <div class="form-group">
            <label>幣種</label>
            <base-input
              :model-value="receiptForm.currency ? `${getCurrencyLabel(receiptForm.currency)} (${receiptForm.currency})` : '選擇帳戶後自動帶入'"
              disabled
              placeholder="選擇帳戶後自動帶入"
            />
          </div>
          <div class="form-group">
            <label>收款日期<span class="required">*</span></label>
            <base-date-picker
              v-model="receiptForm.receiptDate"
              type="date"
              placeholder="請選擇收款日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>

        <!-- 付款方 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>付款方<span class="required">*</span></label>
            <base-input
              v-model="receiptForm.payer"
              placeholder="請輸入付款方名稱"
            />
          </div>
        </div>

        <!-- 收款說明 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>收款說明</label>
            <base-input
              v-model="receiptForm.description"
              type="textarea"
              :rows="3"
              placeholder="請輸入收款說明"
            />
          </div>
        </div>

        <!-- 附件上傳 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>附件上傳</label>
            <div class="upload-section">
              <div style="display: flex; justify-content: flex-end;">
                <base-button type="primary" @click="triggerReceiptUpload">
                  <i class="fas fa-plus"></i>
                  上傳附件
                </base-button>
              </div>
              <div class="attachments-list" v-if="receiptForm.attachments?.length">
                <div 
                  v-for="(file, index) in receiptForm.attachments" 
                  :key="index"
                  class="attachment-item"
                >
                  <i class="fas fa-file"></i>
                  <span class="filename">{{ file.fileName }}</span>
                  <div class="actions">
                    <base-button
                      type="text"
                      size="small"
                      @click="openImagePreview(file.fileUrl)"
                      title="預覽"
                    >
                      <i class="fas fa-eye"></i>
                    </base-button>
                    <base-button
                      type="text"
                      size="small"
                      class="delete-btn"
                      @click="removeReceiptAttachment(index)"
                      title="刪除"
                    >
                      <i class="fas fa-trash"></i>
                    </base-button>
                  </div>
                </div>
              </div>
              <div v-else class="no-attachments">
                尚未上傳任何附件
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <base-button type="danger" @click="handleCloseNewReceipt">取消</base-button>
          <base-button type="primary" @click="handleCreateReceipt">確定</base-button>
        </div>
      </template>
    </base-modal>

    <!-- 文件上傳輸入框 -->
    <input
      ref="receiptFileInput"
      type="file"
      accept="image/*,.pdf"
      style="display: none"
      @change="handleReceiptFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import type { Receipt } from '@/services/api/receipt'
import useReceiptManagement from './ReceiptManagement'
import BaseTable from '@/common/base/Table.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import BaseModal from '@/common/base/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'

type ReceiptStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

interface Props {
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  getCurrencySymbol: (currency: string) => string
  openImagePreview: (url: string) => void
  downloadAttachment: (file: { filename: string; url: string; originalName: string }) => void
  accounts: Array<{ id: number; name: string; currency: string }>
  handleAccountChange: (value: string) => void
  triggerReceiptUpload: () => void
  handleReceiptFileSelected: (event: Event) => void
  removeReceiptAttachment: (index: number) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedReceipt', value: Receipt | null): void
  (e: 'update:showReceiptDetailModal', value: boolean): void
}>()

const {
  loading,
  receiptRecords,
  selectedReceipt,
  showReceiptDetailModal,
  handleCloseModal,
  showReceiptModal,
  handleCloseNewReceipt,
  handleCreateReceipt,
  openNewReceiptModal,
  isEditMode,
  editingReceipt,
  startEdit,
  cancelEdit,
  saveEdit,
  viewReceiptDetail,
  handleDeleteReceipt,
  handleConfirmReceipt,
  receiptForm,
  updateAccountInfo
} = useReceiptManagement(props, emit)

// 處理數值轉換的輔助函數
const ensureString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const ensureNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }
  return 0
}

const ensureStatus = (value: unknown): ReceiptStatus => {
  const status = String(value || '').toUpperCase()
  return (status === 'PENDING' || status === 'CONFIRMED' || status === 'CANCELLED') 
    ? status as ReceiptStatus 
    : 'PENDING'
}

// 計算屬性用於處理類型轉換
const formattedAmount = computed(() => {
  const amount = selectedReceipt.value?.amount
  return ensureString(amount)
})

const formattedDate = computed(() => {
  const date = selectedReceipt.value?.receiptDate
  return ensureString(date)
})

// 修改計算屬性和輔助函數
const ensureSelectValue = (value: unknown): string | number => {
  if (value === undefined || value === null) return ''
  return typeof value === 'number' ? value : String(value)
}

// 獲取幣種標籤
const getCurrencyLabel = (currency: string) => {
  const currencyMap: { [key: string]: string } = {
    'TWD': '新台幣',
    'USD': '美元',
    'CNY': '人民幣',
    'JPY': '日圓',
    'EUR': '歐元',
    'GBP': '英鎊'
  }
  return currencyMap[currency] || currency
}

// 暴露方法給父組件
defineExpose({
  openNewReceiptModal
})
</script>

<style lang="scss">
@import '@/styles/components/receipt-management.scss';
</style> 