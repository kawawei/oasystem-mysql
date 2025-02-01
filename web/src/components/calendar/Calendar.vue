<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <slot name="header">
        <button class="calendar-nav-btn" @click="previousMonth">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h2 class="calendar-title">{{ currentMonthYear }}</h2>
        <button class="calendar-nav-btn" @click="nextMonth">
          <i class="fas fa-chevron-right"></i>
        </button>
      </slot>
    </div>
    <div class="calendar-grid">
      <slot name="weekday-header">
        <div class="weekday-header">
          <div class="weekday">MON</div>
          <div class="weekday">TUE</div>
          <div class="weekday">WED</div>
          <div class="weekday">THU</div>
          <div class="weekday">FRI</div>
          <div class="weekday weekend">SAT</div>
          <div class="weekday weekend">SUN</div>
        </div>
      </slot>
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
          <slot name="day-number" :day="day">
            <span class="day-number">{{ day.dayOfMonth }}</span>
          </slot>
          <div class="day-content">
            <slot name="day-content" :day="day" :events="day.events">
              <!-- 預設內容插槽 -->
            </slot>
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

dayjs.extend(isoWeek)
dayjs.locale('zh-tw')

// Props
const props = defineProps<{
  events?: any[]  // 改為通用的 events
}>()

const currentMonth = ref(dayjs())

const currentMonthYear = computed(() => {
  return currentMonth.value.format('YYYY年 M月')
})

const calendarDays = computed(() => {
  const start = currentMonth.value.startOf('month').startOf('isoWeek')
  const end = currentMonth.value.endOf('month').endOf('isoWeek')
  const days = []
  let day = start

  while (day.isBefore(end) || day.isSame(end, 'day')) {
    const isCurrentMonth = day.month() === currentMonth.value.month()
    const isToday = day.isSame(dayjs(), 'day')
    const currentDate = day.format('YYYY-MM-DD')
    
    // 獲取當天的所有事件並按時間排序
    const events = props.events
      ?.filter(event => 
        dayjs(event.time || event.date || event.postTime).format('YYYY-MM-DD') === currentDate
      )
      .sort((a, b) => {
        const timeA = dayjs(a.time || a.date || a.postTime)
        const timeB = dayjs(b.time || b.date || b.postTime)
        return timeA.valueOf() - timeB.valueOf()
      }) || []

    days.push({
      date: currentDate,
      dayOfMonth: day.date(),
      isCurrentMonth,
      isToday,
      events
    })
    
    day = day.add(1, 'day')
  }

  return days
})

const previousMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  emit('month-change', currentMonth.value.format('YYYY-MM-DD'))
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
  emit('month-change', currentMonth.value.format('YYYY-MM-DD'))
}

// 定義事件
const emit = defineEmits<{
  (e: 'event-click', eventId: number): void
  (e: 'day-click', date: string): void
  (e: 'month-change', date: string): void
}>()
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

@media (max-width: 768px) {
  .day-cell {
    height: 90px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
    margin-bottom: 2px;
  }

  .day-content {
    height: calc(100% - 18px);
  }
}
</style> 