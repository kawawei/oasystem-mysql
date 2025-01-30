<template>
  <div class="attendance-record">
    <header class="header">
      <div class="header-content">
        <div class="left-section">
          <h1>打卡記錄</h1>
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
        </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
    
    h1 {
      font-size: 1.5rem;
      margin: 0;
    }
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
  margin-left: var(--spacing-lg);
  
  .toggle-btn {
    padding: 6px 16px;
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
</style> 