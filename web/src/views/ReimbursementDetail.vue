<template>
  <div class="reimbursement-detail">
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
          <h1>請款詳情</h1>
        </div>
        <div class="action-buttons" v-if="canApprove">
          <base-button
            type="danger"
            @click="handleReject"
            :loading="isProcessing"
          >
            駁回
          </base-button>
          <base-button
            type="primary"
            @click="handleApprove"
            :loading="isProcessing"
          >
            通過
          </base-button>
        </div>
      </div>
    </header>

    <!-- 詳情內容 -->
    <div class="detail-content">
      <base-card class="info-card">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
            <span :class="['status-badge', record.status]">
              {{ getStatusText(record.status) }}
            </span>
          </div>
        </template>
        <template #content>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">申請人</span>
              <span class="value">{{ record.applicant }}</span>
            </div>
            <div class="info-item">
              <span class="label">申請日期</span>
              <span class="value">{{ formatDate(record.date) }}</span>
            </div>
            <div class="info-item">
              <span class="label">類別</span>
              <span class="value">{{ record.category }}</span>
            </div>
            <div class="info-item">
              <span class="label">金額</span>
              <span class="value">{{ formatAmount(record.amount) }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">描述</span>
              <span class="value">{{ record.description || '無' }}</span>
            </div>
          </div>
        </template>
      </base-card>

      <!-- 附件列表 -->
      <base-card class="attachments-card" v-if="record.attachments?.length">
        <template #header>
          <h3>附件</h3>
        </template>
        <template #content>
          <div class="attachments-list">
            <div 
              v-for="(attachment, index) in record.attachments" 
              :key="index"
              class="attachment-item"
            >
              <i class="fas fa-file"></i>
              <span class="filename">{{ attachment }}</span>
              <base-button
                type="text"
                size="small"
                @click="downloadAttachment(attachment)"
              >
                <i class="fas fa-download"></i>
              </base-button>
            </div>
          </div>
        </template>
      </base-card>

      <!-- 審批記錄 -->
      <base-card class="approval-history-card">
        <template #header>
          <h3>審批記錄</h3>
        </template>
        <template #content>
          <div class="approval-timeline">
            <div 
              v-for="(history, index) in approvalHistory" 
              :key="index"
              class="timeline-item"
            >
              <div class="timeline-icon">
                <i :class="getTimelineIcon(history.action)"></i>
              </div>
              <div class="timeline-content">
                <div class="action">
                  {{ getActionText(history.action) }}
                  <span class="operator">{{ history.operator }}</span>
                </div>
                <div class="time">{{ formatDateTime(history.time) }}</div>
                <div class="comment" v-if="history.comment">
                  {{ history.comment }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </base-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@/common/base/Button.vue'
import BaseCard from '@/common/base/Card.vue'

interface ApprovalHistory {
  action: 'submit' | 'approve' | 'reject'
  operator: string
  time: string
  comment?: string
}

interface ReimbursementRecord {
  id: number
  date: string
  applicant: string
  amount: number
  category: string
  status: 'pending' | 'approved' | 'rejected'
  description?: string
  attachments?: string[]
}

const router = useRouter()
const route = useRoute()
const isProcessing = ref(false)

// 模擬數據
const record = ref<ReimbursementRecord>({
  id: Number(route.params.id),
  date: new Date().toISOString(),
  applicant: route.query.applicant as string,
  amount: 1000,
  category: route.query.category as string,
  status: (route.query.status as ReimbursementRecord['status']) || 'pending',
  description: '出差住宿費用報銷',
  attachments: ['invoice.pdf', 'receipt.jpg']
})

const approvalHistory = ref<ApprovalHistory[]>([
  {
    action: 'submit',
    operator: '張三',
    time: '2024-01-20 09:30:00',
    comment: '請審批'
  }
])

// 判斷當前用戶是否有審批權限
const canApprove = computed(() => {
  return record.value.status === 'pending'
  // TODO: 添加用戶角色判斷
})

// 格式化狀態文字
const getStatusText = (status: ReimbursementRecord['status']) => {
  const statusMap = {
    pending: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
  }
  return statusMap[status]
}

// 格式化金額
const formatAmount = (amount: number) => {
  return `NT$ ${amount.toLocaleString()}`
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

// 格式化日期時間
const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('zh-TW')
}

// 獲取時間軸圖標
const getTimelineIcon = (action: ApprovalHistory['action']) => {
  const iconMap = {
    submit: 'fas fa-paper-plane',
    approve: 'fas fa-check-circle',
    reject: 'fas fa-times-circle'
  }
  return iconMap[action]
}

// 獲取操作文字
const getActionText = (action: ApprovalHistory['action']) => {
  const textMap = {
    submit: '提交申請',
    approve: '通過申請',
    reject: '駁回申請'
  }
  return textMap[action]
}

// 下載附件
const downloadAttachment = (filename: string) => {
  // TODO: 實現附件下載功能
  console.log('下載附件:', filename)
}

// 處理通過
const handleApprove = async () => {
  isProcessing.value = true
  try {
    // TODO: 調用審批 API
    record.value.status = 'approved'
    approvalHistory.value.push({
      action: 'approve',
      operator: '管理員',
      time: new Date().toISOString(),
      comment: '已審核通過'
    })
  } finally {
    isProcessing.value = false
  }
}

// 處理駁回
const handleReject = async () => {
  isProcessing.value = true
  try {
    // TODO: 調用駁回 API
    record.value.status = 'rejected'
    approvalHistory.value.push({
      action: 'reject',
      operator: '管理員',
      time: new Date().toISOString(),
      comment: '資料不完整，請補充'
    })
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  // TODO: 加載請款詳情數據
})
</script>

<style lang="scss" scoped>
.reimbursement-detail {
  padding: 20px;

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

        h1 {
          font-size: 24px;
          margin: 0;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .info-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          font-size: 18px;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;

          &.full-width {
            grid-column: 1 / -1;
          }

          .label {
            color: #666;
            font-size: 14px;
          }

          .value {
            font-size: 16px;
          }
        }
      }
    }

    .attachments-card {
      .attachments-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .attachment-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background-color: #f5f5f5;
          border-radius: 4px;

          i {
            color: #666;
          }

          .filename {
            flex: 1;
          }
        }
      }
    }

    .approval-history-card {
      .approval-timeline {
        padding: 16px 0;

        .timeline-item {
          display: flex;
          gap: 16px;
          position: relative;
          padding-bottom: 20px;

          &:not(:last-child)::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 24px;
            bottom: 0;
            width: 2px;
            background-color: #e8e8e8;
          }

          .timeline-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;

            i {
              color: #666;
              
              &.fa-check-circle {
                color: #52c41a;
              }
              
              &.fa-times-circle {
                color: #f5222d;
              }
            }
          }

          .timeline-content {
            flex: 1;

            .action {
              font-size: 16px;
              margin-bottom: 4px;

              .operator {
                color: #666;
                margin-left: 8px;
              }
            }

            .time {
              font-size: 14px;
              color: #999;
              margin-bottom: 4px;
            }

            .comment {
              font-size: 14px;
              color: #666;
              background-color: #f5f5f5;
              padding: 8px;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }
}

// 狀態標籤樣式
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.pending {
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

    .detail-content {
      .info-card {
        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style> 