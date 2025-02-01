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
                <base-button type="text" class="arrow-btn" @click="changeMonth(-1)">
                  <el-icon><ArrowLeft /></el-icon>
                </base-button>
                <base-button type="text" class="arrow-btn" @click="changeMonth(1)">
                  <el-icon><ArrowRight /></el-icon>
                </base-button>
              </div>
            </div>
          </div>
        </div>
        <div class="view-toggle">
          <base-button 
            :type="!showMonthlyStats ? 'primary' : 'secondary'"
            @click="showMonthlyStats = false"
          >
            日常記錄
          </base-button>
          <base-button 
            :type="showMonthlyStats ? 'primary' : 'secondary'"
            @click="showMonthlyStats = true"
          >
            月度統計
          </base-button>
        </div>
      </header>

      <div class="table-container">
        <!-- 日常記錄表格 -->
        <base-table
          v-if="!showMonthlyStats"
          :columns="[
            { key: 'date', title: '日期' },
            { key: 'checkInTime', title: '上班時間' },
            { key: 'checkOutTime', title: '下班時間' },
            { key: 'workHours', title: '工作時數' },
            { key: 'status', title: '狀態' }
          ]"
          :data="records.map(record => ({
            ...record,
            date: formatDate(record.date),
            checkInTime: formatTime(record.checkInTime),
            checkOutTime: formatTime(record.checkOutTime),
            workHours: formatWorkHours(record.workHours)
          }))"
        >
          <template #status="{ row }">
            <status-badge :status="row.status" />
          </template>
        </base-table>

        <!-- 月度統計表格 -->
        <base-table
          v-else
          :columns="[
            { key: 'totalWorkHours', title: '總工時' },
            { key: 'totalDays', title: '出勤天數' },
            { key: 'lateCount', title: '遲到次數' },
            { key: 'earlyCount', title: '早退次數' }
          ]"
          :data="monthlyStats.map(stat => ({
            ...stat,
            totalWorkHours: `${stat.totalWorkHours.toFixed(1)}小時`,
            totalDays: `${stat.totalDays}天`,
            lateCount: `${stat.lateCount}次`,
            earlyCount: `${stat.earlyCount}次`
          }))"
        >
          <template #lateCount="{ row }">
            <span :class="{ 'text-warning': row.lateCount > 0 }">{{ row.lateCount }}</span>
          </template>
          <template #earlyCount="{ row }">
            <span :class="{ 'text-warning': row.earlyCount > 0 }">{{ row.earlyCount }}</span>
          </template>
        </base-table>
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
          <base-button 
            :type="!showMonthlyStats ? 'primary' : 'secondary'"
            @click="showMonthlyStats = false"
          >
            日常記錄
          </base-button>
          <base-button 
            :type="showMonthlyStats ? 'primary' : 'secondary'"
            @click="showMonthlyStats = true"
          >
            月度統計
          </base-button>
        </div>

        <!-- 移動端卡片視圖 -->
        <div class="mobile-card-view">
          <!-- 日常記錄卡片 -->
          <template v-if="!showMonthlyStats">
            <base-card v-for="record in records" :key="record.id" class="record-card">
              <template #header>
                <div class="card-header-content">
                  <span class="date">{{ formatDate(record.date) }}</span>
                  <status-badge :status="record.status" />
                </div>
              </template>

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
            </base-card>
            <div v-if="records.length === 0" class="no-data-card">
              暫無記錄
            </div>
          </template>

          <!-- 月度統計卡片 -->
          <template v-else>
            <base-card v-if="monthlyStats && monthlyStats.length > 0" class="stats-card">
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
            </base-card>
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
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'

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
@import '@/styles/views/attendance-record.scss';
</style> 