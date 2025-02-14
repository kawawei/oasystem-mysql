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
      <base-card v-if="filteredRecords.length === 0" class="empty-card">
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
                      placeholder="輸入科目"
                    />
                  </td>
                  <td>
                    <base-input 
                      v-model="item.accountName" 
                      placeholder="科目名稱" 
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useRouter, useRoute } from 'vue-router'
import { reimbursementApi, type ReimbursementStatus } from '@/services/api'
import { message } from '@/plugins/message'
import { useReimbursementForm } from '@/composables/useReimbursementForm'
import { useFileUpload } from '@/composables/useFileUpload'
import { useExpenseItems } from '@/composables/useExpenseItems'
import { useReimbursementDetail } from '@/composables/useReimbursementDetail'

interface Reimbursement {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: ReimbursementStatus
  submitterId: number
  payee: string
  createdAt: string
  submitter?: {
    id: number
    name: string
    username: string
    department?: string
  }
  paymentTarget: string
  accountNumber: string
  bankInfo: string
  items: Array<{
    accountCode: string
    accountName: string
    date: string
    description: string
    quantity: number
    amount: number
    tax?: number
    fee?: number
    total: number
    invoiceNumber?: string
    invoiceImage?: string
  }>
  attachments: Array<{
    filename: string
    originalName: string
    url: string
  }> | null
}

const searchQuery = ref('')
const records = ref<Reimbursement[]>([])
const isMobile = ref(false)
const router = useRouter()
const route = useRoute()
const showAddModal = ref(false)

// 使用 useReimbursementDetail composable
const { handleCopyAndCreate } = useReimbursementDetail()

// 使用 composables
const {
  formData,
  generateSerialNumber,
  submitForm,
  resetForm
} = useReimbursementForm()

const {
  fileInput,
  pdfFileInput,
  uploading,
  showPdfPreview,
  pdfPreviewUrl,
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

// 獲取請款列表
const fetchRecords = async () => {
  try {
    const { data } = await reimbursementApi.getReimbursements()
    records.value = data.data
  } catch (error) {
    console.error('Error fetching records:', error)
    message.error('獲取請款列表失敗')
  }
}

// 刪除請款單
const removeRecord = async (record: any) => {
  try {
    console.log('Deleting reimbursement:', record)
    await reimbursementApi.deleteReimbursement(record.id)
    message.success('請款單刪除成功')
    fetchRecords()
  } catch (error) {
    console.error('Error deleting reimbursement:', error)
    message.error('刪除請款單失敗')
  }
}

// 查看詳情
const viewDetail = (record: Reimbursement) => {
  router.push(`/reimbursement/${record.id}`)
}

// 過濾記錄
const filteredRecords = computed(() => {
  if (!searchQuery.value) return records.value
  
  const query = searchQuery.value.toLowerCase()
  return records.value.filter(record => 
    record.serialNumber.toLowerCase().includes(query) ||
    record.payee.toLowerCase().includes(query) ||
    (record.submitter?.name || '').toLowerCase().includes(query)
  )
})

// 打開新增請款彈窗時生成序號
const openAddModal = async () => {
  resetForm() // 先重置表單

  // 檢查是否有草稿數據
  const draft = localStorage.getItem('reimbursementDraft')
  if (draft) {
    // 如果有草稿，將其載入到表單中
    const draftData = JSON.parse(draft)
    Object.assign(formData.value, draftData)
    // 清除草稿
    localStorage.removeItem('reimbursementDraft')
  } else {
    // 如果沒有草稿，添加一個空的費用明細項
    addExpenseItem()
  }

  showAddModal.value = true
  await generateSerialNumber()
}

// 監聽類型變化，重新生成序號
watch(() => formData.value.type, () => {
  generateSerialNumber()
})

// 處理提交
const submitRecord = async (record: Reimbursement) => {
  try {
    await reimbursementApi.updateReimbursement(record.id, {
      status: 'submitted'
    })
    message.success('提交成功')
    // 重新獲取列表
    await fetchRecords()
  } catch (error) {
    console.error('Error submitting reimbursement:', error)
    message.error('提交失敗')
  }
}

// 處理提交
const handleSubmit = async () => {
  try {
    const result = await submitForm()
    if (result) {
      // 清理所有預覽 URL
      formData.value.items.forEach(item => {
        if (item.invoiceImage && item.invoiceImage.startsWith('blob:')) {
          URL.revokeObjectURL(item.invoiceImage)
        }
      })
      selectedPdfFiles.value.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })

      // 清空選中的文件
      selectedPdfFiles.value = []
      
      // 關閉模態框
      showAddModal.value = false
      
      // 重新獲取列表
      await fetchRecords()
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    message.error('提交失敗')
  }
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 監聽窗口大小變化
window.addEventListener('resize', checkMobile)

// 監聽打開新增對話框的事件
window.addEventListener('openAddModal', () => {
  openAddModal()
})

// 組件掛載時
onMounted(async () => {
  checkMobile()
  await fetchRecords()

  // 檢查 URL 參數
  if (route.query.openAddModal === 'true') {
    // 移除 URL 參數
    router.replace({ query: {} })
    // 打開新增對話框
    openAddModal()
  }
})

// 組件卸載時
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('openAddModal', openAddModal)
})

// 監聽模態框關閉事件，清理 URL
watch(showPdfPreview, (newVal) => {
  if (!newVal && pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = ''
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/reimbursement.scss';
</style> 