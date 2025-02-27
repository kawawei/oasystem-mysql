<!-- 日記帳標籤頁 Journal Tab -->
<template>
  <div class="journal">
    <div class="table-container">
      <base-table
        :columns="[
          { key: 'date', title: '交易日期', sortable: true },
          { key: 'time', title: '交易時間' },
          { key: 'serialNumber', title: '單號' },
          { key: 'accountName', title: '交易帳戶' },
          { key: 'paymentTarget', title: '交易對象' },
          { key: 'amount', title: '金額', sortable: true },
          { key: 'type', title: '類型' },
          { key: 'description', title: '說明' },
          { key: 'actions', title: '操作' }
        ]"
        :data="journalRecords"
        :loading="loading"
      >
        <!-- 自定義列渲染 Custom column rendering -->
        <template #date="{ row }">
          {{ formatDate(row.date) }}
        </template>
        <template #time="{ row }">
          {{ formatTime(row.time) }}
        </template>
        <template #amount="{ row }">
          <span :class="{ 'income': row.type === 'income', 'expense': row.type === 'expense' }">
            {{ formatAmount(row.amount, row.currency) }}
          </span>
        </template>
        <template #type="{ row }">
          <span :class="{ 'type-tag': true, [row.type]: true }">
            {{ getTransactionType(row) }}
          </span>
        </template>
        <template #description="{ row }">
          <span>{{ row.description }}</span>
          <span v-if="row.sourceType" class="source-type">
            ({{ getSourceTypeLabel(row.sourceType) }})
          </span>
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <base-button
              type="primary"
              size="small"
              @click="handleJournalEdit(row)"
            >
              查看
            </base-button>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-table>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入基礎組件 Import base components
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'

// 定義 props Define props
defineProps<{
  journalRecords: any[]
  loading: boolean
  formatDate: (date: string) => string
  formatTime: (time: string) => string
  formatAmount: (amount: number, currency: string) => string
  handleJournalEdit: (record: any) => void
}>()

// 獲取交易類型顯示文字 Get transaction type display text
const getTransactionType = (row: any) => {
  if (row.sourceType === 'receipt') {
    return '收款'
  } else if (row.sourceType === 'reimbursement') {
    return '付款'
  } else {
    return row.type === 'income' ? '其他收入' : '其他支出'
  }
}

// 獲取來源類型標籤 Get source type label
const getSourceTypeLabel = (sourceType: string) => {
  const typeMap: Record<string, string> = {
    'receipt': '收款',
    'reimbursement': '請款',
    'payable': '應付款項',
    'manual': '其他'
  }
  return typeMap[sourceType] || '其他'
}
</script>

<style lang="scss" scoped>
.journal {
  .type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    
    &.income {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
    }
    
    &.expense {
      background-color: #fff1f0;
      border: 1px solid #ffa39e;
      color: #f5222d;
    }
  }

  .source-type {
    margin-left: 4px;
    color: #8c8c8c;
    font-size: 12px;
  }

  .income {
    color: #52c41a;
  }

  .expense {
    color: #f5222d;
  }
}
</style> 