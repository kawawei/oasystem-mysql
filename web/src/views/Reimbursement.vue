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
              <label>付款帳號<span class="required">*</span></label>
              <base-input 
                v-model="formData.accountNumber" 
                placeholder="請輸入付款帳號" 
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>支付帳號<span class="required">*</span></label>
              <base-input 
                v-model="formData.bankInfo" 
                placeholder="請輸入支付帳號" 
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
            <div v-if="selectedPdfFile" class="pdf-file-card">
              <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-content">
                <div class="pdf-name">{{ selectedPdfFile.name }}</div>
                <div class="pdf-size">{{ formatFileSize(selectedPdfFile.file.size) }}</div>
              </div>
              <div class="pdf-actions">
                <base-button
                  type="text"
                  class="action-btn view"
                  @click="viewPdfFile"
                  title="查看"
                >
                  <i class="fas fa-eye"></i>
                </base-button>
                <base-button
                  type="text"
                  class="action-btn delete"
                  @click="removePdfFile"
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
                  <th>數量/價格</th>
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
                    <base-input v-model="item.accountName" placeholder="科目名稱" />
                  </td>
                  <td>
                    <base-input
                      :model-value="item.invoiceNumber"
                      @update:model-value="value => item.invoiceNumber = value || ''"
                      placeholder="發票號碼"
                    />
                  </td>
                  <td>
                    <base-input v-model="item.description" placeholder="請輸入摘要" />
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
          <base-button type="primary" @click="submitForm">確定</base-button>
        </div>
      </template>
    </base-modal>

    <!-- 文件上傳輸入框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
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

    <!-- 圖片上傳確認彈窗 -->
    <base-modal
      v-model="showUploadConfirm"
      title="確認上傳圖片"
      :width="400"
      content-class="upload-confirm-modal"
    >
      <div class="upload-preview">
        <img :src="tempImageUrl" alt="預覽圖片" class="preview-image" />
      </div>
      <template #footer>
        <div class="modal-footer">
          <base-button @click="cancelUpload">取消</base-button>
          <base-button type="primary" @click="confirmUpload" :loading="uploading">確認上傳</base-button>
        </div>
      </template>
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
import { useRouter } from 'vue-router'
import { 
  reimbursementApi, 
  uploadApi, 
  type ReimbursementStatus, 
  type ReimbursementFormData,
  type ReimbursementFormItem
} from '@/services/api'
import { message } from '@/plugins/message'

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
}

const searchQuery = ref('')
const records = ref<Reimbursement[]>([])
const isMobile = ref(false)
const router = useRouter()

// 表單數據
const showAddModal = ref(false)
const formData = ref<ReimbursementFormData>({
  type: 'reimbursement',
  serialNumber: '',
  title: '',
  payee: '',
  accountNumber: '',
  bankInfo: '',
  currency: 'TWD',
  attachments: [],
  items: [
    {
      accountCode: '',
      accountName: '',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      invoiceImage: '',
      description: '',
      quantity: 1,
      amount: 0,
      tax: 0,
      fee: 0,
      total: 0
    }
  ]
})

// 上傳相關
const fileInput = ref<HTMLInputElement | null>(null)
const currentUploadIndex = ref<number>(-1)
const uploading = ref(false)
const showUploadConfirm = ref(false)
const tempImageUrl = ref('')
const tempFile = ref<File | null>(null)

// 圖片預覽相關
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 新增 PDF 文件上傳相關
const pdfFileInput = ref<HTMLInputElement | null>(null)

// 添加附件相關的數據
const selectedPdfFile = ref<{ name: string; file: File } | null>(null)

// PDF 預覽相關
const showPdfPreview = ref(false)
const pdfPreviewUrl = ref('')

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

// 格式化金額
const formatAmount = (amount: number, currency: 'TWD' | 'CNY' = 'TWD') => {
  const symbols = {
    TWD: 'NT$',
    CNY: '¥'
  }
  return `${symbols[currency]} ${amount.toLocaleString()}`
}

// 觸發文件上傳
const triggerUpload = (index: number) => {
  currentUploadIndex.value = index
  if (fileInput.value) {
    fileInput.value.value = ''  // 清空 input，確保可以選擇相同的文件
    fileInput.value.click()
  }
}

// 處理文件選擇
const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || currentUploadIndex.value === -1) return

  const file = input.files[0]
  
  // 檢查文件格式
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    message.error('只允許上傳 JPG 或 PNG 格式的圖片')
    return
  }

  // 檢查文件大小（20MB）
  if (file.size > 20 * 1024 * 1024) {
    message.error('文件大小不能超過 20MB')
    return
  }

  try {
    // 壓縮圖片並轉為 base64
    const compressedFile = await compressImage(file)
    const reader = new FileReader()
    reader.onload = () => {
      const base64Url = reader.result as string
      
      // 更新當前項目的圖片預覽
      const currentItem = formData.value.items[currentUploadIndex.value]
      if (currentItem) {
        currentItem.invoiceImage = base64Url
        ;(currentItem as any)._file = compressedFile
      }
    }
    reader.readAsDataURL(compressedFile)
  } catch (error) {
    console.error('圖片處理失敗：', error)
    message.error('圖片處理失敗，請重試')
  }

  // 清空 input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 取消上傳
const cancelUpload = () => {
  if (tempImageUrl.value) {
    URL.revokeObjectURL(tempImageUrl.value)
  }
  tempImageUrl.value = ''
  tempFile.value = null
  showUploadConfirm.value = false
}

// 確認上傳
const confirmUpload = async () => {
  if (!tempFile.value) return

  try {
    uploading.value = true
    
    // 壓縮並上傳圖片
    const compressedFile = await compressImage(tempFile.value)
    const { data } = await uploadApi.uploadInvoice(
      compressedFile,
      formData.value.serialNumber,
      currentUploadIndex.value + 1,
      (percent) => {
        console.log(`Upload progress: ${percent}%`)
      }
    )

    // 更新圖片 URL 並強制更新視圖
    formData.value = {
      ...formData.value,
      items: formData.value.items.map((item, index) => {
        if (index === currentUploadIndex.value) {
          return {
            ...item,
            invoiceImage: data.url
          }
        }
        return item
      })
    }
    
    message.success('圖片上傳成功')
    showUploadConfirm.value = false
  } catch (error) {
    console.error('圖片上傳失敗：', error)
    message.error('圖片上傳失敗，請重試')
  } finally {
    uploading.value = false
    if (tempImageUrl.value) {
      URL.revokeObjectURL(tempImageUrl.value)
    }
    tempImageUrl.value = ''
    tempFile.value = null
  }
}

// 圖片壓縮函數
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 如果圖片大於 1200px，按比例縮小
        const maxSize = 1200
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // 轉換為 Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }))
          },
          'image/jpeg',
          0.8  // 壓縮質量
        )
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

// 移除發票圖片
const removeInvoiceImage = (index: number) => {
  const currentItem = formData.value.items[index]
  if (currentItem) {
    currentItem.invoiceImage = ''
    delete (currentItem as any)._file
  }
}

// 添加費用明細項
const addExpenseItem = () => {
  formData.value.items.push({
    accountCode: '',
    accountName: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    invoiceImage: '',
    description: '',
    quantity: 1,
    amount: 0,
    tax: 0,
    fee: 0,
    total: 0
  } as ReimbursementFormItem)
}

// 移除費用明細項
const removeExpenseItem = (index: number) => {
  formData.value.items.splice(index, 1)
}

// 計算總金額
const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// 計算總稅額
const totalTax = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (Number(item.tax) || 0), 0)
})

// 計算總手續費
const totalFee = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (Number(item.fee) || 0), 0)
})

// 添加總金額計算
const grandTotal = computed(() => {
  return totalAmount.value + totalTax.value + totalFee.value
})

// 生成序號的函數
const generateSerialNumber = async () => {
  const today = new Date()
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  // TODO: 這裡需要調用後端 API 來獲取當天的序號
  // 模擬 API 調用
  const mockGetTodaySerialCount = async () => {
    return 0 // 實際使用時需要從後端獲取
  }
  
  const count = await mockGetTodaySerialCount()
  const serialCount = String(count + 1).padStart(3, '0')
  const prefix = formData.value.type === 'reimbursement' ? 'A' : 'B'  // 請款用 A，應付用 B
  
  formData.value.serialNumber = `${prefix}${dateStr}${serialCount}`
}

// 監聽類型變化，重新生成序號
watch(() => formData.value.type, () => {
  generateSerialNumber()
})

// 打開新增請款彈窗時生成序號
const openAddModal = async () => {
  resetForm() // 先重置表單
  showAddModal.value = true
  await generateSerialNumber()
}

// 驗證表單
const validateForm = () => {
  if (!formData.value.title?.trim()) {
    message.error('請輸入標題')
    return false
  }
  if (!formData.value.payee?.trim()) {
    message.error('請輸入收款人')
    return false
  }
  if (!formData.value.accountNumber?.trim()) {
    message.error('請輸入付款帳號')
    return false
  }
  if (!formData.value.bankInfo?.trim()) {
    message.error('請輸入支付帳號')
    return false
  }
  
  // 驗證明細項
  for (const [index, item] of formData.value.items.entries()) {
    if (!item.accountCode?.trim()) {
      message.error(`第 ${index + 1} 項的會計科目不能為空`)
      return false
    }
    if (!item.accountName?.trim()) {
      message.error(`第 ${index + 1} 項的科目名稱不能為空`)
      return false
    }
    if (!item.description?.trim()) {
      message.error(`第 ${index + 1} 項的摘要不能為空`)
      return false
    }
    if (!item.date) {
      message.error(`第 ${index + 1} 項的日期不能為空`)
      return false
    }
    if (Number(item.amount) <= 0) {
      message.error(`第 ${index + 1} 項的金額必須大於 0`)
      return false
    }
  }
  
  return true
}

// 提交表單
const submitForm = async () => {
  try {
    // 先進行表單驗證
    if (!validateForm()) {
      return
    }

    // 準備要提交的數據
    const formDataToSubmit = new FormData()
    
    // 添加基本信息
    formDataToSubmit.append('type', formData.value.type)
    formDataToSubmit.append('title', formData.value.title)
    formData.append('payee', formData.value.payee)
    formData.append('accountNumber', formData.value.accountNumber)
    formData.append('bankInfo', formData.value.bankInfo)
    formData.append('currency', formData.value.currency)
    if (formData.value.type === 'payable' && formData.value.paymentDate) {
      formDataToSubmit.append('paymentDate', formData.value.paymentDate)
    }

    // 添加明細項
    const itemsWithoutFiles = formData.value.items.map(item => {
      const { _file, ...itemData } = item as any
      return {
        ...itemData,
        hasNewFile: !!_file
      }
    })
    formDataToSubmit.append('items', JSON.stringify(itemsWithoutFiles))

    // 添加文件
    formData.value.items.forEach((item, i) => {
      const file = (item as any)._file
      if (file) {
        formDataToSubmit.append(`files[${i}]`, file)
      }
    })

    // 提交請款單
    await reimbursementApi.createReimbursement(formDataToSubmit)
    message.success('請款單創建成功')
    showAddModal.value = false
    await fetchRecords()
  } catch (error: any) {
    console.error('提交失敗：', error)
    message.error(error.message || '提交失敗，請檢查輸入資料')
  }
}

// 重置表單
const resetForm = () => {
  formData.value = {
    type: 'reimbursement',
    serialNumber: '',
    title: '',
    payee: '',
    accountNumber: '',
    bankInfo: '',
    currency: 'TWD',
    attachments: [],
    items: [
      {
        accountCode: '',
        accountName: '',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        invoiceImage: '',
        description: '',
        quantity: 1,
        amount: 0,
        tax: 0,
        fee: 0,
        total: 0
      }
    ]
  }
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 監聽窗口大小變化
window.addEventListener('resize', checkMobile)

// 組件掛載時
onMounted(() => {
  checkMobile()
  fetchRecords()
})

// 組件卸載時
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

// 打開圖片預覽
const openImagePreview = (url: string) => {
  if (!url) return
  previewImageUrl.value = url
  showImagePreview.value = true
}

// 處理添加附件
const handleAddAttachment = () => {
  // 觸發 PDF 文件選擇
  if (pdfFileInput.value) {
    pdfFileInput.value.value = ''  // 清空 input，確保可以選擇相同的文件
    pdfFileInput.value.click()
  }
}

// 處理 PDF 文件選擇
const handlePdfFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  
  // 檢查文件類型
  if (file.type !== 'application/pdf') {
    message.error('請上傳 PDF 文件')
    return
  }

  // 檢查文件大小（20MB）
  if (file.size > 20 * 1024 * 1024) {
    message.error('文件大小不能超過 20MB')
    return
  }

  try {
    // 保存選中的文件信息
    selectedPdfFile.value = {
      name: file.name,
      file: file
    }
    message.success('PDF 文件已選擇')
  } catch (error) {
    console.error('Error handling PDF file:', error)
    message.error('文件處理失敗')
  }
}

// 查看 PDF 文件
const viewPdfFile = () => {
  if (selectedPdfFile.value?.file) {
    const fileUrl = URL.createObjectURL(selectedPdfFile.value.file)
    pdfPreviewUrl.value = fileUrl
    showPdfPreview.value = true
  }
}

// 移除 PDF 文件
const removePdfFile = () => {
  selectedPdfFile.value = null
  if (pdfFileInput.value) {
    pdfFileInput.value.value = ''
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;  // 改為靠左對齊
}

.invoice-upload {
  .image-preview {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: visible;

    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.2s;
      border-radius: 4px;
      overflow: hidden;

      &:hover {
        transform: scale(1.05);
      }
    }

    .remove-image {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px !important;
      width: 18px !important;
      height: 18px !important;
      padding: 0 !important;
      border: none;
      border-radius: 50% !important;
      background-color: rgba(0, 0, 0, 0.7) !important;
      color: white !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 10;
      
      i {
        font-size: 10px;
      }

      &:hover {
        transform: scale(1.1);
        background-color: rgba(0, 0, 0, 0.9) !important;
      }
    }

    .change-image {
      position: absolute;
      left: 50%;
      bottom: -24px;
      transform: translateX(-50%);
      font-size: 12px;
      padding: 2px 8px;
      background-color: rgba(24, 144, 255, 0.9) !important;
      color: white !important;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover {
      .change-image {
        opacity: 1;
      }
    }
  }

  .upload-wrapper {
    display: inline-block;
    
    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      color: #1890ff !important;

      &:hover {
        color: #40a9ff !important;
      }

      i {
        font-size: 14px;
      }
    }
  }
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

.upload-confirm-modal {
  .upload-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: #fafafa;
    border-radius: 4px;

    img {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
  }

  .section-actions {
    display: flex;
    gap: 8px;
  }
}

.pdf-files-list {
  margin-bottom: 20px;
  
  .pdf-file-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .pdf-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: #fff2f0;
      border-radius: 8px;
      margin-right: 12px;

      i {
        font-size: 20px;
        color: #ff4d4f;
      }
    }

    .pdf-content {
      flex: 1;
      min-width: 0;

      .pdf-name {
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pdf-size {
        font-size: 12px;
        color: #999;
      }
    }

    .pdf-actions {
      display: flex;
      gap: 8px;
      margin-left: 12px;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        transition: all 0.3s;

        i {
          font-size: 16px;
        }

        &.view {
          color: #1890ff;
          
          &:hover {
            background-color: #e6f7ff;
          }
        }

        &.delete {
          color: #ff4d4f;
          
          &:hover {
            background-color: #fff2f0;
          }
        }
      }
    }
  }
}

.pdf-preview-modal {
  :deep(.base-modal-body) {
    padding: 20px;
    background-color: #f8f8f8;
  }
}

.pdf-preview-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  iframe {
    display: block;
    border: none;
  }
}
</style> 