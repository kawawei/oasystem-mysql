<!-- 狀態標籤組件 Status Badge Component -->
<template>
  <span :class="['status-badge', status.toLowerCase()]">
    {{ getStatusText(status) }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'paid' | 'submitted' | 'approved' | 'rejected'
}

defineProps<Props>()

const getStatusText = (status: Props['status']) => {
  const statusMap = {
    'PENDING': '待確認',
    'CONFIRMED': '已確認',
    'CANCELLED': '已取消',
    'paid': '已付款',
    'submitted': '已提交',
    'approved': '已核准',
    'rejected': '已駁回'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
}

.pending {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

.confirmed {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.cancelled {
  background-color: #fff1f0;
  border: 1px solid #ffa39e;
  color: #f5222d;
}

.paid {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.submitted {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

.approved {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.rejected {
  background-color: #fff1f0;
  border: 1px solid #ffa39e;
  color: #f5222d;
}
</style> 