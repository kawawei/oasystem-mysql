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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseModal from '@/common/base/Modal.vue'
import { reimbursementApi, uploadApi } from '@/services/api'
import { message } from '@/plugins/message'

interface ReimbursementRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  submitterId: number
  payee: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  reviewerId?: number
  reviewComment?: string
  reviewedAt?: string
  department?: string
  description?: string
  createdAt: string
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
  submitter?: {
    id: number
    name: string
    username: string
    department?: string
  }
  reviewer?: {
    id: number
    name: string
    username: string
  }
}

interface ExpenseItem {
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
}

const router = useRouter()
const route = useRoute()
const isProcessing = ref(false)
const isLoading = ref(false)
const isEditing = ref(false)
const editingData = ref<ReimbursementRecord | null>(null)
const currentUploadIndex = ref<number>(-1)
const uploading = ref(false)

// 請款記錄
const record = ref<ReimbursementRecord | null>(null)

// 駁回相關
const showRejectModal = ref(false)
const rejectComment = ref('')

// 圖片預覽相關
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 判斷是否來自財務管理頁面
const isFromFinance = computed(() => {
  return route.query.from === 'finance'
})

// 獲取請款詳情
const fetchReimbursementDetail = async () => {
  console.log('開始獲取數據')
  isLoading.value = true
  try {
    const { data } = await reimbursementApi.getReimbursement(Number(route.params.id))
    console.log('請款詳情數據:', data)
    console.log('isLoading 狀態:', isLoading.value)
    // 格式化單號，將 RB/PB 改為 A/B
    record.value = {
      ...data,
      serialNumber: data.serialNumber.replace(/^[PR]B/, (match: string) => 
        match === 'RB' ? 'A' : 'B'  // RB（請款）改為 A，PB（應付）改為 B
      )
    }
    console.log('record 賦值後:', record.value)
    console.log('record 是否為空:', !record.value)
    console.log('record 的類型:', typeof record.value)
  } catch (error) {
    console.error('Error fetching reimbursement:', error)
    message.error('獲取請款詳情失敗')
  } finally {
    isLoading.value = false
    console.log('finally 後的 isLoading 狀態:', isLoading.value)
    console.log('finally 後的 record 狀態:', record.value)
    console.log('finally 後 record 是否為空:', !record.value)
    console.log('finally 後 record 的類型:', typeof record.value)
  }
}

// 添加監聽器
watch(record, (newVal) => {
  console.log('record 值變化:', newVal)
  console.log('record 是否為空:', !newVal)
  console.log('record 的類型:', typeof newVal)
}, { deep: true })

// 格式化狀態文字
const getStatusText = (status: ReimbursementRecord['status'] | undefined) => {
  const statusMap = {
    pending: '待提交',
    submitted: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
  }
  return status ? statusMap[status] : ''
}

// 格式化金額
const formatAmount = (amount: number | undefined | null, currency?: 'TWD' | 'CNY') => {
  // 確保金額是數字
  const numAmount = Number(amount) || 0
  // 如果沒有提供幣種，使用當前編輯或記錄的幣種
  const currentCurrency = currency || (isEditing.value ? editingData.value?.currency : record.value?.currency) || 'TWD'
  const prefix = currentCurrency === 'TWD' ? 'NT$' : '¥'
  return `${prefix} ${formatNumberByCurrency(numAmount, currentCurrency)}`
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

// 判斷當前用戶是否可以編輯
const canEdit = computed(() => {
  if (!record.value) return false
  return record.value.status === 'pending'
  // TODO: 添加用戶角色判斷
})

// 處理編輯
const handleEdit = () => {
  if (!record.value) return
  // 複製當前數據到編輯區
  editingData.value = JSON.parse(JSON.stringify(record.value))
  isEditing.value = true
}

// 處理取消
const handleCancel = () => {
  isEditing.value = false
  editingData.value = null
}

// 處理確認
const handleConfirm = async () => {
  if (!editingData.value) return
  
  isProcessing.value = true
  try {
    await reimbursementApi.updateReimbursement(editingData.value.id, editingData.value)
    message.success('更新成功')
    await fetchReimbursementDetail()
    isEditing.value = false
    editingData.value = null
  } catch (error) {
    console.error('Error updating reimbursement:', error)
    message.error('更新失敗')
  } finally {
    isProcessing.value = false
  }
}

// 處理文件上傳
const handleFileChange = async (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  // 檢查文件類型
  if (!file.type.startsWith('image/')) {
    message.error('請上傳圖片文件')
    return
  }

  // 檢查文件大小（例如限制為 5MB）
  if (file.size > 5 * 1024 * 1024) {
    message.error('文件大小不能超過 5MB')
    return
  }

  if (!editingData.value?.items) return
  
  try {
    uploading.value = true
    currentUploadIndex.value = index
    
    if (!record.value) {
      throw new Error('Record not found')
    }

    const { data } = await uploadApi.uploadInvoice(
      file,
      record.value.serialNumber,
      currentUploadIndex.value + 1
    )
    
    // 使用服務器返回的 URL
    editingData.value.items[index].invoiceImage = data.url
    message.success('上傳成功')
  } catch (error) {
    console.error('Error uploading file:', error)
    message.error('上傳失敗')
  } finally {
    uploading.value = false
    // 清空 input，確保可以重新選擇相同的文件
    if (input) {
      input.value = ''
    }
  }
}

// 更新明細項
const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
  if (!editingData.value) return

  const item = editingData.value.items[index] as ExpenseItem

  switch (field) {
    case 'quantity':
    case 'amount':
    case 'tax':
    case 'fee':
      const numValue = Number(value) || 0
      item[field] = numValue

      // 更新總計
      const amount = Number(item.amount) || 0
      const tax = Number(item.tax) || 0
      const fee = Number(item.fee) || 0
      item.total = amount + tax + fee
      break

    case 'accountCode':
    case 'accountName':
    case 'date':
    case 'description':
    case 'invoiceNumber':
    case 'invoiceImage':
      item[field] = value as string
      break
  }
}

// 處理提交
const handleSubmit = async () => {
  if (!record.value) return
  
  isProcessing.value = true
  try {
    await reimbursementApi.reviewReimbursement(record.value.id, {
      status: 'submitted',
      reviewComment: '提交審核'
    })
    message.success('提交成功')
    // 重新獲取最新數據
    await fetchReimbursementDetail()
  } catch (error) {
    console.error('Error submitting reimbursement:', error)
    message.error('提交失敗')
  } finally {
    isProcessing.value = false
  }
}

// 計算總金額
const totalAmount = computed(() => {
  const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
  if (!items) return 0
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// 計算總稅額
const totalTax = computed(() => {
  const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
  if (!items) return 0
  return items.reduce((sum, item) => sum + (Number(item.tax) || 0), 0)
})

// 計算總手續費
const totalFee = computed(() => {
  const items = isEditing.value && editingData.value ? editingData.value.items : record.value?.items
  if (!items) return 0
  return items.reduce((sum, item) => sum + (Number(item.fee) || 0), 0)
})

// 計算總計
const grandTotal = computed(() => {
  return totalAmount.value + totalTax.value + totalFee.value
})

// 格式化數字
const formatNumberByCurrency = (number: number | undefined | null, currency: 'TWD' | 'CNY') => {
  // 確保輸入是數字
  const num = Number(number) || 0
  
  if (currency === 'TWD') {
    return Math.round(num).toLocaleString() // 新台幣去除小數點
  }
  return num.toFixed(2) // 人民幣保留兩位小數
}

// 添加費用明細項
const addExpenseItem = () => {
  if (!editingData.value) return
  
  editingData.value.items.push({
    accountCode: '',
    accountName: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    quantity: 1,
    amount: 0,
    tax: 0,
    fee: 0,
    total: 0,
    invoiceNumber: '',
    invoiceImage: ''
  })
}

// 移除費用明細項
const removeExpenseItem = (index: number) => {
  if (!editingData.value) return
  editingData.value.items.splice(index, 1)
}

// 處理通過
const handleApprove = async () => {
  if (!record.value) return
  
  isProcessing.value = true
  try {
    await reimbursementApi.reviewReimbursement(record.value.id, {
      status: 'approved',
      reviewComment: '同意'
    })
    message.success('審核通過成功')
    // 重新獲取最新數據
    await fetchReimbursementDetail()
  } catch (error) {
    console.error('Error approving reimbursement:', error)
    message.error('審核通過失敗')
  } finally {
    isProcessing.value = false
  }
}

// 處理駁回
const handleReject = () => {
  showRejectModal.value = true
  rejectComment.value = ''
}

// 確認駁回
const confirmReject = async () => {
  if (!record.value) return
  if (!rejectComment.value.trim()) {
    message.error('請輸入駁回原因')
    return
  }

  isProcessing.value = true
  try {
    await reimbursementApi.reviewReimbursement(record.value.id, {
      status: 'rejected',
      reviewComment: rejectComment.value.trim()
    })
    message.success('駁回成功')
    showRejectModal.value = false
    // 重新獲取最新數據
    await fetchReimbursementDetail()
  } catch (error) {
    console.error('Error rejecting reimbursement:', error)
    message.error('駁回失敗')
  } finally {
    isProcessing.value = false
  }
}

// 處理圖片 URL
const getImageUrl = (url: string) => {
  if (!url) return ''
  
  // 如果是完整的 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是 blob URL，直接返回
  if (url.startsWith('blob:')) {
    return url
  }
  
  // 構建完整的圖片 URL
  const baseUrl = import.meta.env.VITE_STATIC_URL || ''
  const staticUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  // 使用正確的靜態文件路徑
  return `${staticUrl}/uploads/${url}`
}

// 打開圖片預覽
const openImagePreview = (url: string) => {
  if (!url) return
  previewImageUrl.value = url
  showImagePreview.value = true
}

// 組件掛載時獲取數據
onMounted(() => {
  fetchReimbursementDetail()
})
</script>

<style lang="scss" scoped>
.reimbursement-detail {
  padding: 20px;
  background-color: #fff;

  .detail-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .header {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    padding: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .back-section {
        display: flex;
        align-items: center;
        gap: 12px;

        .btn-back {
          padding: 0;
          
          i {
            margin-right: 4px;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;

        :deep(.base-button) {
          &.approve-btn {
            background-color: #52c41a;
            border-color: #52c41a;
            
            &:hover {
              background-color: #73d13d;
              border-color: #73d13d;
            }
          }

          &.reject-btn {
            background-color: #ff4d4f;
            border-color: #ff4d4f;
            
            &:hover {
              background-color: #ff7875;
              border-color: #ff7875;
            }
          }
        }
      }
    }
  }

  .detail-table {
    .title-section {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .table-title {
      text-align: center;
      font-size: 24px;
      margin: 0;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      
      td, th {
        border: 1px solid #d9d9d9;
        padding: 12px;
        font-size: 14px;
      }

      td.label {
        background-color: #fafafa;
        font-weight: 500;
        width: 120px;
      }

      .amount {
        text-align: right;
      }
    }

    .expense-table {
      th {
        background-color: #fafafa;
        font-weight: 500;
        text-align: left;
        white-space: nowrap;
        padding: 12px 8px;
      }

      td {
        padding: 12px 8px;
      }

      .quantity {
        width: 80px;
        text-align: center;
      }

      .amount {
        width: 140px;
        
        .amount-wrapper {
          display: flex;
          justify-content: flex-end;

          .amount-content {
            display: flex;
            align-items: center;
            gap: 4px;

            .currency {
              font-size: 14px;
              color: #666;
            }

            .value {
              font-size: 14px;
            }
          }
        }
      }

      .date {
        width: 100px;
        text-align: center;
      }

      .action {
        width: 100px;
        text-align: center;
      }

      tfoot {
        background-color: #fafafa;
        font-weight: 500;

        .text-right {
          text-align: right;
        }

        .amount {
          .amount-wrapper {
            .value {
              font-weight: bold;
            }
          }
        }
      }
    }

    .add-detail-button {
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .edit-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;

      .right-actions {
        display: flex;
        gap: 8px;
      }
    }

    .base-input {
      width: 100%;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
    
    i {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
    
    i {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }
}

// 狀態標籤樣式
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.pending {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  &.submitted {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  
  &.approved {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.rejected {
    background-color: #fff1f0;
    color: #f5222d;
  }
}

// 移動端適配
@media screen and (max-width: 768px) {
  .reimbursement-detail {
    padding: 16px;

    .header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        .action-buttons {
          width: 100%;
          
          .base-button {
            flex: 1;
          }
        }
      }
    }

    .detail-table {
      table {
        td, th {
          padding: 8px;
        }
      }
    }
  }
}

.upload-wrapper {
  position: relative;
  display: inline-block;

  .file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .upload-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background-color: #1890ff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;

    &:hover {
      background-color: #40a9ff;
    }

    i {
      font-size: 14px;
    }
  }
}

.amount input {
  text-align: right;
}

.date-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.currency-select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  width: 140px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.reject-form {
  padding: 20px;
  
  :deep(.base-input) {
    width: 100%;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.reject-reason-section {
  margin: 20px 0;
  padding: 16px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;

  .reject-reason-header {
    display: flex;
    align-items: center;
    color: #ff4d4f;
    font-weight: 500;
    margin-bottom: 8px;

    i {
      margin-right: 8px;
    }
  }

  .reject-reason-content {
    color: #434343;
    font-size: 14px;
    line-height: 1.6;
    padding: 8px 0 0 24px;
  }
}

.invoice-preview {
  display: inline-block;
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.05);
    }
  }
}

.no-image {
  color: #999;
  font-size: 14px;
}

.preview-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 4px;

  .preview-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
  }
}

.image-preview-modal {
  :deep(.base-modal-body) {
    padding: 0;
  }
}
</style> 