<template>
  <div class="attendance-record">
    <header class="header">
      <div class="header-content">
        <h1>打卡記錄</h1>
        <div class="filters">
          <input 
            type="date" 
            v-model="dateFilter"
            class="date-input"
          >
        </div>
      </div>
    </header>

    <div class="table-container">
      <table class="attendance-table">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { attendanceApi } from '../services/api'
import { useToast } from '../composables/useToast'

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

const toast = useToast()
const dateFilter = ref('')
const records = ref<AttendanceRecord[]>([])
const loading = ref(false)

// 獲取打卡記錄
const fetchRecords = async () => {
  loading.value = true
  try {
    const { data } = await attendanceApi.getRecords(
      dateFilter.value,
      dateFilter.value
    )
    records.value = data
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

// 監聽日期變化
watch(dateFilter, () => {
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

.filters {
  display: flex;
  gap: var(--spacing-md);
  
  .date-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
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
</style> 