<!-- 狀態標籤組件 Status Badge Component -->
<template>
  <span class="status-badge" :class="statusClass">{{ statusText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'completed'
}>()

const statusClass = computed(() => ({
  pending: props.status === 'pending',
  submitted: props.status === 'submitted',
  approved: props.status === 'approved',
  rejected: props.status === 'rejected',
  paid: props.status === 'paid',
  completed: props.status === 'completed'
}))

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    pending: '待收款',
    submitted: '已提交',
    approved: '已核准',
    rejected: '已駁回',
    paid: '已付款',
    completed: '已收款'
  }
  return statusMap[props.status] || props.status
})
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;

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

  &.paid {
    background-color: #f6ffed;
    color: #52c41a;
  }

  &.completed {
    background-color: #f6ffed;
    color: #52c41a;
  }
}
</style> 