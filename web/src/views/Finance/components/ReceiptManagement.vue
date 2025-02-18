<!-- 收款管理標籤頁 -->
<template>
  <div class="receipt-management">
    <!-- 新增收款按鈕 -->
    <div class="header-actions">
      <base-button
        type="primary"
        @click="showReceiptModal = true"
      >
        <i class="fas fa-plus"></i>
        新增收款
      </base-button>
    </div>

    <div class="table-container">
      <base-table
        :data="receiptRecords"
        :loading="loading"
        :columns="[
          { key: 'serialNumber', title: '收款單號' },
          { key: 'account', title: '收款帳戶' },
          { key: 'amount', title: '金額' },
          { key: 'payer', title: '付款方' },
          { key: 'paymentDate', title: '收款日期' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #account="{ row }">
          {{ row.accountName }} ({{ row.currency }})
        </template>
        <template #amount="{ row }">
          {{ formatAmount(row.amount, row.currency) }}
        </template>
        <template #paymentDate="{ row }">
          {{ formatDate(row.paymentDate) }}
        </template>
        <template #status="{ row }">
          <status-badge :status="row.status" />
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
              v-if="row.status === 'pending'"
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
      :model-value="showReceiptDetailModal"
      @update:model-value="(value) => emit('update:showReceiptDetailModal', value)"
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
              :model-value="selectedReceipt.serialNumber"
              disabled
              placeholder="系統自動生成"
            />
          </div>
          <div class="form-group">
            <label>收款帳戶<span class="required">*</span></label>
            <base-input
              :model-value="selectedReceipt.accountName"
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
              <div class="currency-symbol">{{ getCurrencySymbol(selectedReceipt.currency) }}</div>
              <base-input
                :model-value="String(selectedReceipt.amount)"
                disabled
                type="number"
                placeholder="請輸入收款金額"
              />
            </div>
          </div>
          <div class="form-group">
            <label>幣種</label>
            <base-input
              :model-value="selectedReceipt.currency"
              disabled
              placeholder="選擇帳戶後自動帶入"
            />
          </div>
          <div class="form-group">
            <label>收款日期<span class="required">*</span></label>
            <base-date-picker
              :model-value="selectedReceipt.paymentDate"
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
              :model-value="selectedReceipt.payer"
              disabled
              placeholder="付款方"
            />
          </div>
          <div class="form-group">
            <label>建立日期</label>
            <base-input
              :model-value="formatDate(selectedReceipt.createdAt)"
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
              <div class="attachments-list">
                <div 
                  v-for="(file, index) in selectedReceipt.attachments" 
                  :key="index"
                  class="attachment-item"
                >
                  <i class="fas fa-file"></i>
                  <span class="filename">{{ file.originalName }}</span>
                  <div class="actions">
                    <base-button
                      type="text"
                      size="small"
                      @click="openImagePreview(file.url || '')"
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <base-button type="danger" @click="handleCloseModal">關閉</base-button>
          <base-button 
            v-if="selectedReceipt?.status === 'pending'"
            type="primary"
            @click="handleConfirmReceipt(selectedReceipt)"
          >
            確認收款
          </base-button>
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
              v-model="receiptForm.serialNumber"
              disabled
              placeholder="系統自動生成"
            />
          </div>
          <div class="form-group">
            <label>收款帳戶<span class="required">*</span></label>
            <base-select
              v-model="receiptForm.accountId"
              :options="accounts.map(account => ({
                value: account.id,
                label: `${account.name} (${account.currency})`
              }))"
              placeholder="請選擇收款帳戶"
              @change="handleAccountChange"
            />
          </div>
        </div>

        <!-- 收款金額和收款日期 -->
        <div class="form-row">
          <div class="form-group">
            <label>收款金額<span class="required">*</span></label>
            <div class="amount-input-wrapper">
              <div class="currency-symbol">{{ getCurrencySymbol(receiptForm.currency) }}</div>
              <base-input
                v-model="receiptForm.amount"
                type="number"
                placeholder="請輸入收款金額"
              />
            </div>
          </div>
          <div class="form-group">
            <label>幣種</label>
            <base-input
              v-model="receiptForm.currency"
              disabled
              placeholder="選擇帳戶後自動帶入"
            />
          </div>
          <div class="form-group">
            <label>收款日期<span class="required">*</span></label>
            <base-date-picker
              v-model="receiptForm.paymentDate"
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
                  <span class="filename">{{ file.originalName }}</span>
                  <div class="actions">
                    <base-button
                      type="text"
                      size="small"
                      @click="openImagePreview(file.url || '')"
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
// 引入基礎組件
import { ref } from 'vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseDatePicker from '@/common/base/DatePicker.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import BaseSelect from '@/common/base/Select.vue'

// 定義 props
const props = defineProps<{
  receiptRecords: any[]
  loading: boolean
  formatAmount: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  viewReceiptDetail: (record: any) => void
  handleDeleteReceipt: (record: any) => void
  handleConfirmReceipt: (record: any) => void
  getCurrencySymbol: (currency: string) => string
  openImagePreview: (url: string) => void
  downloadAttachment: (file: any) => void
  selectedReceipt: any
  showReceiptDetailModal: boolean
  accounts: any[]
  createReceipt: () => Promise<void>
  resetReceiptForm: () => void
  receiptForm: any
  handleAccountChange: (value: string) => void
  triggerReceiptUpload: () => void
  handleReceiptFileSelected: (event: Event) => void
  removeReceiptAttachment: (index: number) => void
}>()

// 定義 emits
const emit = defineEmits<{
  (e: 'update:selectedReceipt', value: any): void
  (e: 'update:showReceiptDetailModal', value: boolean): void
}>()

// 關閉彈窗時清空選中的收款記錄
const handleCloseModal = () => {
  emit('update:selectedReceipt', null)
  emit('update:showReceiptDetailModal', false)
}

// 新增收款相關
const showReceiptModal = ref(false)

// 處理新增收款對話框關閉
const handleCloseNewReceipt = () => {
  showReceiptModal.value = false
  props.resetReceiptForm()
}

// 處理創建收款
const handleCreateReceipt = async () => {
  await props.createReceipt()
  if (showReceiptModal.value) {
    showReceiptModal.value = false
  }
}
</script>

<style lang="scss" scoped>
.receipt-management {
  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px;
    color: var(--el-text-color-secondary);
    
    i {
      font-size: 16px;
    }
  }

  .header-actions {
    margin-bottom: var(--spacing-md);
    display: flex;
    justify-content: flex-end;
  }
}

// 收款表單樣式
.receipt-form {
  padding: 24px;

  .form-row {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;

    .form-group {
      flex: 1;
      min-width: 0; // 防止 flex 項目溢出

      &.full-width {
        width: 100%;
      }

      label {
        display: block;
        margin-bottom: 8px;
        color: var(--el-text-color-primary);
        font-weight: 500;

        .required {
          color: var(--el-color-danger);
          margin-left: 4px;
        }
      }

      :deep(.base-input),
      :deep(.base-select),
      :deep(.base-date-picker) {
        width: 100%;

        .el-input__wrapper {
          background-color: var(--el-fill-color-light);
          border-radius: 4px;
          padding: 1px 11px;
          height: 40px;
          line-height: 38px;
        }

        .el-input__inner {
          height: 38px;
          line-height: 38px;
          color: var(--el-text-color-regular);
        }

        &.is-disabled {
          .el-input__wrapper {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-border-color-light);
            cursor: not-allowed;
          }

          .el-input__inner {
            color: var(--el-text-color-regular);
          }
        }

        // 文本域樣式
        &.el-textarea {
          .el-textarea__inner {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-border-color-light);
            color: var(--el-text-color-regular);
            
            &:disabled {
              cursor: not-allowed;
            }
          }
        }
      }

      .status-wrapper {
        padding: 9px 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 4px;
        min-height: 40px;
        display: flex;
        align-items: center;
      }
    }
  }

  .amount-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;

    .currency-symbol {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      min-width: 30px;
      text-align: center;
    }

    :deep(.base-input) {
      flex: 1;
    }
  }

  .upload-section {
    margin-top: 8px;

    .attachments-list {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      padding: 8px;
      max-height: 120px;
      overflow-y: auto;

      .attachment-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid var(--el-border-color-light);

        &:last-child {
          border-bottom: none;
        }

        i {
          font-size: 1.1rem;
          margin-right: 8px;
          color: var(--el-text-color-secondary);
        }

        .filename {
          flex: 1;
          color: var(--el-text-color-regular);
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
</style> 