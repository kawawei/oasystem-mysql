<template>
  <span class="status-badge" :class="statusClass">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
}>()

const statusClass = computed(() => ({
  'status-pending': props.status === 'pending',
  'status-submitted': props.status === 'submitted',
  'status-approved': props.status === 'approved',
  'status-rejected': props.status === 'rejected',
  'status-paid': props.status === 'paid'
}))

const statusText = computed(() => {
  const texts = {
    pending: '待提交',
    submitted: '待審核',
    approved: '已通過',
    rejected: '已拒絕',
    paid: '已付款'
  }
  return texts[props.status]
})
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  
  &.status-pending {
    background-color: #e6a23c;
    color: #fff;
  }
  
  &.status-submitted {
    background-color: #409eff;
    color: #fff;
  }
  
  &.status-approved {
    background-color: #67c23a;
    color: #fff;
  }
  
  &.status-paid {
    background-color: #909399;
    color: #fff;
  }
  
  &.status-rejected {
    background-color: #f56c6c;
    color: #fff;
  }
}
</style> 