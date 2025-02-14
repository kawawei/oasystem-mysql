<template>
  <div class="finance-detail">
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
                type="secondary"
                @click="handlePrint"
                :loading="isPrinting"
              >
                <i class="fas fa-print"></i>
                列印
              </base-button>
              <base-button
                v-if="record?.status === 'submitted'"
                type="primary"
                class="approve-btn"
                @click="handleApprove"
                :loading="isProcessing"
              >
                通過
              </base-button>
              <base-button
                v-if="record?.status === 'submitted'"
                type="primary"
                class="reject-btn"
                @click="handleReject"
                :loading="isProcessing"
              >
                駁回
              </base-button>
              <base-button
                v-if="record?.status === 'approved'"
                type="primary"
                class="pay-btn"
                @click="handlePay"
                :loading="isProcessing"
              >
                付款
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
              <td>{{ record.submitter?.department }}</td>
            </tr>
            <tr>
              <td class="label">序號</td>
              <td>{{ record.serialNumber }}</td>
              <td class="label">幣種</td>
              <td>{{ record.currency === 'TWD' ? '新台幣 (NT$)' : '人民幣 (¥)' }}</td>
            </tr>
            <tr>
              <td class="label">申請人</td>
              <td>{{ record.submitter?.name }}</td>
              <td class="label">簽核</td>
              <td>
                <status-badge :status="record.status" />
              </td>
            </tr>
            <tr>
              <td class="label">付款對象</td>
              <td>{{ record.paymentTarget || '無' }}</td>
              <td class="label">請款人</td>
              <td>{{ record.payee }}</td>
            </tr>
            <tr>
              <td class="label">付款帳號</td>
              <td>{{ record.accountNumber }}</td>
              <td class="label">支付帳號</td>
              <td>
                <template v-if="record.status === 'approved'">
                  <base-select
                    v-model="selectedAccount"
                    :options="accountOptions"
                    placeholder="請選擇支付帳號"
                    size="small"
                    @change="handleAccountChange"
                  >
                    <template #option="{ option }">
                      <div class="account-option">
                        <span>{{ option.name }}</span>
                        <span class="account-balance">{{ formatAmount(option.currentBalance, option.currency) }}</span>
                      </div>
                    </template>
                  </base-select>
                </template>
                <template v-else>
                  {{ record.bankInfo || '-' }}
                </template>
              </td>
            </tr>
          </table>

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
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in record.items" :key="index">
                <td>{{ item.accountCode }}</td>
                <td>{{ item.accountName }}</td>
                <td>{{ item.invoiceNumber || '-' }}</td>
                <td>{{ item.description }}</td>
                <td class="quantity">{{ item.quantity }}</td>
                <td class="amount">{{ formatAmount(item.amount, record.currency) }}</td>
                <td class="amount">{{ formatAmount(item.tax, record.currency) }}</td>
                <td class="amount">{{ formatAmount(item.fee, record.currency) }}</td>
                <td class="amount">{{ formatAmount(item.total, record.currency) }}</td>
                <td class="date">{{ item.date ? formatDate(item.date) : '-' }}</td>
                <td class="action">
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
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right">合計：</td>
                <td class="amount">{{ formatAmount(totalAmount, record.currency) }}</td>
                <td class="amount">{{ formatAmount(totalTax, record.currency) }}</td>
                <td class="amount">{{ formatAmount(totalFee, record.currency) }}</td>
                <td class="amount">{{ formatAmount(grandTotal, record.currency) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <!-- 添加 PDF 附件區域 -->
          <div class="attachments-section" v-if="record?.attachments && record.attachments.length > 0">
            <div class="section-header">
              <h3 class="section-title">PDF 附件</h3>
            </div>
            <div class="pdf-files-list">
              <div 
                v-for="(attachment, index) in record.attachments" 
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
                </div>
              </div>
            </div>
          </div>

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
          :show-footer="true"
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
          <template #footer>
            <div class="modal-footer">
              <base-button 
                @click="showPdfPreview = false"
                style="margin-right: 12px;"
              >
                關閉
              </base-button>
              <base-button 
                type="primary" 
                @click="downloadPdf"
                v-if="pdfPreviewUrl"
              >
                下載 PDF
              </base-button>
            </div>
          </template>
        </base-modal>
      </div>
      <div v-else class="no-data">
        <i class="fas fa-exclamation-circle"></i>
        無法載入請款詳情
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseModal from '@/common/base/Modal.vue'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'
import BaseSelect from '@/common/base/Select.vue'
import { accountApi } from '@/services/api/account'
import type { Account } from '@/types/account'

const router = useRouter()
const route = useRoute()
const isProcessing = ref(false)
const isLoading = ref(false)
const record = ref<any>(null)

// 駁回相關
const showRejectModal = ref(false)
const rejectComment = ref('')

// 圖片預覽相關
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// PDF 預覽相關
const showPdfPreview = ref(false)
const pdfPreviewUrl = ref('')

// 列印相關
const isPrinting = ref(false)

// 帳戶相關
const accounts = ref<Account[]>([])
const accountOptions = computed(() => 
  accounts.value.map(account => ({
    label: `${account.name} (${account.currency})`,
    value: account.id,
    currency: account.currency,
    currentBalance: account.currentBalance,
    name: account.name,
    id: account.id  // 確保 id 也被包含在選項中
  }))
)
const selectedAccount = ref<string | number>('')

// 計算總金額
const totalAmount = computed(() => {
  if (!record.value?.items) return 0
  return record.value.items.reduce((sum: number, item: any) => {
    const amount = Number(item.amount) || 0
    return sum + amount
  }, 0)
})

const totalTax = computed(() => {
  if (!record.value?.items) return 0
  return record.value.items.reduce((sum: number, item: any) => {
    const tax = Number(item.tax) || 0
    return sum + tax
  }, 0)
})

const totalFee = computed(() => {
  if (!record.value?.items) return 0
  return record.value.items.reduce((sum: number, item: any) => {
    const fee = Number(item.fee) || 0
    return sum + fee
  }, 0)
})

const grandTotal = computed(() => {
  const sum = Number(totalAmount.value) + Number(totalTax.value) + Number(totalFee.value)
  return Number(sum.toFixed(2))
})

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

// 格式化金額
const formatAmount = (amount: number | undefined, currency: string) => {
  const value = Number(amount || 0)
  if (isNaN(value)) return currency === 'TWD' ? 'NT$ 0.00' : '¥ 0.00'
  return currency === 'TWD' 
    ? `NT$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `¥ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}


// 處理付款
const handlePay = async () => {
  if (!selectedAccount.value) {
    message.error('請選擇支付帳號')
    return
  }

  try {
    isProcessing.value = true
    console.log('Debug - selectedAccount:', selectedAccount.value)
    console.log('Debug - accounts:', accounts.value)
    console.log('Debug - accountOptions:', accountOptions.value)

    // 使用 Number 轉換確保比較時類型一致
    const accountId = Number(selectedAccount.value)
    const account = accounts.value.find(acc => acc.id === accountId)
    
    console.log('Debug - accountId:', accountId)
    console.log('Debug - found account:', account)

    if (!account) {
      message.error('找不到選擇的支付帳號')
      return
    }

    const response = await reimbursementApi.reviewReimbursement(record.value?.id as number, {
      status: 'paid',
      reviewComment: '',
      bankInfo: `${account.name} (${account.currency})`,
      accountId: accountId
    })
    
    if (response.status === 200) {
      message.success('付款成功')
      await fetchRecord() // 重新獲取記錄以更新顯示
    }
  } catch (error: any) {
    console.error('付款失敗:', error)
    // 處理餘額不足的錯誤
    if (error.response?.data?.message === '帳戶餘額不足') {
      const { currentBalance, requiredAmount } = error.response.data
      const account = accounts.value.find(acc => acc.id === Number(selectedAccount.value))
      message.error(`帳戶餘額不足，當前餘額: ${formatAmount(currentBalance, account?.currency || 'TWD')}，需要金額: ${formatAmount(requiredAmount, record.value?.currency || 'TWD')}`)
    } else {
      message.error(error.message || '付款失敗')
    }
  } finally {
    isProcessing.value = false
  }
}

// 處理圖片 URL
const getImageUrl = (url: string) => {
  if (!url) return ''
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  if (url.startsWith('blob:')) {
    return url
  }
  
  const baseUrl = import.meta.env.VITE_STATIC_URL || ''
  const staticUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  return `${staticUrl}/uploads/${url}`
}

// 打開圖片預覽
const openImagePreview = (url: string) => {
  if (!url) return
  previewImageUrl.value = url
  showImagePreview.value = true
}

// 打開 PDF 預覽
const openPdfPreview = (url: string) => {
  if (!url) return
  const baseUrl = import.meta.env.VITE_STATIC_URL || ''
  const staticUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  pdfPreviewUrl.value = url.startsWith('/') ? `${staticUrl}${url}` : url
  showPdfPreview.value = true
}

// 處理簽核
const handleApprove = async () => {
  try {
    isProcessing.value = true
    await reimbursementApi.reviewReimbursement(record.value.id, {
      status: 'approved',
      reviewComment: '同意'
    })
    message.success('簽核成功')
    fetchRecord()
  } catch (error) {
    console.error('Error approving reimbursement:', error)
    message.error('簽核失敗')
  } finally {
    isProcessing.value = false
  }
}

// 處理駁回
const handleReject = () => {
  rejectComment.value = ''
  showRejectModal.value = true
}

// 確認駁回
const confirmReject = async () => {
  if (!rejectComment.value.trim()) {
    message.error('請輸入駁回原因')
    return
  }

  try {
    isProcessing.value = true
    await reimbursementApi.reviewReimbursement(record.value.id, {
      status: 'rejected',
      reviewComment: rejectComment.value.trim()
    })
    message.success('駁回成功')
    showRejectModal.value = false
    fetchRecord()
  } catch (error) {
    console.error('Error rejecting reimbursement:', error)
    message.error('駁回失敗')
  } finally {
    isProcessing.value = false
  }
}

// 獲取記錄詳情
const fetchRecord = async () => {
  const id = route.params.id
  if (!id) return

  try {
    isLoading.value = true
    const { data } = await reimbursementApi.getReimbursement(Number(id))
    record.value = data
  } catch (error) {
    console.error('Error fetching record:', error)
    message.error('獲取記錄失敗')
  } finally {
    isLoading.value = false
  }
}

// 處理列印
const handlePrint = async () => {
  if (!record.value) return
  
  try {
    isPrinting.value = true
    
    // 動態導入 pdf-lib 和 html2pdf.js
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.async = true
    
    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
    
    // 創建要列印的內容
    const printContent = document.createElement('div')
    printContent.className = 'finance-detail print-content'
    
    // 複製當前詳情內容的樣式
    const styles = document.querySelectorAll('style')
    styles.forEach(style => {
      printContent.appendChild(style.cloneNode(true))
    })
    
    // 創建內容容器
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'detail-wrapper'
    
    // 複製當前詳情內容
    const detailContent = document.querySelector('.detail-table')?.cloneNode(true) as HTMLElement
    if (detailContent) {
      // 移除不需要列印的元素
      const actionsToRemove = detailContent.querySelectorAll('.action-buttons, .edit-actions, .attachments-section')
      actionsToRemove.forEach(el => el.remove())
      
      contentWrapper.appendChild(detailContent)
    }
    
    printContent.appendChild(contentWrapper)
    document.body.appendChild(printContent)
    
    // PDF 配置
    const opt = {
      margin: [10, 10],
      filename: `${record.value.serialNumber}_請款單.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2,  // 提高清晰度
        useCORS: true,
        logging: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape'
      }
    }
    
    // 生成 PDF 並獲取 blob URL
    // @ts-ignore
    const pdf = await window.html2pdf().set(opt).from(printContent).output('bloburl')
    
    // 清理臨時創建的元素
    document.body.removeChild(printContent)
    
    // 在 modal 中預覽 PDF
    pdfPreviewUrl.value = pdf
    showPdfPreview.value = true
    
    // 添加下載按鈕到 modal footer
    const modalFooter = document.querySelector('.pdf-preview-modal .base-modal-footer')
    if (modalFooter) {
      const downloadButton = document.createElement('button')
      downloadButton.className = 'base-button primary'
      downloadButton.textContent = '下載 PDF'
      downloadButton.onclick = () => {
        const link = document.createElement('a')
        link.href = pdf
        link.download = `${record.value.serialNumber}_請款單.pdf`
        link.click()
      }
      modalFooter.appendChild(downloadButton)
    }
    
    message.success('PDF 生成成功')
  } catch (error) {
    console.error('Error generating PDF:', error)
    message.error('PDF 生成失敗')
  } finally {
    isPrinting.value = false
    // 清理腳本
    const scripts = document.querySelectorAll('script[src*="html2pdf"]')
    scripts.forEach(script => script.remove())
  }
}

// 下載 PDF
const downloadPdf = () => {
  if (!pdfPreviewUrl.value || !record.value) return
  
  const link = document.createElement('a')
  link.href = pdfPreviewUrl.value
  link.download = `${record.value.serialNumber}_請款單.pdf`
  link.click()
}

// 處理支付帳號變更
const handleAccountChange = async (accountId: string | number) => {
  console.log('帳號變更:', { accountId, accounts: accounts.value })
  
  // 使用 Number 轉換確保比較時類型一致
  const numericAccountId = Number(accountId)
  const account = accounts.value.find(acc => acc.id === numericAccountId)
  
  if (account) {
    // 更新本地 bankInfo
    record.value.bankInfo = `${account.name} (${account.currency})`
    record.value.accountId = numericAccountId
    
    // 更新後端
    try {
      isProcessing.value = true
      await reimbursementApi.reviewReimbursement(record.value.id, {
        status: record.value.status,
        bankInfo: record.value.bankInfo,
        accountId: numericAccountId,
        reviewComment: record.value.reviewComment || ''
      })
      message.success('支付帳號已更新')
    } catch (error) {
      console.error('更新支付帳號失敗:', error)
      message.error('更新支付帳號失敗')
    } finally {
      isProcessing.value = false
    }
  }
}

// 獲取帳戶列表
const fetchAccounts = async () => {
  try {
    const response = await accountApi.getAccounts()
    if (response && Array.isArray(response.data)) {
      accounts.value = response.data
    }
  } catch (error) {
    console.error('Error fetching accounts:', error)
    message.error('獲取帳戶列表失敗')
  }
}

// 在組件掛載時獲取數據
onMounted(() => {
  fetchRecord()
  fetchAccounts()
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/financeDetail.scss';

// 列印樣式
@media print {
  .finance-detail {
    padding: 0;
    background: none;
    
    .header,
    .action-buttons,
    .edit-actions,
    .attachments-section {
      display: none;
    }
    
    .detail-table {
      box-shadow: none;
      
      table {
        page-break-inside: avoid;
      }
    }
  }
}

:deep(.base-button) {
  i {
    margin-right: 4px;
  }
}

.account-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;

  .account-balance {
    color: #666;
    font-size: 0.9em;
  }
}
</style> 