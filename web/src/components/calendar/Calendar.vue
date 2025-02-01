<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <button class="calendar-nav-btn" @click="previousMonth">
        <i class="fas fa-chevron-left"></i>
      </button>
      <h2 class="calendar-title">{{ currentMonthYear }}</h2>
      <button class="calendar-nav-btn" @click="nextMonth">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    <div class="calendar-grid">
      <div class="weekday-header">
        <div class="weekday">MON</div>
        <div class="weekday">TUE</div>
        <div class="weekday">WED</div>
        <div class="weekday">THU</div>
        <div class="weekday">FRI</div>
        <div class="weekday weekend">SAT</div>
        <div class="weekday weekend">SUN</div>
      </div>
      <div class="days-grid">
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday
          }"
        >
          <span class="day-number">{{ day.dayOfMonth }}</span>
          <div class="day-content">
            <div 
              v-for="post in day.posts" 
              :key="post.id"
              class="post-item"
              :class="post.platform"
              @click="emit('view', post.id)"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { Post } from '@/services/api'

dayjs.extend(isoWeek)
dayjs.locale('zh-tw')

// Props
const props = defineProps<{
  posts: Post[]
}>()

const currentMonth = ref(dayjs())

const currentMonthYear = computed(() => {
  return currentMonth.value.format('YYYY年 M月')
})

// 添加格式化時間的函數
const formatTime = (datetime: string) => {
  return dayjs(datetime).format('HH:mm')
}

const calendarDays = computed(() => {
  const start = currentMonth.value.startOf('month').startOf('isoWeek')
  const end = currentMonth.value.endOf('month').endOf('isoWeek')
  const days = []
  let day = start

  while (day.isBefore(end) || day.isSame(end, 'day')) {
    const isCurrentMonth = day.month() === currentMonth.value.month()
    const isToday = day.isSame(dayjs(), 'day')
    const currentDate = day.format('YYYY-MM-DD')
    
    // 獲取當天的所有貼文
    const posts = props.posts.filter(post => 
      dayjs(post.postTime).format('YYYY-MM-DD') === currentDate
    ).sort((a, b) => dayjs(a.postTime).valueOf() - dayjs(b.postTime).valueOf())

    days.push({
      date: currentDate,
      dayOfMonth: day.date(),
      isCurrentMonth,
      isToday,
      posts
    })
    
    day = day.add(1, 'day')
  }

  return days
})

const previousMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
}

// 在 script setup 部分添加 emit 定義
const emit = defineEmits<{
  (e: 'view', postId: number): void
}>()

// 在 script setup 部分添加 getStatusText 函數
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
.calendar-view {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  min-height: 500px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.calendar-nav-btn {
  background: none;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: #1d1d1f;
  transition: all 0.3s;
}

.calendar-nav-btn:hover {
  background: #f5f5f7;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #86868b;
  padding: 8px;
  font-size: 16px;
}

.weekday.weekend {
  color: #ff3b30;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #d1d1d6;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  overflow: hidden;
}

.day-cell {
  background: white;
  height: 120px;
  padding: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-size: 14px;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.other-month {
  background: #f5f5f7;
  
  .day-number {
    color: #86868b;
  }
}

.today {
  .day-number {
    background: #0071e3;
    color: white;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
}

.day-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  height: calc(100% - 24px);
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
}

.post-item {
  background: #f5f5f7;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  /* 防止文字被選中 */
  user-select: none;
}

.post-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-item:active {
  /* 點擊時的反饋效果 */
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
  .day-cell {
    height: 90px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
    margin-bottom: 2px;
  }

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

  .day-content {
    height: calc(100% - 18px);
  }
}
</style> 