<template>
  <div class="attendance-record">
    <!-- 桌面端視圖 -->
    <div v-show="!isMobile">
      <header class="header">
        <div class="header-content">
          <h1>打卡記錄</h1>
          <div class="date-selector">
            <div class="date-text">
              <span>{{ selectedYear }}年 {{ selectedMonth }}月</span>
              <div class="arrow-buttons">
                <button class="arrow-btn" @click="changeMonth(-1)">
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <button class="arrow-btn" @click="changeMonth(1)">
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="view-toggle">
          <button 
            class="toggle-btn"
            :class="{ active: !showMonthlyStats }"
            @click="showMonthlyStats = false"
          >
            日常記錄
          </button>
          <button 
            class="toggle-btn"
            :class="{ active: showMonthlyStats }"
            @click="showMonthlyStats = true"
          >
            月度統計
          </button>
        </div>
      </header>

      <div class="table-container">
        <!-- 日常記錄表格 -->
        <table class="attendance-table" v-if="!showMonthlyStats">
          <thead>
            <tr>
              <th>日期</th>
              <th>上班時間</th>
              <th>下班時間</th>
              <th>工作時數</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ formatTime(record.checkInTime) }}</td>
              <td>{{ formatTime(record.checkOutTime) }}</td>
              <td>{{ formatWorkHours(record.workHours) }}</td>
              <td>
                <span :class="['status', record.status]">{{ getStatusText(record.status) }}</span>
              </td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="5" class="no-data">暫無記錄</td>
            </tr>
          </tbody>
        </table>

        <!-- 月度統計表格 -->
        <table class="attendance-table" v-else>
          <thead>
            <tr>
              <th>總工時</th>
              <th>出勤天數</th>
              <th>遲到次數</th>
              <th>早退次數</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="monthlyStats && monthlyStats.length > 0">
              <td>{{ monthlyStats[0].totalWorkHours.toFixed(1) }}小時</td>
              <td>{{ monthlyStats[0].totalDays }}天</td>
              <td :class="{ 'text-warning': monthlyStats[0].lateCount > 0 }">{{ monthlyStats[0].lateCount }}次</td>
              <td :class="{ 'text-warning': monthlyStats[0].earlyCount > 0 }">{{ monthlyStats[0].earlyCount }}次</td>
            </tr>
            <tr v-else>
              <td colspan="4" class="no-data">暫無記錄</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 移動端視圖 -->
    <div v-show="isMobile">
      <div class="mobile-view">
        <!-- 移動端年月選擇 -->
        <div class="mobile-date-selector">
          <el-popover
            placement="bottom"
            :width="280"
            trigger="click"
            v-model:visible="isPickerVisible"
          >
            <template #reference>
              <div class="date-text">
                <span class="year-text" @click="handleYearClick">{{ selectedYear }}年</span>
                <span class="month-text" @click="handleMonthClick">{{ selectedMonth }}月</span>
              </div>
            </template>
            <div v-if="showYearPicker" class="year-picker">
              <div
                v-for="year in yearList"
                :key="year"
                class="year-item"
                :class="{ active: year === selectedYear }"
                @click="selectYear(year)"
              >
                {{ year }}
              </div>
            </div>
            <div v-if="showMonthPicker" class="month-picker">
              <div
                v-for="month in 12"
                :key="month"
                class="month-item"
                :class="{ active: month === selectedMonth }"
                @click="selectMonth(month)"
              >
                {{ month }}
              </div>
            </div>
          </el-popover>
        </div>

        <!-- 移動端視圖切換 -->
        <div class="view-toggle">
          <button 
            class="toggle-btn"
            :class="{ active: !showMonthlyStats }"
            @click="showMonthlyStats = false"
          >
            日常記錄
          </button>
          <button 
            class="toggle-btn"
            :class="{ active: showMonthlyStats }"
            @click="showMonthlyStats = true"
          >
            月度統計
          </button>
        </div>

        <!-- 移動端卡片視圖 -->
        <div class="mobile-card-view">
          <!-- 日常記錄卡片 -->
          <template v-if="!showMonthlyStats">
            <div class="record-card" v-for="record in records" :key="record.id">
              <div class="card-header">
                <span class="date">{{ formatDate(record.date) }}</span>
                <span :class="['status', record.status]">{{ getStatusText(record.status) }}</span>
              </div>
              <div class="card-body">
                <div class="info-item">
                  <span class="label">上班時間</span>
                  <span class="value">{{ formatTime(record.checkInTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">下班時間</span>
                  <span class="value">{{ formatTime(record.checkOutTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">工作時數</span>
                  <span class="value">{{ formatWorkHours(record.workHours) }}</span>
                </div>
              </div>
            </div>
            <div v-if="records.length === 0" class="no-data-card">
              暫無記錄
            </div>
          </template>

          <!-- 月度統計卡片 -->
          <template v-else>
            <div class="stats-card" v-if="monthlyStats && monthlyStats.length > 0">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">總工時</span>
                  <span class="stat-value">{{ monthlyStats[0].totalWorkHours.toFixed(1) }}小時</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">出勤天數</span>
                  <span class="stat-value">{{ monthlyStats[0].totalDays }}天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">遲到次數</span>
                  <span class="stat-value" :class="{ 'text-warning': monthlyStats[0].lateCount > 0 }">
                    {{ monthlyStats[0].lateCount }}次
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">早退次數</span>
                  <span class="stat-value" :class="{ 'text-warning': monthlyStats[0].earlyCount > 0 }">
                    {{ monthlyStats[0].earlyCount }}次
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="no-data-card">
              暫無記錄
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { attendanceApi } from '../services/api'
import { useToast } from '../composables/useToast'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

interface BackendAttendanceRecord {
  id: number
  userId: number
  checkInTime: string | null
  checkOutTime: string | null
  status: string
  date: string
  workHours: number | null
}

interface AttendanceRecord extends BackendAttendanceRecord {
  status: 'in' | 'out' | 'late' | 'early' | 'normal'
}

interface MonthlyStats {
  totalWorkHours: number
  totalDays: number
  lateCount: number
  earlyCount: number
}

const toast = useToast()
const records = ref<AttendanceRecord[]>([])
const loading = ref(false)
const showMonthlyStats = ref(false)
const monthlyStats = ref<MonthlyStats[]>([])

// 年月選擇相關
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// 添加移動端相關的狀態
const isMobile = ref(false)
const showYearPicker = ref(false)
const showMonthPicker = ref(false)
const isPickerVisible = computed({
  get: () => showYearPicker.value || showMonthPicker.value,
  set: (val) => {
    if (!val) {
      showYearPicker.value = false
      showMonthPicker.value = false
    }
  }
})

// 年份列表
const currentYear = new Date().getFullYear()
const yearList = computed(() => {
  const years = []
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i)
  }
  return years
})

// 選擇年份
const selectYear = (year: number) => {
  selectedYear.value = year
  showYearPicker.value = false
}

// 選擇月份
const selectMonth = (month: number) => {
  selectedMonth.value = month
  showMonthPicker.value = false
}

// 處理點擊年份和月份的事件
const handleYearClick = (event: Event) => {
  event.stopPropagation()
  showMonthPicker.value = false
  showYearPicker.value = true
}

const handleMonthClick = (event: Event) => {
  event.stopPropagation()
  showYearPicker.value = false
  showMonthPicker.value = true
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 監聽窗口大小變化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 切換月份
const changeMonth = (delta: number) => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1)
  date.setMonth(date.getMonth() + delta)
  selectedYear.value = date.getFullYear()
  selectedMonth.value = date.getMonth() + 1
}

// 修改獲取記錄的函數
const fetchRecords = async () => {
  loading.value = true
  try {
    const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`

    if (showMonthlyStats.value) {
      const { data } = await attendanceApi.getMonthlyStats(startDate, endDate)
      monthlyStats.value = data
    } else {
      const { data } = await attendanceApi.getRecords(startDate, endDate)
      records.value = data
    }
  } catch (error) {
    toast.error('獲取記錄失敗')
  } finally {
    loading.value = false
  }
}

// 格式化時間
const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '-'
  return timeStr
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${year}/${month}/${day}`
}

// 格式化工作時數
const formatWorkHours = (hours: any) => {
  if (hours === null || hours === undefined) return '-'
  const numHours = Number(hours)
  return isNaN(numHours) ? '-' : numHours.toFixed(1)
}

// 獲取狀態文字
const getStatusText = (status: string) => {
  // 所有非下班狀態都顯示為出勤
  return status === 'out' ? '下班' : '出勤'
}

// 監聽年月變化
watch([selectedYear, selectedMonth], () => {
  fetchRecords()
})

// 監聽視圖切換
watch(showMonthlyStats, () => {
  fetchRecords()
})

// 組件掛載時獲取記錄
onMounted(() => {
  fetchRecords()
})
</script>

<style lang="scss" scoped>
.attendance-record {
  padding: var(--spacing-lg);
}

.header {
  margin-bottom: var(--spacing-lg);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    
    h1 {
      font-size: 1.5rem;
      margin: 0;
    }
  }

  .view-toggle {
    display: flex;
    background: #f0f0f0;
    padding: 2px;
    border-radius: 20px;
    width: fit-content;
    margin: 0 auto;
  }
}

.date-selector {
  display: flex;
  align-items: center;
  
  .date-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 500;
    white-space: nowrap;

    .arrow-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .arrow-btn {
        padding: 4px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--color-text);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          color: var(--color-primary);
        }
      }
    }
  }
}

.table-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  th {
    background: #f5f5f7;
    font-weight: 500;
  }
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &.in {
    background: #E3F9E5;
    color: #276749;
  }
  
  &.out {
    background: #E2E8F0;
    color: #2D3748;
  }

  &.late {
    background: #FED7D7;
    color: #9B2C2C;
  }

  &.early {
    background: #FEEBC8;
    color: #9C4221;
  }

  &.normal {
    background: #E3F9E5;
    color: #276749;
  }
}

.no-data {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.left-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.view-toggle {
  display: flex;
  background: #f0f0f0;
  padding: 2px;
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
  
  .toggle-btn {
    min-width: 80px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: var(--color-text);
    
    &.active {
      background: white;
      color: var(--color-primary);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

.text-warning {
  color: #ff9500;
}

// 移動端樣式
.mobile-view {
  padding: var(--spacing-md);
  
  h1 {
    font-size: 1.5rem;
    margin: 0 0 var(--spacing-md);
    text-align: center;
  }
  
  .mobile-date-selector {
    margin-bottom: var(--spacing-md);
    
    .date-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      font-size: 1.75rem;
      font-weight: 500;
      
      .year-text, .month-text {
        cursor: pointer;
        transition: color 0.2s;
        position: relative;
        color: var(--color-text);
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}

.year-picker, .month-picker {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 0;
  max-height: 264px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #ddd;
  }
  
  &::-webkit-scrollbar-track {
    border-radius: 3px;
    background: #f5f5f5;
  }
  
  .year-item, .month-item {
    text-align: center;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 16px;
    color: #606266;
    border: none;
    height: 40px;
    line-height: 40px;
    margin: 0;
    
    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    
    &.active {
      color: var(--el-color-primary);
      font-weight: bold;
      background: transparent;
    }
  }
}

.el-popover {
  padding: 0 !important;
  border: none !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
  min-width: 80px !important;
}

.view-toggle {
  margin-bottom: var(--spacing-lg);
  
  .toggle-btn {
    min-width: 100px;
    padding: 8px 16px;
    font-size: 1rem;
    font-weight: 500;
    
    &.active {
      background: white;
      color: var(--color-primary);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

.mobile-card-view {
  .record-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--spacing-md);
    overflow: hidden;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      background: #f5f5f7;
      
      .date {
        font-weight: 500;
      }
    }
    
    .card-body {
      padding: var(--spacing-md);
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        
        &:not(:last-child) {
          border-bottom: 1px solid var(--color-border);
        }
        
        .label {
          color: var(--color-text-secondary);
        }
        
        .value {
          font-weight: 500;
        }
      }
    }
  }
  
  .stats-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-md);
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
      
      .stat-item {
        background: #f5f5f7;
        padding: var(--spacing-md);
        border-radius: var(--radius-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        
        .stat-label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin-bottom: var(--spacing-xs);
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 500;
          
          &.text-warning {
            color: #ff9500;
          }
        }
      }
    }
  }
  
  .no-data-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--color-text-secondary);
  }
}
</style> 