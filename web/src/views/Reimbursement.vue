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
        :data="paginatedRecords"
        :columns="[
          { key: 'serialNumber', title: '單號' },
          { key: 'type', title: '類型' },
          { key: 'totalAmount', title: '總金額' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #type="{ row }">
          {{ row.type === 'reimbursement' ? '請款' : '應付款項' }}
        </template>
        <template #totalAmount="{ row }">
          {{ formatAmount(row.totalAmount, row.currency) }}
        </template>
        <template #status="{ row }">
          <status-badge :status="row.status" />
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
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              @click="submitRecord(row)"
            >
              提交
            </base-button>
            <base-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="removeRecord(row)"
            >
              移除
            </base-button>
            <base-button
              v-if="row.status === 'rejected'"
              type="primary"
              size="small"
              @click="() => handleCopyAndCreate(row)"
            >
              複製並新建
            </base-button>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無請款記錄</div>
        </template>
      </base-table>
      <!-- 添加分頁組件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-show="isMobile">
      <base-card
        v-for="record in paginatedRecords"
        :key="record.id"
        class="record-card"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ record.serialNumber }}</h3>
            <status-badge :status="record.status" />
          </div>
        </template>
        <template #content>
          <div class="card-content">
            <div class="info-item">
              <span class="label">申請人：</span>
              <span class="value">{{ record.submitter?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">請款人：</span>
              <span class="value">{{ record.payee }}</span>
            </div>
            <div class="info-item">
              <span class="label">類型：</span>
              <span class="value">{{ record.type === 'reimbursement' ? '請款' : '應付款項' }}</span>
            </div>
            <div class="info-item">
              <span class="label">總金額：</span>
              <span class="value">{{ formatAmount(record.totalAmount, record.currency) }}</span>
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
              v-if="record.status === 'pending'"
              type="primary"
              size="small"
              @click="submitRecord(record)"
            >
              提交
            </base-button>
            <base-button
              v-if="record.status === 'rejected'"
              type="primary"
              size="small"
              @click="() => handleCopyAndCreate(record)"
            >
              複製並新建
            </base-button>
          </div>
        </template>
      </base-card>
      <base-card v-if="paginatedRecords.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無請款記錄</div>
        </template>
      </base-card>
    </div>

    <!-- 新增請款對話框 -->
    <base-modal
      v-model="showAddModal"
      title="新增請款單"
      size="large"
      :width="1400"
      :show-footer="false"
      content-class="reimbursement-modal"
    >
      <div class="form-container">
        <!-- 請款類型選擇 -->
        <div class="form-group">
          <label>請款類型</label>
          <el-radio-group v-model="formData.type">
            <el-radio :value="'reimbursement'">請款</el-radio>
            <el-radio :value="'payable'">應付</el-radio>
          </el-radio-group>
        </div>

        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label>單號</label>
              <base-input 
                v-model="formData.serialNumber" 
                disabled 
                placeholder="系統自動生成"
              />
            </div>
            <div class="form-group">
              <label>標題<span class="required">*</span></label>
              <base-input 
                v-model="formData.title" 
                placeholder="請輸入標題" 
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>請款人<span class="required">*</span></label>
              <base-input 
                v-model="formData.payee" 
                placeholder="請輸入請款人" 
              />
            </div>
            <div class="form-group">
              <label>付款對象<span class="required">*</span></label>
              <base-input 
                v-model="formData.paymentTarget" 
                placeholder="請輸入付款對象" 
              />
            </div>
            <div class="form-group">
              <label>付款帳號<span class="required">*</span></label>
              <base-input 
                v-model="formData.accountNumber" 
                placeholder="請輸入付款帳號" 
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>支付帳號</label>
              <base-input 
                v-model="formData.bankInfo" 
                placeholder="由財務人員填寫"
                disabled
              />
            </div>
            <div class="form-group">
              <label>幣種<span class="required">*</span></label>
              <el-select v-model="formData.currency" style="width: 100%">
                <el-option label="新台幣" value="TWD" />
                <el-option label="人民幣" value="CNY" />
              </el-select>
            </div>
          </div>
          <div class="form-row" v-if="formData.type === 'payable'">
            <div class="form-group">
              <label>付款日期<span class="required">*</span></label>
              <el-date-picker
                v-model="formData.paymentDate"
                type="date"
                placeholder="選擇付款日期"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </div>
            <div class="form-group">
              <!-- 預留空間保持對稱 -->
            </div>
          </div>
        </div>

        <!-- 費用明細 -->
        <div class="form-section">
          <div class="section-header">
            <h3>費用明細</h3>
            <div class="section-actions">
              <base-button type="primary" size="small" @click="handleAddAttachment">
                <i class="fas fa-paperclip"></i>
                添加附件
              </base-button>
              <base-button type="primary" size="small" @click="addExpenseItem">
                <i class="fas fa-plus"></i>
                添加明細
              </base-button>
            </div>
          </div>
          
          <!-- 添加 PDF 文件顯示區域 -->
          <div class="pdf-files-list">
            <div v-for="(file, index) in selectedPdfFiles" :key="index" class="pdf-file-card">
              <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-content">
                <div class="pdf-name">{{ file.name }}</div>
                <div class="pdf-size">{{ formatFileSize(file.file.size) }}</div>
              </div>
              <div class="pdf-actions">
                <base-button
                  type="text"
                  class="action-btn view"
                  @click="viewPdfFile(index)"
                  title="查看"
                >
                  <i class="fas fa-eye"></i>
                </base-button>
                <base-button
                  type="text"
                  class="action-btn delete"
                  @click="removePdfFile(index)"
                  title="移除"
                >
                  <i class="fas fa-times"></i>
                </base-button>
              </div>
            </div>
          </div>

          <div class="expense-table">
            <table>
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
                  <th>操作</th>
                  <th>發票圖片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formData.items" :key="index">
                  <td>
                    <base-input 
                      v-model="item.accountCode"
                      placeholder="由財務人員填寫"
                      disabled
                    />
                  </td>
                  <td>
                    <base-input 
                      v-model="item.accountName" 
                      placeholder="由財務人員填寫"
                      disabled
                    />
                  </td>
                  <td>
                    <base-input
                      v-model="item.invoiceNumber"
                      placeholder="發票號碼"
                    />
                  </td>
                  <td>
                    <base-input 
                      v-model="item.description" 
                      placeholder="請輸入摘要" 
                    />
                  </td>
                  <td>
                    <base-input 
                      :model-value="String(item.quantity)"
                      @update:model-value="value => item.quantity = Number(value)"
                      type="number"
                      placeholder="數量" 
                    />
                  </td>
                  <td>
                    <base-input 
                      :model-value="String(item.amount)"
                      @update:model-value="value => item.amount = Number(value)"
                      type="number"
                      placeholder="金額" 
                    />
                  </td>
                  <td>
                    <base-input 
                      :model-value="String(item.tax)"
                      @update:model-value="value => item.tax = Number(value)"
                      type="number"
                      placeholder="稅額" 
                    />
                  </td>
                  <td>
                    <base-input 
                      :model-value="String(item.fee)"
                      @update:model-value="value => item.fee = Number(value)"
                      type="number"
                      placeholder="手續費" 
                    />
                  </td>
                  <td>
                    <base-button 
                      type="text" 
                      @click="removeExpenseItem(index)"
                      class="delete-btn"
                    >
                      <i class="fas fa-trash"></i>
                    </base-button>
                  </td>
                  <td>
                    <div class="invoice-upload">
                      <template v-if="item.invoiceImage">
                        <div class="image-preview">
                          <img 
                            :src="item.invoiceImage" 
                            alt="發票預覽" 
                            class="thumbnail"
                            @click="openImagePreview(item.invoiceImage)"
                          />
                          <div class="image-actions">
                            <base-button
                              type="text"
                              class="remove-image"
                              @click.stop="removeInvoiceImage(index)"
                            >
                              <i class="fas fa-times"></i>
                            </base-button>
                          </div>
                          <base-button
                            type="text"
                            class="change-image"
                            @click.stop="triggerUpload(index)"
                            :loading="uploading"
                          >
                            更換
                          </base-button>
                        </div>
                      </template>
                      <template v-else>
                        <div class="upload-wrapper">
                          <base-button
                            type="text"
                            class="upload-btn"
                            @click="triggerUpload(index)"
                            :loading="uploading"
                          >
                            <i class="fas fa-upload"></i>
                            上傳發票
                          </base-button>
                        </div>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="text-right">合計：</td>
                  <td>{{ formatAmount(totalAmount, formData.currency) }}</td>
                  <td>{{ formatAmount(totalTax, formData.currency) }}</td>
                  <td>{{ formatAmount(totalFee, formData.currency) }}</td>
                  <td colspan="2"></td>
                </tr>
                <tr>
                  <td colspan="5" class="text-right">總金額：</td>
                  <td colspan="5" class="grand-total">{{ formatAmount(grandTotal, formData.currency) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <base-button type="danger" @click="showAddModal = false">取消</base-button>
          <base-button type="primary" @click="handleSubmit">確定</base-button>
        </div>
      </template>
    </base-modal>

    <!-- 文件上傳輸入框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelected"
    />

    <!-- PDF 文件上傳輸入框 -->
    <input
      ref="pdfFileInput"
      type="file"
      accept=".pdf,application/pdf"
      style="display: none"
      @change="handlePdfFileChange"
    />

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

    <!-- PDF 預覽彈窗 -->
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
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ElPagination } from 'element-plus'
import { useReimbursementList } from '@/composables/useReimbursementList'
import { useReimbursementForm } from '@/composables/useReimbursementForm'
import { useFileUpload } from '@/composables/useFileUpload'
import { useExpenseItems } from '@/composables/useExpenseItems'
import { useReimbursementDetail } from '@/composables/useReimbursementDetail'
import { useResponsive } from '@/composables/useResponsive'
import { useReimbursementModal } from '@/composables/useReimbursementModal'
import { useRouteHandler } from '@/composables/useRouteHandler'
import { useFormSubmit } from '@/composables/useFormSubmit'

// 使用響應式 composable
// Use responsive composable
const { isMobile } = useResponsive()

// 使用請款列表 composable
// Use reimbursement list composable
const {
  searchQuery,
  currentPage,
  pageSize,
  totalRecords,
  paginatedRecords,
  fetchRecords,
  removeRecord,
  submitRecord,
  viewDetail,
  handleSizeChange,
  handleCurrentChange
} = useReimbursementList()

// 使用請款表單 composable
// Use reimbursement form composable
const {
  formData,
  generateSerialNumber,
  submitForm,
  resetForm
} = useReimbursementForm()

// 使用文件上傳 composable
// Use file upload composable
const {
  fileInput,
  pdfFileInput,
  uploading,
  showImagePreview,
  previewImageUrl,
  selectedPdfFiles,
  triggerUpload,
  handleFileSelected,
  handlePdfFileChange,
  viewPdfFile,
  removePdfFile,
  formatFileSize,
  handleAddAttachment,
  openImagePreview
} = useFileUpload(formData)

// 使用費用項目 composable
// Use expense items composable
const {
  addExpenseItem,
  removeExpenseItem,
  removeInvoiceImage,
  totalAmount,
  totalTax,
  totalFee,
  grandTotal,
  formatAmount
} = useExpenseItems(formData)

// 使用請款詳情 composable
// Use reimbursement detail composable
const { handleCopyAndCreate } = useReimbursementDetail()

// 使用模態框 composable
// Use modal composable
const {
  showAddModal,
  showPdfPreview,
  pdfPreviewUrl,
  openAddModal
} = useReimbursementModal(formData, {
  resetForm,
  generateSerialNumber,
  addExpenseItem
})

// 使用路由處理 composable
// Use route handler composable
useRouteHandler(openAddModal)

// 使用表單提交 composable
// Use form submit composable
const { handleSubmit } = useFormSubmit(
  formData,
  selectedPdfFiles,
  showAddModal,
  {
    submitForm,
    fetchRecords
  }
)

// 監聽類型變化，重新生成序號
// Listen to type changes and regenerate serial number
watch(() => formData.value.type, () => {
  generateSerialNumber()
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/reimbursement.scss';
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style> 