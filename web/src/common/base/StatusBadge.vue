<template>
  <div class="status-badge" :class="status">
    {{ statusText }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'pending' | 'revision' | 'approved' | 'published' | 'in' | 'out'
}

const props = defineProps<Props>()

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    pending: '待審核',
    revision: '需修改',
    approved: '已通過',
    published: '已發布',
    in: '出勤',
    out: '下班'
  }
  return statusMap[props.status] || props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fff7e6;
  color: #d46b08;
}

.status-badge.revision {
  background-color: #fff1f0;
  color: #cf1322;
}

.status-badge.approved {
  background-color: #f6ffed;
  color: #389e0d;
}

.status-badge.published {
  background-color: #e6f7ff;
  color: #096dd9;
}

.status-badge.in {
  background-color: #E3F9E5;
  color: #276749;
}

.status-badge.out {
  background-color: #E2E8F0;
  color: #2D3748;
}
</style> 