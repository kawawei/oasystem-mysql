image.png<template>
  <div class="attendance-management">
    <!-- 桌面端視圖 -->
    <div v-show="!isMobile">
      <header class="header">
        <div class="header-content">
          <div class="left-section">
            <h1>考勤管理</h1>
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
                  <button class="arrow-btn" @click.stop="changeMonth(-1)">
                    <el-icon><ArrowLeft /></el-icon>
                  </button>
                  <button class="arrow-btn" @click.stop="changeMonth(1)">
                    <el-icon><ArrowRight /></el-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div class="table-container">
        <table class="attendance-table">
          <thead>
            <tr>
              <th>用戶名</th>
              <th>姓名</th>
              <th>日期</th>
              <th>上班時間</th>
              <th>下班時間</th>
              <th>工作時數</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.id">
              <td>{{ record.user?.username }}</td>
              <td>{{ record.user?.name }}</td>
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ formatTime(record.checkInTime) }}</td>
              <td>{{ formatTime(record.checkOutTime) }}</td>
              <td>{{ formatWorkHours(record.workHours) }}</td>
              <td>
                <span :class="['status', record.status]">{{ getStatusText(record.status) }}</span>
              </td>
              <td class="actions">
                <button @click="openEditModal(record)" class="btn-edit">
                  編輯
                </button>
                <button @click="openDeleteModal(record)" class="btn-delete">
                  刪除
                </button>
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="7" class="no-data">暫無記錄</td>
            </tr>
          </tbody>
        </table>
        
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
          <button 
            class="toggle-btn"
            :class="{ active: !showMonthlyStats }"
            @click="toggleView"
          >
            日常記錄
          </button>
          <button 
            class="toggle-btn"
            :class="{ active: showMonthlyStats }"
            @click="toggleView"
          >
            月度統計
          </button>
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
          <div class="attendance-card" v-for="record in filteredRecords" :key="record.id">
            <div class="card-header">
              <h3>{{ record.user?.name || '-' }}</h3>
              <span class="username">{{ record.user?.username || '-' }}</span>
            </div>
            <div class="card-body">
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
                  <span :class="['status-tag', record.status]">{{ getStatusText(record.status) }}</span>
                </span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="openEditModal(record)" class="btn-edit">
                編輯
              </button>
              <button @click="openDeleteModal(record)" class="btn-delete">
                刪除
              </button>
            </div>
          </div>
          <!-- 無數據時顯示 -->
          <div v-if="filteredRecords.length === 0" class="no-data-card">
            暫無記錄
          </div>
        </template>
      </div>
    </div>

    <!-- 編輯彈窗 -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content">
        <h2>編輯打卡記錄</h2>
        <form @submit.prevent="handleEdit">
          <div class="form-group">
            <label>日期</label>
            <input 
              type="date" 
              v-model="editForm.date"
              required
            >
          </div>
          <div class="form-group">
            <label>上班時間</label>
            <input 
              type="time" 
              v-model="editForm.checkInTime"
              required
            >
          </div>
          <div class="form-group">
            <label>下班時間</label>
            <input 
              type="time" 
              v-model="editForm.checkOutTime"
            >
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="btn-cancel">
              取消
            </button>
            <button type="submit" class="btn-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 刪除確認彈窗 -->
    <div v-if="showDeleteModal" class="modal" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <h2>確認刪除</h2>
        <p class="confirm-message" v-if="recordToDelete">
          確定要刪除 {{ recordToDelete.user?.name }} 在 {{ formatDate(recordToDelete.date) }} 的打卡記錄嗎？
        </p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">
            取消
          </button>
          <button @click="confirmDelete" class="btn-delete">
            確認刪除
          </button>
        </div>
      </div>
    </div>

    <!-- 詳情彈窗 -->
    <el-dialog
      v-model="showDetailsModal"
      title="考勤詳情"
      width="80%"
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
          <table>
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
              <tr v-for="record in selectedStats.records" :key="record.date">
                <td>{{ record.date }}</td>
                <td>{{ record.checkInTime || '-' }}</td>
                <td>{{ record.checkOutTime || '-' }}</td>
                <td>{{ record.workHours?.toFixed(1) || '-' }}小時</td>
                <td>
                  <span class="status-tag" :class="record.status">
                    {{ getStatusText(record.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { attendanceApi, userApi } from '../services/api'
import { useToast } from '../composables/useToast'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

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
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
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

// 獲取狀態文字
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    in: '出勤',
    out: '下班'
  }
  return statusMap[status] || '出勤'  // 如果狀態不匹配，預設顯示"出勤"
}

// 打開編輯彈窗
const openEditModal = (record: AttendanceRecord) => {
  // 從時間字符串中提取時間部分
  const getTimeFromDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return ''
    const [_, time] = dateTimeStr.split(' ')
    return time || ''
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
      const response = await userApi.getUsers(query)
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
</script>

<style lang="scss" scoped>
.attendance-management {
  padding: var(--spacing-md);
  
  .header {
    margin-bottom: var(--spacing-lg);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    
    .header-content {
      display: flex;
      flex-direction: column;
      padding: var(--spacing-md);
      gap: var(--spacing-md);
      
      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 72px;
      }

      .left-section {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }
      
      h1 {
        font-size: 24px;
        margin: 0;
        margin-right: 32px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-filters {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        width: 100%;
        
        @media (min-width: 768px) {
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          width: auto;
          gap: var(--spacing-lg);
        }
        
        .user-select {
          width: 100%;
          
          @media (min-width: 768px) {
            width: 240px;
          }
        }

        .date-selector {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          width: 100%;
          
          @media (min-width: 768px) {
            flex-direction: row;
            align-items: center;
            width: auto;
          }
          
          .date-text {
            font-size: 25px;
            color: var(--color-text);
            cursor: pointer;
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: white;
            width: 100%;
            text-align: center;
            
            @media (min-width: 768px) {
              width: auto;
            }
          }

          .mobile-date-picker {
            width: 100%;
            :deep(.el-input__wrapper) {
              background-color: white;
            }
            :deep(.el-input__inner) {
              font-size: 16px;
              text-align: center;
              height: 40px;
            }
          }
        }
      }
    }
  }

  // 移動端篩選器樣式
  .mobile-view {
    margin-top: -16px;
    margin-bottom: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: 0 var(--spacing-md);
    
    .mobile-date-selector {
      position: relative;
      
      .date-text {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-sm) 0;
        gap: var(--spacing-sm);
        
        span {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text);
          cursor: pointer;
          
          &:active {
            opacity: 0.7;
          }
        }
      }
    }
    
    .view-toggle {
      display: flex;
      gap: 1px;
      background: #f0f0f0;
      padding: 2px;
      border-radius: 20px;
      width: 100%;
      
      .toggle-btn {
        flex: 1;
        padding: 8px 16px;
        border: none;
        background: transparent;
        border-radius: 18px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        
        &.active {
          background: white;
          color: var(--color-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
    
    .user-select {
      width: 100%;
      :deep(.el-input__wrapper) {
        background-color: white;
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
        height: 52px;
        padding: 0 16px;
      }
      :deep(.el-input__inner) {
        font-size: 16px;
        height: 50px;
        line-height: 50px;
      }
      :deep(.el-input__suffix) {
        font-size: 18px;
      }
    }
  }

  // 移動端卡片視圖
  .mobile-card-view {
    padding: var(--spacing-md);
    
    .attendance-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-md);
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--color-border);
        
        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .username {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }
      }
      
      .card-body {
        .info-item {
          display: flex;
          margin-bottom: var(--spacing-sm);
          line-height: 1.5;
          
          .label {
            color: var(--color-text-secondary);
            width: 80px;
            flex-shrink: 0;
          }
          
          .value {
            flex: 1;
            
            .status-tag {
              display: inline-block;
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
            }
          }
        }
      }
      
      .card-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
        
        button {
          padding: var(--spacing-sm);
          border-radius: var(--radius-lg);
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          
          &.btn-edit {
            background: var(--color-primary);
            color: white;
          }
          
          &.btn-delete {
            background: var(--color-error);
            color: white;
          }
        }
      }
    }
    
    .no-data-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      text-align: center;
      color: var(--color-text-secondary);
      box-shadow: var(--shadow-sm);
    }
  }

  // 桌面端表格視圖
  .table-container {
    @media (max-width: 767px) {
      display: none;
    }
    
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow-x: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
        white-space: nowrap;
      }
      
      th {
        background: #f5f5f7;
        font-weight: 500;
      }
    }
  }
  
  // 分頁器樣式
  .pagination-container {
    margin-top: var(--spacing-lg);
    display: flex;
    justify-content: center;
    
    @media (max-width: 767px) {
      .el-pagination {
        font-size: 12px;
        
        .el-pagination__sizes {
          display: none;
        }
      }
    }
  }

  // 調整登出按鈕位置
  :deep(.el-page-header__right) {
    margin-right: var(--spacing-md);
  }
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  
  .user-select {
    width: 240px;
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
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  min-width: 140px;
  
  button {
    flex: 1;
    min-width: 60px;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  .btn-edit {
    background: var(--color-primary);
    color: white;
  }
  
  .btn-delete {
    background: #dc2626;
    color: white;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin: 0 0 var(--spacing-lg);
    font-size: 1.25rem;
    font-weight: 500;
  }
}

.form-group {
  margin-bottom: var(--spacing-md);
  
  label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 500;
    color: var(--color-text);
  }
  
  input {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  
  button {
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  .btn-cancel {
    background: var(--color-border);
    color: var(--color-text);
  }
  
  .btn-save {
    background: var(--color-primary);
    color: white;
  }
}

.no-data {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.confirm-message {
  margin: var(--spacing-lg) 0;
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.5;
}

.btn-delete {
  background: #dc2626;
  color: white;
  
  &:hover {
    opacity: 0.8;
  }
}

.view-toggle {
  display: flex;
  gap: 1px;
  background: var(--color-border);
  padding: 2px;
  border-radius: var(--radius-lg);
  
  .toggle-btn {
    padding: 8px 16px;
    border-radius: calc(var(--radius-lg) - 2px);
    font-size: 0.875rem;
    background: transparent;
    color: var(--color-text);
    
    &.active {
      background: white;
      color: var(--color-primary);
    }
  }
}

.monthly-stats {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-top: var(--spacing-lg);
  overflow: hidden;
}

.stats-table {
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

.text-warning {
  color: #ff9500;
}

.btn-view {
  padding: 6px 12px;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 0.875rem;
  
  &:hover {
    opacity: 0.9;
  }
}

.date-selector {
  display: flex;
  align-items: center;
  
  @media (min-width: 768px) {
    margin-left: 24px;
  }
  
  .date-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 500;
    white-space: nowrap;
    
    @media (max-width: 767px) {
      width: 100%;
      justify-content: center;
      font-size: 1rem;
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: white;
    }

    span {
      margin-right: 8px;
    }

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

.year-picker,
.month-picker {
  padding: 8px;
  
  .year-item,
  .month-item {
    padding: 8px;
    cursor: pointer;
    text-align: center;
    border-radius: 4px;
    
    &:hover {
      background: var(--el-color-primary-light-9);
    }
    
    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
    }
  }
}

.month-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.details-content {
  .user-info {
    margin-bottom: var(--spacing-lg);
    
    h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: 1.25rem;
    }
    
    p {
      margin: 0;
      color: var(--color-text-secondary);
    }
  }
  
  .stats-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    
    .stat-item {
      background: #f5f5f7;
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      
      .label {
        display: block;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xs);
      }
      
      .value {
        font-size: 1.5rem;
        font-weight: 500;
      }
    }
  }
  
 .records-table {
    table {
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
    
    .status-tag {
      display: inline-block;
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
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-top: 1px solid var(--color-border);
}

.year-picker,
.month-picker {
  padding: var(--spacing-md);
}

.year-list {
  max-height: 300px;
  overflow-y: auto;
}

.year-item,
.month-item {
  padding: 12px;
  text-align: center;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: all 0.2s;
  font-size: 16px;
  
  &:hover {
    background: var(--el-color-primary-light-9);
  }
  
  &.active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
  }
}

.month-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style> 