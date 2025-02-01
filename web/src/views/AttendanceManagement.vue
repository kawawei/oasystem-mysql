<template>
  <div class="attendance-management">
    <!-- 桌面端視圖 -->
    <div v-show="!isMobile">
      <header class="header">
        <div class="header-content">
          <div class="left-section">
            <h1>考勤管理</h1>
            <div class="view-toggle desktop-view-toggle">
              <base-button 
                :type="!showMonthlyStats ? 'primary' : 'secondary'"
                @click="toggleView"
              >
                日常記錄
              </base-button>
              <base-button 
                :type="showMonthlyStats ? 'primary' : 'secondary'"
                @click="toggleView"
              >
                月度統計
              </base-button>
            </div>
          </div>
          <div class="header-filters">
            <el-autocomplete
              v-model="searchQuery"
              :fetch-suggestions="handleUserSearch"
              :trigger-on-focus="false"
              clearable
              placeholder="搜尋用戶"
              class="user-select"
              @select="handleSelect"
            >
              <template #default="{ item }">
                <div>{{ item.username }} ({{ item.name }})</div>
              </template>
            </el-autocomplete>
            <div class="date-selector">
              <div class="date-text" style="border: none; background: transparent; padding: 0;">
                <span>{{ selectedYear }}年 {{ selectedMonth }}月</span>
                <div class="arrow-buttons">
                  <base-button type="text" class="arrow-btn" @click.stop="changeMonth(-1)">
                    <el-icon><ArrowLeft /></el-icon>
                  </base-button>
                  <base-button type="text" class="arrow-btn" @click.stop="changeMonth(1)">
                    <el-icon><ArrowRight /></el-icon>
                  </base-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div class="table-container">
        <!-- 日常記錄表格 -->
        <base-table
          v-if="!showMonthlyStats"
          :columns="[
            { key: 'username', title: '用戶名' },
            { key: 'name', title: '姓名' },
            { key: 'date', title: '日期' },
            { key: 'checkInTime', title: '上班時間' },
            { key: 'checkOutTime', title: '下班時間' },
            { key: 'workHours', title: '工作時數' },
            { key: 'status', title: '狀態' },
            { key: 'actions', title: '操作' }
          ]"
          :data="filteredRecords.map(record => ({
            ...record,
            username: record.user?.username,
            name: record.user?.name,
            date: formatDate(record.date),
            checkInTime: formatTime(record.checkInTime),
            checkOutTime: formatTime(record.checkOutTime),
            workHours: formatWorkHours(record.workHours)
          }))"
        >
          <template #status="{ row }">
            <status-badge :status="row.status" />
          </template>
          <template #actions="{ row }">
            <div class="actions">
              <base-button type="primary" @click="openEditModal(row)">
                編輯
              </base-button>
              <base-button type="danger" @click="openDeleteModal(row)">
                刪除
              </base-button>
            </div>
          </template>
        </base-table>

        <!-- 月度統計表格 -->
        <base-table
          v-else
          :columns="[
            { key: 'username', title: '用戶名' },
            { key: 'name', title: '姓名' },
            { key: 'department', title: '部門' },
            { key: 'totalWorkHours', title: '總工時' },
            { key: 'totalDays', title: '出勤天數' },
            { key: 'lateCount', title: '遲到次數' },
            { key: 'earlyCount', title: '早退次數' },
            { key: 'actions', title: '操作' }
          ]"
          :data="monthlyStats.map(stat => ({
            ...stat,
            department: stat.department || '-',
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
          <template #actions="{ row }">
            <base-button type="primary" @click="openDetailsModal(row)">
              詳情
            </base-button>
          </template>
        </base-table>
        
        <!-- 分頁器 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
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
              <div class="year-list">
                <div
                  v-for="year in yearList"
                  :key="year"
                  class="year-item"
                  :class="{ active: year === selectedYear }"
                  @click="selectYear(year)"
                >
                  {{ year }}年
                </div>
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
                {{ month }}月
              </div>
            </div>
          </el-popover>
        </div>

        <!-- 移動端視圖切換 -->
        <div class="view-toggle">
          <base-button 
            :type="!showMonthlyStats ? 'primary' : 'secondary'"
            @click="toggleView"
          >
            日常記錄
          </base-button>
          <base-button 
            :type="showMonthlyStats ? 'primary' : 'secondary'"
            @click="toggleView"
          >
            月度統計
          </base-button>
        </div>

        <!-- 移動端搜索 -->
        <el-autocomplete
          v-model="searchQuery"
          :fetch-suggestions="handleUserSearch"
          :trigger-on-focus="false"
          clearable
          placeholder="搜尋用戶"
          class="user-select"
          @select="handleSelect"
        >
          <template #default="{ item }">
            <div>{{ item.username }} ({{ item.name }})</div>
          </template>
        </el-autocomplete>
      </div>

      <!-- 移動端卡片視圖 -->
      <div class="mobile-card-view" v-if="isMobile">
        <template v-if="!showMonthlyStats">
          <!-- 日常記錄卡片 -->
          <base-card v-for="record in filteredRecords" :key="record.id" class="attendance-card">
            <template #header>
              <div class="card-header-content">
                <h3>{{ record.user?.name || '-' }}</h3>
                <span class="username">{{ record.user?.username || '-' }}</span>
              </div>
            </template>

            <div class="info-item">
              <span class="label">日期：</span>
              <span class="value">{{ formatDate(record.date) }}</span>
            </div>
            <div class="info-item">
              <span class="label">上班時間：</span>
              <span class="value">{{ formatTime(record.checkInTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">下班時間：</span>
              <span class="value">{{ formatTime(record.checkOutTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">工作時數：</span>
              <span class="value">{{ formatWorkHours(record.workHours) }}</span>
            </div>
            <div class="info-item">
              <span class="label">狀態：</span>
              <span class="value">
                <status-badge :status="record.status" />
              </span>
            </div>

            <template #footer>
              <div class="card-actions">
                <base-button type="primary" @click="openEditModal(record)">
                  編輯
                </base-button>
                <base-button type="danger" @click="openDeleteModal(record)">
                  刪除
                </base-button>
              </div>
            </template>
          </base-card>
        </template>

        <template v-else>
          <!-- 月度統計卡片 -->
          <base-card v-for="stat in monthlyStats" :key="stat.userId" class="stats-card">
            <template #header>
              <div class="card-header-content">
                <h3>{{ stat.name }}</h3>
                <span class="username">{{ stat.username }}</span>
                <span class="department">{{ stat.department || '-' }}</span>
              </div>
            </template>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">總工時</span>
                <span class="stat-value">{{ stat.totalWorkHours.toFixed(1) }}小時</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">出勤天數</span>
                <span class="stat-value">{{ stat.totalDays }}天</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">遲到次數</span>
                <span class="stat-value" :class="{ 'text-warning': stat.lateCount > 0 }">
                  {{ stat.lateCount }}次
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">早退次數</span>
                <span class="stat-value" :class="{ 'text-warning': stat.earlyCount > 0 }">
                  {{ stat.earlyCount }}次
                </span>
              </div>
            </div>

            <template #footer>
              <div class="card-actions">
                <base-button type="primary" @click="openDetailsModal(stat)">
                  詳情
                </base-button>
              </div>
            </template>
          </base-card>
        </template>

        <!-- 無數據時顯示 -->
        <div v-if="(showMonthlyStats ? monthlyStats : filteredRecords).length === 0" class="no-data-card">
          暫無記錄
        </div>
      </div>
    </div>

    <!-- 編輯彈窗 -->
    <base-modal
      v-model="showEditModal"
      title="編輯打卡記錄"
      @confirm="handleEdit"
    >
      <form @submit.prevent>
        <div class="form-group">
          <label>日期</label>
          <el-date-picker
            v-model="editForm.date"
            type="date"
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </div>
        <div class="form-group">
          <label>上班時間</label>
          <el-time-picker
            v-model="editForm.checkInTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="選擇時間"
            :clearable="false"
            style="width: 100%"
          />
        </div>
        <div class="form-group">
          <label>下班時間</label>
          <el-time-picker
            v-model="editForm.checkOutTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="選擇時間"
            :clearable="false"
            style="width: 100%"
          />
        </div>
      </form>
    </base-modal>

    <!-- 刪除確認彈窗 -->
    <base-modal
      v-model="showDeleteModal"
      title="確認刪除"
      @confirm="confirmDelete"
      :confirm-text="'確認刪除'"
      size="small"
    >
      <p class="confirm-message" v-if="recordToDelete">
        確定要刪除 {{ recordToDelete.user?.name }} 在 {{ formatDate(recordToDelete.date) }} 的打卡記錄嗎？
      </p>
    </base-modal>

    <!-- 詳情彈窗 -->
    <base-modal
      v-model="showDetailsModal"
      title="考勤詳情"
      size="large"
      :show-footer="false"
    >
      <div v-if="selectedStats" class="details-content">
        <div class="user-info">
          <h3>{{ selectedStats.name }} ({{ selectedStats.username }})</h3>
          <p>部門：{{ selectedStats.department || '-' }}</p>
        </div>
        
        <div class="stats-summary">
          <div class="stat-item">
            <span class="label">總工時</span>
            <span class="value">{{ selectedStats.totalWorkHours.toFixed(1) }}小時</span>
          </div>
          <div class="stat-item">
            <span class="label">出勤天數</span>
            <span class="value">{{ selectedStats.totalDays }}天</span>
          </div>
          <div class="stat-item">
            <span class="label">遲到次數</span>
            <span class="value" :class="{ 'text-warning': selectedStats.lateCount > 0 }">
              {{ selectedStats.lateCount }}次
            </span>
          </div>
          <div class="stat-item">
            <span class="label">早退次數</span>
            <span class="value" :class="{ 'text-warning': selectedStats.earlyCount > 0 }">
              {{ selectedStats.earlyCount }}次
            </span>
          </div>
        </div>

        <div class="records-table">
          <base-table
            :columns="[
              { key: 'date', title: '日期' },
              { key: 'checkInTime', title: '上班時間' },
              { key: 'checkOutTime', title: '下班時間' },
              { key: 'workHours', title: '工作時數' },
              { key: 'status', title: '狀態' }
            ]"
            :data="selectedStats.records.map(record => ({
              ...record,
              checkInTime: record.checkInTime || '-',
              checkOutTime: record.checkOutTime || '-',
              workHours: record.workHours ? `${record.workHours.toFixed(1)}小時` : '-'
            }))"
          >
            <template #status="{ row }">
              <status-badge :status="row.status" />
            </template>
          </base-table>
        </div>
      </div>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { attendanceApi, userApi } from '../services/api'
import { useToast } from '../composables/useToast'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import BaseButton from '@/common/base/Button.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseTable from '@/common/base/Table.vue'

interface User {
  id: number
  username: string
  name: string
}

interface AttendanceRecord {
  id: number
  userId: number
  date: string
  checkInTime: string
  checkOutTime: string | null
  status: 'in' | 'out'
  workHours: number | null
  user?: User
}

interface MonthlyStats {
  userId: number
  username: string
  name: string
  department: string
  totalWorkHours: number
  totalDays: number
  lateCount: number
  earlyCount: number
  records: AttendanceRecord[]
}

const toast = useToast()
const dateFilter = ref<string | null>(null)
const searchQuery = ref('')
const selectedUser = ref<number | null>(null)
const userSearchLoading = ref(false)
const records = ref<AttendanceRecord[]>([])
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const showMonthlyStats = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const recordToDelete = ref<AttendanceRecord | null>(null)
const selectedStats = ref<MonthlyStats | null>(null)
const monthlyStats = ref<MonthlyStats[]>([])

// 分頁相關狀態
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const editForm = ref<{
  id: number | null
  date: string
  checkInTime: string
  checkOutTime: string
}>({
  id: null,
  date: '',
  checkInTime: '',
  checkOutTime: ''
})

// 過濾記錄
const filteredRecords = computed(() => {
  let result = records.value

  if (selectedUser.value) {
    result = result.filter(record => record.userId === selectedUser.value)
  }

  if (dateFilter.value) {
    result = result.filter(record => record.date === dateFilter.value)
  }

  total.value = result.length

  // 計算分頁
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return result.slice(startIndex, endIndex)
})

// 獲取所有打卡記錄
const fetchRecords = async () => {
  try {
    // 計算選中月份的起始日期和結束日期
    const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`

    const response = await attendanceApi.getAllRecords(
      startDate,
      endDate,
      selectedUser.value || undefined
    )
    records.value = response.data
    total.value = response.data.length
  } catch (error) {
    console.error('Error fetching records:', error)
    ElMessage.error('獲取考勤記錄失敗')
  }
}

// 格式化時間
const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '-'
  
  // 如果已經是格式化的時間字符串（HH:mm 格式），直接返回
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr
  }
  
  // 否則，解析日期時間字符串並格式化
  const date = new Date(timeStr)
  if (isNaN(date.getTime())) return '-'
  
  // 使用24小時制格式
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${year}/${month}/${day}`
}

// 格式化工作時數
const formatWorkHours = (hours: number | null) => {
  if (hours === null || hours === undefined) return '-'
  return Number(hours).toFixed(1)
}

// 打開編輯彈窗
const openEditModal = (record: AttendanceRecord) => {
  // 從時間字符串中提取時間部分
  const getTimeFromDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return ''
    
    // 如果已經是時間格式，直接返回
    if (dateTimeStr.match(/^\d{2}:\d{2}$/)) {
      return dateTimeStr
    }
    
    // 嘗試解析日期對象
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return ''
    
    // 使用24小時制格式
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  editForm.value = {
    id: record.id,
    date: record.date,
    checkInTime: getTimeFromDateTime(record.checkInTime),
    checkOutTime: getTimeFromDateTime(record.checkOutTime)
  }
  showEditModal.value = true
}

// 處理編輯
const handleEdit = async () => {
  if (!editForm.value.id) return

  try {
    // 組合日期和時間
    const checkInDateTime = editForm.value.checkInTime 
      ? `${editForm.value.date} ${editForm.value.checkInTime}` 
      : ''
    
    const checkOutDateTime = editForm.value.checkOutTime 
      ? `${editForm.value.date} ${editForm.value.checkOutTime}` 
      : ''

    await attendanceApi.updateRecord(
      editForm.value.id,
      {
        date: editForm.value.date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        status: checkOutDateTime ? 'out' : 'in'  // 根據是否有下班時間來設置狀態
      }
    )
    toast.success('更新成功')
    showEditModal.value = false
    fetchRecords()
  } catch (error) {
    toast.error('更新失敗')
  }
}

// 打開刪除確認框
const openDeleteModal = (record: AttendanceRecord) => {
  recordToDelete.value = record
  showDeleteModal.value = true
}

// 確認刪除
const confirmDelete = async () => {
  if (!recordToDelete.value) return
  
  try {
    await attendanceApi.deleteRecord(recordToDelete.value.id)
    toast.success('刪除成功')
    showDeleteModal.value = false
    fetchRecords()
  } catch (error) {
    toast.error('刪除失敗')
  }
}

// 監聽日期和用戶選擇變化
watchEffect(() => {
  fetchRecords()
})

// 組件掛載時獲取記錄
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchRecords()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 用戶搜索和選擇
const handleUserSearch = async (query: string, cb: (data: any[]) => void) => {
  if (query) {
    try {
      userSearchLoading.value = true
      const response = await userApi.getUsers({ search: query })
      cb(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      ElMessage.error('獲取用戶列表失敗')
      cb([])
    } finally {
      userSearchLoading.value = false
    }
  } else {
    cb([])
  }
}

const handleSelect = (item: any) => {
  selectedUser.value = item.id
  searchQuery.value = `${item.username} (${item.name})`
}

// 監聽搜索框清空
watch(searchQuery, (newVal) => {
  if (!newVal) {
    selectedUser.value = null
  }
})

// 監聽年月變化
watch([selectedYear, selectedMonth], () => {
  fetchRecords()
})

// 切換視圖
const toggleView = () => {
  showMonthlyStats.value = !showMonthlyStats.value
}

// 切換月份
const changeMonth = (delta: number) => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1)
  date.setMonth(date.getMonth() + delta)
  selectedYear.value = date.getFullYear()
  selectedMonth.value = date.getMonth() + 1
}

// 處理頁碼改變
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// 處理每頁條數改變
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// 添加移動端檢測
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 年份選擇相關
const showYearPicker = ref(false)
const showMonthPicker = ref(false)
const currentYear = new Date().getFullYear()
const yearList = computed(() => {
  const years = []
  // 增加年份範圍到前後 10 年
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

// 在 script 部分添加
const isPickerVisible = computed({
  get: () => showYearPicker.value || showMonthPicker.value,
  set: (val) => {
    if (!val) {
      showYearPicker.value = false
      showMonthPicker.value = false
    }
  }
})

// 獲取月度統計數據
const fetchMonthlyStats = async () => {
  try {
    const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`

    const response = await attendanceApi.getMonthlyStats(
      startDate,
      endDate,
      selectedUser.value || undefined
    )
    monthlyStats.value = response.data
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    ElMessage.error('獲取月度統計失敗')
  }
}

// 打開詳情彈窗
const openDetailsModal = (stat: MonthlyStats) => {
  selectedStats.value = stat
  showDetailsModal.value = true
}

// 監聽視圖切換
watch(showMonthlyStats, (newVal) => {
  if (newVal) {
    fetchMonthlyStats()
  } else {
    fetchRecords()
  }
})

// 監聽年月變化
watch([selectedYear, selectedMonth], () => {
  if (showMonthlyStats.value) {
    fetchMonthlyStats()
  } else {
    fetchRecords()
  }
})

// 監聽用戶選擇變化
watch(selectedUser, () => {
  if (showMonthlyStats.value) {
    fetchMonthlyStats()
  } else {
    fetchRecords()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/attendance-management.scss';
</style> 