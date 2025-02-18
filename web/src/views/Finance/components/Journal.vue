<!-- 日記帳標籤頁 -->
<template>
  <div class="journal">
    <div class="table-container">
      <base-table
        :columns="[
          { key: 'date', title: '支付日期', sortable: true },
          { key: 'time', title: '支付時間' },
          { key: 'serialNumber', title: '單號' },
          { key: 'accountName', title: '支付帳戶' },
          { key: 'paymentTarget', title: '付款對象' },
          { key: 'amount', title: '金額', sortable: true },
          { key: 'type', title: '類型' },
          { key: 'description', title: '說明' },
          { key: 'actions', title: '操作' }
        ]"
        :data="journalRecords"
        :loading="loading"
      >
        <!-- 自定義列渲染 -->
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
            {{ row.type === 'income' ? '收入' : '支出' }}
          </span>
        </template>
        <template #description="{ row }">
          <span>{{ row.description }}</span>
          <span v-if="row.sourceType" class="source-type">
            ({{ row.sourceType === 'reimbursement' ? '請款' : '應付款項' }})
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
// 引入基礎組件
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'

// 定義 props
defineProps<{
  journalRecords: any[]
  loading: boolean
  formatDate: (date: string) => string
  formatTime: (time: string) => string
  formatAmount: (amount: number, currency: string) => string
  handleJournalEdit: (record: any) => void
}>()
</script>

<style lang="scss" scoped>
// 使用全局樣式，無需重複定義
</style> 