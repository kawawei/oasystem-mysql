<template>
  <div class="status-badge" :class="status">
    {{ statusText }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'pending' | 'revision' | 'approved' | 'published' | 'in' | 'out' | 'late' | 'early' | 'normal' | 'new' | 'in_progress' | 'interested' | 'not_interested' | 'call_back' | 'no_answer' | 'busy' | 'invalid' | 'stranger' | 'prospect' | 'cooperative' | 'irrelevant' | 'success' | 'warning' | 'danger' | 'info' | 'visited'
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: ''
})

const statusText = computed(() => {
  if (props.text) return props.text

  const statusMap: Record<string, string> = {
    pending: '待審核',
    revision: '需修改',
    approved: '已通過',
    published: '已發布',
    in: '出勤',
    out: '下班',
    late: '遲到',
    early: '早退',
    normal: '正常',
    new: '新客戶',
    in_progress: '考慮中',
    interested: '有意願',
    not_interested: '無意願',
    call_back: '稍後聯繫',
    no_answer: '無人接聽',
    busy: '忙碌中',
    invalid: '號碼無效',
    stranger: '陌生客戶',
    prospect: '意向客戶',
    cooperative: '合作客戶',
    irrelevant: '不相關',
    visited: '已約訪'
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
  white-space: nowrap;
  min-width: fit-content;
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

.status-badge.late {
  background-color: #FED7D7;
  color: #9B2C2C;
}

.status-badge.early {
  background-color: #FEEBC8;
  color: #9C4221;
}

.status-badge.normal {
  background-color: #E3F9E5;
  color: #276749;
}

.status-badge.new {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.in_progress {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-badge.interested {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-badge.not_interested {
  background-color: #fff1f0;
  color: #f5222d;
}

.status-badge.call_back {
  background-color: #f5f5f5;
  color: #595959;
}

.status-badge.no_answer {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.status-badge.busy {
  background-color: #fff7e6;
  color: #d48806;
}

.status-badge.invalid {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.status-badge.stranger {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.prospect {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-badge.cooperative {
  background-color: #e6fffb;
  color: #13c2c2;
}

.status-badge.success {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-badge.warning {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-badge.danger {
  background-color: #fff1f0;
  color: #f5222d;
}

.status-badge.info {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.irrelevant {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.status-badge.visited {
  background-color: #e6f7ff;
  color: #1890ff;
}
</style> 