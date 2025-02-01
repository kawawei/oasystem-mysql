<template>
  <Calendar :events="posts" @event-click="handleEventClick">
    <template #day-content="{ events }">
      <div 
        v-for="post in events" 
        :key="post.id"
        class="post-item"
        :class="post.platform"
        @click="$emit('view', post.id)"
      >
        <div class="post-info">
          <span class="post-time">{{ formatTime(post.postTime) }}</span>
          <div class="post-content">
            <i 
              :class="[
                post.platform === 'facebook' ? 'fab fa-facebook' : 
                post.platform === 'instagram' ? 'fab fa-instagram' :
                'fab fa-line',
                'platform-icon'
              ]"
            ></i>
            <span class="post-title">{{ post.title }}</span>
            <span class="post-status" :class="post.status">{{ getStatusText(post.status) }}</span>
          </div>
        </div>
      </div>
    </template>
  </Calendar>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import Calendar from './Calendar.vue'
import type { Post } from '@/services/api'

// Props
defineProps<{
  posts: Post[]
}>()

// Emits
const emit = defineEmits<{
  (e: 'view', postId: number): void
}>()

// 格式化時間
const formatTime = (datetime: string) => {
  return dayjs(datetime).format('HH:mm')
}

// 處理事件點擊
const handleEventClick = (eventId: number) => {
  emit('view', eventId)
}

// 獲取狀態文字
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待審核',
    revision: '需修改',
    approved: '已通過',
    published: '已發布'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.post-item {
  background: #f5f5f7;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.post-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-item:active {
  transform: scale(0.98);
}

.post-item.facebook {
  background: #f5f9ff;
  border-left: 3px solid #1877f2;
  
  .platform-icon {
    color: #1877f2;
  }
}

.post-item.instagram {
  background: #fff0f6;
  border-left: 3px solid #e4405f;
  
  .platform-icon {
    color: #e4405f;
  }
}

.post-item.line {
  background: #f3fff0;
  border-left: 3px solid #00b900;
  
  .platform-icon {
    color: #00b900;
  }
}

.post-info {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: space-between;
}

.post-time {
  color: #86868b;
  font-size: 12px;
  flex-shrink: 0;
}

.post-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.platform-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.post-title {
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  max-width: 120px;
}

.post-status {
  font-size: 12px;
  margin-left: 6px;
  flex-shrink: 0;
  
  &.pending {
    color: #d46b08;
  }
  
  &.revision {
    color: #cf1322;
  }
  
  &.approved {
    color: #389e0d;
  }
  
  &.published {
    color: #096dd9;
  }
}

@media (max-width: 768px) {
  .post-item {
    padding: 2px 6px;
  }

  .post-info {
    gap: 4px;
  }
  
  .post-time {
    font-size: 10px;
  }

  .platform-icon {
    font-size: 12px;
  }
  
  .post-title {
    font-size: 10px;
    max-width: 80px;
  }

  .post-status {
    font-size: 10px;
  }
}
</style> 