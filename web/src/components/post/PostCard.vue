<template>
  <base-card class="post-card" hoverable @click="$emit('view', post)">
    <template #header>
      <div class="card-header-content">
        <h3>{{ post.title }}</h3>
        <platform-icon :platform="post.platform" />
      </div>
    </template>
    
    <div class="info-list">
      <div class="info-item">
        <span class="label">發文時間：</span>
        <span class="value">{{ formatDateTime(post.postTime) }}</span>
      </div>
      <div class="info-item">
        <span class="label">發文人：</span>
        <span class="value">{{ post.creator?.name || '未指定' }}</span>
      </div>
      <div class="info-item">
        <span class="label">狀態：</span>
        <status-badge :status="post.status" />
      </div>
    </div>
  </base-card>
</template>

<script setup lang="ts">
import { type Post as ApiPost } from '@/services/api'
import BaseCard from '@/common/base/Card.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import PlatformIcon from '@/common/base/PlatformIcon.vue'
import dayjs from 'dayjs'

interface Post extends ApiPost {
  creator?: {
    id: number
    name: string
  }
}

interface Props {
  post: Post
}

defineProps<Props>()
defineEmits<{
  (e: 'view', post: Post): void
}>()

const formatDateTime = (datetime: string) => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.post-card {
  .card-header-content {
    @include flex-row($spacing-sm);
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    h3 {
      margin: 0;
      font-size: $font-size-base;
      font-weight: 500;
      color: $text-primary;
    }
  }
  
  .info-list {
    @include flex-col($spacing-sm);
  }
  
  .info-item {
    @include flex-row($spacing-sm);
    
    .label {
      color: $text-secondary;
      font-size: $font-size-base;
      min-width: 80px;
    }
    
    .value {
      color: $text-primary;
      font-size: $font-size-base;
    }
  }
}</style> 