<!-- 請款申請標籤頁 -->
<template>
  <div class="pending-list">
    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
      <base-table
        :data="filteredRecords"
        :columns="[
          { key: 'serialNumber', title: '單號' },
          { key: 'type', title: '類型' },
          { key: 'applicant', title: '申請人' },
          { key: 'amount', title: '金額' },
          { key: 'status', title: '狀態' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #type="{ row }">
          {{ row.type === 'reimbursement' ? '請款' : '應付款項' }}
        </template>
        <template #amount="{ row }">
          {{ formatAmount(row.amount) }}
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
            <template v-if="row.status === 'submitted'">
              <base-button
                type="primary"
                size="small"
                class="approve-btn"
                @click="handleApprove(row)"
              >
                簽核
              </base-button>
              <base-button
                type="primary"
                size="small"
                class="reject-btn"
                @click="handleReject(row)"
              >
                駁回
              </base-button>
            </template>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無記錄</div>
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
              <span class="label">類型：</span>
              <span class="value">{{ record.type === 'reimbursement' ? '請款' : '應付款項' }}</span>
            </div>
            <div class="info-item">
              <span class="label">申請人：</span>
              <span class="value">{{ record.applicant }}</span>
            </div>
            <div class="info-item">
              <span class="label">金額：</span>
              <span class="value">{{ formatAmount(record.amount) }}</span>
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
            <template v-if="record.status === 'submitted'">
              <base-button
                type="primary"
                size="small"
                class="approve-btn"
                @click="handleApprove(record)"
              >
                簽核
              </base-button>
              <base-button
                type="primary"
                size="small"
                class="reject-btn"
                @click="handleReject(record)"
              >
                駁回
              </base-button>
            </template>
          </div>
        </template>
      </base-card>
      <base-card v-if="filteredRecords.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無記錄</div>
        </template>
      </base-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入基礎組件
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import StatusBadge from '@/components/StatusBadge.vue'

// 定義 props
defineProps<{
  isMobile: boolean
  filteredRecords: any[]
  formatAmount: (amount: number) => string
  viewDetail: (record: any) => void
  handleApprove: (record: any) => void
  handleReject: (record: any) => void
}>()
</script>

<style lang="scss" scoped>
// 使用全局樣式，無需重複定義
</style> 