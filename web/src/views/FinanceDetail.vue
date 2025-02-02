<template>
  <div class="finance-detail">
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      載入中...
    </div>

    <!-- 當數據載入完成時顯示內容 -->
    <div v-else-if="!!record" class="detail-wrapper">
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
              <span :class="['status-badge', record.status]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
          </tr>
          <tr>
            <td class="label">付款帳號</td>
            <td>{{ record.accountNumber }}</td>
            <td class="label">支付帳號</td>
            <td>{{ record.bankInfo }}</td>
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
                <base-button
                  v-if="item.invoiceImage"
                  type="text"
                  size="small"
                  @click="handleDownload(item.invoiceImage)"
                >
                  <i class="fas fa-download"></i>
                  下載
                </base-button>
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
    </div>

    <!-- 無數據或載入失敗時顯示 -->
    <div v-else class="no-data">
      <i class="fas fa-exclamation-circle"></i>
      無法載入請款詳情
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseModal from '@/common/base/Modal.vue'
import { reimbursementApi } from '@/services/api'
import { message } from '@/plugins/message'

const router = useRouter()
const route = useRoute()
const isProcessing = ref(false)
const isLoading = ref(false)
const record = ref<any>(null)

// 駁回相關
const showRejectModal = ref(false)
const rejectComment = ref('')

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

// 格式化狀態文字
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待提交',
    'submitted': '待審核',
    'approved': '已通過',
    'rejected': '已駁回'
  }
  return statusMap[status] || status
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

// 處理文件下載
const handleDownload = (url: string) => {
  window.open(url, '_blank')
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

// 在組件掛載時獲取數據
onMounted(() => {
  fetchRecord()
})
</script>

<style lang="scss" scoped>
.finance-detail {
  padding: 24px;
  background-color: #fff;
  min-height: calc(100vh - 64px);

  .header {
    margin-bottom: 24px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .back-section {
      .btn-back {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }

  .detail-table {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 24px;

    .title-section {
      margin-bottom: 24px;
      
      .table-title {
        font-size: 20px;
        font-weight: 500;
        color: #1f1f1f;
        margin: 0;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;

      td {
        padding: 12px;
        border: 1px solid #f0f0f0;

        &.label {
          background-color: #fafafa;
          font-weight: 500;
          width: 120px;
        }
      }
    }

    .expense-table {
      th {
        background-color: #fafafa;
        padding: 12px;
        text-align: left;
        font-weight: 500;
        border: 1px solid #f0f0f0;
      }

      td {
        &.quantity,
        &.amount {
          text-align: right;
        }

        &.date,
        &.action {
          text-align: center;
        }
      }

      tfoot {
        td {
          background-color: #fafafa;
          font-weight: 500;

          &.text-right {
            text-align: right;
          }
        }
      }
    }
  }
}

.loading-state,
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #999;
  font-size: 16px;

  i {
    margin-right: 8px;
  }
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

.reject-form {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

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
</style> 