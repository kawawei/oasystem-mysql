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
          { key: 'submitter.name', title: '申請人' },
          { key: 'payee', title: '請款人' },
          { key: 'type', title: '類型' },
          { key: 'totalAmount', title: '總金額' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #type="{ row }">
          {{ row.type === 'reimbursement' ? '請款' : '應付' }}
        </template>
        <template #amount="{ row }">
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
              <span class="value">{{ record.type === 'reimbursement' ? '請款' : '應付' }}</span>
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
            <base-button type="primary" size="small" @click="addExpenseItem">
              <i class="fas fa-plus"></i>
              添加明細
            </base-button>
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
                    <base-input v-model="item.invoiceNumber" placeholder="發票號碼" />
                  </td>
                  <td>
                    <base-input v-model="item.description" placeholder="請輸入摘要" />
                  </td>
                  <td>
                    <base-input v-model="item.quantity" type="number" placeholder="數量" />
                  </td>
                  <td>
                    <base-input v-model="item.amount" type="number" placeholder="金額" />
                  </td>
                  <td>
                    <base-input v-model="item.tax" type="number" placeholder="稅額" />
                  </td>
                  <td>
                    <base-input v-model="item.fee" type="number" placeholder="手續費" />
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
                      <div v-if="item.invoiceImage" class="image-preview">
                        <img :src="item.invoiceImage" alt="發票預覽" />
                        <base-button
                          type="text"
                          class="remove-image"
                          @click="removeInvoiceImage(index)"
                        >
                          <i class="fas fa-times"></i>
                        </base-button>
                      </div>
                      <base-button
                        v-else
                        type="text"
                        class="upload-btn"
                        @click="triggerUpload(index)"
                      >
                        <i class="fas fa-upload"></i>
                        上傳發票
                      </base-button>
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
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'

interface ExpenseItem {
  accountCode: string
  accountName: string
  date: string
  description: string
  quantity: string
  amount: string
  tax: string
  fee: string
  total: number
  invoiceNumber?: string
  invoiceImage?: string
}

interface ReimbursementRecord {
  id: number
  serialNumber: string
  type: 'reimbursement' | 'payable'
  title: string
  totalAmount: number
  currency: 'TWD' | 'CNY'
  status: 'pending' | 'approved' | 'rejected'
  submitterId: number
  payee: string
  accountNumber: string
  bankInfo: string
  paymentDate?: string
  items: ExpenseItem[]
  submitter?: {
    id: number
    name: string
    username: string
    department?: string
  }
}

const searchQuery = ref('')
const records = ref<ReimbursementRecord[]>([])
const isMobile = ref(false)
const router = useRouter()

// 表單數據
const showAddModal = ref(false)
const formData = ref({
  type: 'reimbursement' as 'reimbursement' | 'payable',
  serialNumber: '',
  title: '',
  payee: '',
  accountNumber: '',
  bankInfo: '',
  paymentDate: '',
  currency: 'TWD' as 'TWD' | 'CNY',
  items: [
    {
      accountCode: '',
      accountName: '',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      invoiceImage: '',
      description: '',
      quantity: '1',
      amount: '0',
      tax: '0',
      fee: '0',
      total: 0
    }
  ]
})

// 上傳相關
const fileInput = ref<HTMLInputElement | null>(null)
const currentUploadIndex = ref<number>(-1)

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

// 創建請款單
const createReimbursement = async () => {
  try {
    await reimbursementApi.createReimbursement({
      type: formData.value.type,
      title: formData.value.title,
      payee: formData.value.payee,
      accountNumber: formData.value.accountNumber,
      bankInfo: formData.value.bankInfo,
      currency: formData.value.currency,
      paymentDate: formData.value.type === 'payable' ? formData.value.paymentDate : undefined,
      items: formData.value.items.map(item => ({
        ...item,
        amount: parseFloat(item.amount),
        tax: parseFloat(item.tax),
        fee: parseFloat(item.fee),
        total: parseFloat(item.amount) + parseFloat(item.tax) + parseFloat(item.fee)
      }))
    })
    
    message.success('請款單創建成功')
    showAddModal.value = false
    fetchRecords()
  } catch (error) {
    console.error('Error creating reimbursement:', error)
    message.error('創建請款單失敗')
  }
}

// 刪除請款單
const removeRecord = async (record: ReimbursementRecord) => {
  try {
    await reimbursementApi.deleteReimbursement(record.id)
    message.success('請款單刪除成功')
    fetchRecords()
  } catch (error) {
    console.error('Error deleting reimbursement:', error)
    message.error('刪除請款單失敗')
  }
}

// 查看詳情
const viewDetail = (record: ReimbursementRecord) => {
  router.push(`/reimbursements/${record.id}`)
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
  fileInput.value?.click()
}

// 處理文件上傳
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0] && currentUploadIndex.value !== -1) {
    const file = input.files[0]
    if (file.size > 5 * 1024 * 1024) {
      message.warning('文件大小不能超過 5MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        formData.value.items[currentUploadIndex.value].invoiceImage = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

// 移除發票圖片
const removeInvoiceImage = (index: number) => {
  formData.value.items[index].invoiceImage = ''
  if (fileInput.value) {
    fileInput.value.value = ''
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
    quantity: '1',
    amount: '0',
    tax: '0',
    fee: '0',
    total: 0
  })
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
  const prefix = formData.value.type === 'reimbursement' ? 'A' : 'B'
  
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

// 提交表單
const submitForm = async () => {
  try {
    await createReimbursement()
  } catch (error) {
    console.error('提交失敗：', error)
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
    paymentDate: '',
    currency: 'TWD',
    items: [
      {
        accountCode: '',
        accountName: '',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        invoiceImage: '',
        description: '',
        quantity: '1',
        amount: '0',
        tax: '0',
        fee: '0',
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
</script>

<style lang="scss" scoped>
@import '@/styles/views/reimbursement.scss';
</style> 