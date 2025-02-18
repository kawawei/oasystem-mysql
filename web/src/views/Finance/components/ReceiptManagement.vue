<!-- 收款管理標籤頁 -->
<template>
  <div class="receipt-management">
    <div class="table-container">
      <base-table
        :data="receiptRecords"
        :loading="loading"
        :columns="[
          { key: 'serialNumber', title: '收款單號' },
          { key: 'account', title: '收款帳戶' },
          { key: 'amount', title: '金額' },
          { key: 'payer', title: '付款方' },
          { key: 'paymentDate', title: '收款日期' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #account="{ row }">
          {{ row.accountName }} ({{ row.currency }})
        </template>
        <template #amount="{ row }">
          {{ formatAmount(row.amount, row.currency) }}
        </template>
        <template #status="{ row }">
          <status-badge :status="row.status" />
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <base-button
              type="primary"
              size="small"
              @click="viewReceiptDetail(row)"
            >
              查看
            </base-button>
            <base-button
              type="danger"
              size="small"
              @click="handleDeleteReceipt(row)"
            >
              刪除
            </base-button>
            <base-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              class="approve-btn"
              @click="handleConfirmReceipt(row)"
            >
              確認收款
            </base-button>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無收款記錄</div>
        </template>
        <template #loading>
          <div class="loading-content">
            <i class="fas fa-spinner fa-spin"></i>
            <span>載入中...</span>
          </div>
        </template>
      </base-table>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入基礎組件
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import StatusBadge from '@/components/StatusBadge.vue'

// 定義 props
defineProps<{
  receiptRecords: any[]
  loading: boolean
  formatAmount: (amount: number, currency: string) => string
  viewReceiptDetail: (record: any) => void
  handleDeleteReceipt: (record: any) => void
  handleConfirmReceipt: (record: any) => void
}>()
</script>

<style lang="scss" scoped>
// 使用全局樣式，無需重複定義
</style> 