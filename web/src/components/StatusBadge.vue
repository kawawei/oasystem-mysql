<template>
  <span class="status-badge" :class="statusClass">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'approved' | 'rejected'
}>()

const statusClass = computed(() => ({
  'status-pending': props.status === 'pending',
  'status-approved': props.status === 'approved',
  'status-rejected': props.status === 'rejected'
}))

const statusText = computed(() => {
  const texts = {
    pending: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
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
  
  &.status-approved {
    background-color: #67c23a;
    color: #fff;
  }
  
  &.status-rejected {
    background-color: #f56c6c;
    color: #fff;
  }
}
</style> 