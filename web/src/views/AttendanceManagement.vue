<template>
  <div class="attendance-management">
    <header class="header">
      <div class="header-content">
        <h1>考勤管理</h1>
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
            <div class="date-text">
              <el-popover
                trigger="click"
                :width="200"
                placement="bottom"
              >
                <template #reference>
                  <span class="year-text">{{ selectedYear }}</span>
                </template>
                <div class="year-picker">
                  <el-scrollbar height="200px">
                    <div
                      v-for="year in yearOptions"
                      :key="year"
                      class="year-item"
                      :class="{ active: year === selectedYear }"
                      @click="selectedYear = year"
                    >
                      {{ year }}年
                    </div>
                  </el-scrollbar>
                </div>
              </el-popover>
              <el-popover
                trigger="click"
                :width="200"
                placement="bottom"
              >
                <template #reference>
                  <span class="month-text">{{ selectedMonth }}月</span>
                </template>
                <div class="month-picker">
                  <div
                    v-for="month in 12"
                    :key="month"
                    class="month-item"
                    :class="{ active: month === selectedMonth }"
                    @click="selectedMonth = month"
                  >
                    {{ month }}月
                  </div>
                </div>
              </el-popover>
              <div class="arrow-buttons">
                <el-button class="arrow-btn" @click="changeMonth(-1)">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button class="arrow-btn" @click="changeMonth(1)">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 月度統計視圖 -->
    <template v-if="showMonthlyStats">
      <div class="monthly-stats">
        <table class="stats-table">
          <thead>
            <tr>
              <th>用戶名</th>
              <th>姓名</th>
              <th>部門</th>
              <th>總工時</th>
              <th>出勤天數</th>
              <th>遲到次數</th>
              <th>早退次數</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in filteredMonthlyStats" :key="stat.userId">
              <td>{{ stat.username }}</td>
              <td>{{ stat.name }}</td>
              <td>{{ stat.department || '-' }}</td>
              <td>{{ stat.totalWorkHours.toFixed(1) }}小時</td>
              <td>{{ stat.totalDays }}天</td>
              <td>
                <span :class="{ 'text-warning': stat.lateCount > 0 }">
                  {{ stat.lateCount }}次
                </span>
              </td>
              <td>
                <span :class="{ 'text-warning': stat.earlyCount > 0 }">
                  {{ stat.earlyCount }}次
                </span>
              </td>
              <td>
                <button class="btn-view" @click="viewDetails(stat)">
                  查看詳情
                </button>
              </td>
            </tr>
            <tr v-if="filteredMonthlyStats.length === 0">
              <td colspan="8" class="no-data">暫無記錄</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 原有的日常記錄視圖 -->
    <template v-else>
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
    </template>

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
import { ref, computed, onMounted, watchEffect, watch } from 'vue'
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
  status: 'in' | 'out' | 'late' | 'early' | 'normal'
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
const monthlyStats = ref<MonthlyStats[]>([])
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

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push(i)
  }
  return years
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
    const response = await attendanceApi.getAllRecords(
      dateFilter.value || undefined,
      dateFilter.value || undefined,
      selectedUser.value || undefined
    )
    records.value = response.data
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
    out: '下班',
    late: '遲到',
    early: '早退',
    normal: '正常'
  }
  return statusMap[status] || status
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
        checkOutTime: checkOutDateTime
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
  fetchRecords()
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

// 獲取月度統計
const fetchMonthlyStats = async () => {
  try {
    const { data } = await attendanceApi.getMonthlyStats(selectedYear.value, selectedMonth.value)
    monthlyStats.value = data
  } catch (error) {
    toast.error('獲取月度統計失敗')
  }
}

// 過濾後的月度統計
const filteredMonthlyStats = computed(() => {
  if (!selectedUser.value) {
    return monthlyStats.value
  }
  return monthlyStats.value.filter(stat => stat.userId === selectedUser.value)
})

// 監聽年月變化
watch([selectedYear, selectedMonth], () => {
  if (showMonthlyStats.value) {
    fetchMonthlyStats()
  }
})

// 切換視圖
const toggleView = () => {
  showMonthlyStats.value = !showMonthlyStats.value
  if (showMonthlyStats.value) {
    fetchMonthlyStats()
  }
}

// 查看詳情
const viewDetails = (stat: MonthlyStats) => {
  selectedStats.value = stat
  showDetailsModal.value = true
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
</script>

<style lang="scss" scoped>
.attendance-management {
  padding: var(--spacing-lg);
  
  .header {
    margin-bottom: var(--spacing-lg);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    
    .header-content {
      display: flex;
      align-items: center;
      padding: 0 24px;
      height: 72px;
      
      h1 {
        font-size: 24px;
        margin: 0;
        margin-right: 32px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .view-toggle {
        display: flex;
        gap: 1px;
        background: var(--el-fill-color-light);
        padding: 2px;
        border-radius: 8px;
        height: 36px;
        
        .toggle-btn {
          padding: 0 20px;
          border-radius: 6px;
          font-size: 14px;
          background: transparent;
          color: var(--el-text-color-regular);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          height: 32px;
          
          &.active {
            background: white;
            color: var(--el-color-primary);
            font-weight: 500;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          }

          &:hover:not(.active) {
            color: var(--el-color-primary);
          }
        }
      }

      .header-filters {
        display: flex;
        align-items: center;
        margin-left: auto;
        gap: 32px;

        .user-select {
          width: 240px;
          
          :deep(.el-input__wrapper) {
            background-color: var(--el-fill-color-blank);
            border: 1px solid var(--el-border-color-light);
            box-shadow: 0 0 0 1px transparent;
            transition: all 0.2s ease-in-out;
            border-radius: 8px;
            height: 40px;
            padding: 0 16px;
            
            &:hover {
              border-color: var(--el-color-primary);
            }
            
            &.is-focus {
              border-color: var(--el-color-primary);
              box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
            }

            .el-input__inner {
              font-size: 14px;
              color: var(--el-text-color-primary);
              height: 40px;
              line-height: 40px;
              
              &::placeholder {
                color: var(--el-text-color-placeholder);
              }
            }
          }

          :deep(.el-input__suffix) {
            color: var(--el-text-color-secondary);
            font-size: 16px;
          }

          :deep(.el-autocomplete-suggestion) {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin-top: 8px;
            padding: 8px 0;

            .el-autocomplete-suggestion__list {
              padding: 0;
            }

            .el-autocomplete-suggestion__item {
              padding: 8px 16px;
              line-height: 1.5;
              font-size: 14px;
              color: var(--el-text-color-primary);

              &:hover, &.highlighted {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
              }

              &.selected {
                background-color: var(--el-color-primary-light-8);
                color: var(--el-color-primary);
                font-weight: 500;
              }
            }
          }
        }

        .header-date-selector {
          display: flex;
          align-items: center;
          
          .date-text {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            
            .year-text, .month-text {
              cursor: pointer;
              padding: 6px 12px;
              border-radius: 6px;
              transition: all 0.2s ease;
              display: inline-flex;
              align-items: center;
              height: 40px;
              
              &:hover {
                color: var(--el-color-primary);
                background: var(--el-color-primary-light-9);
              }
            }

            .arrow-buttons {
              display: flex;
              align-items: center;
              margin-left: 8px;
              background: var(--el-fill-color-light);
              border-radius: 6px;
              padding: 2px;

              .arrow-btn {
                padding: 8px;
                border: none;
                background: transparent;
                cursor: pointer;
                color: var(--el-text-color-regular);
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
                
                &:hover {
                  color: var(--el-color-primary);
                  background: white;
                }

                .el-icon {
                  font-size: 16px;
                }
              }
            }
          }
        }
      }
    }
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
  margin-left: 24px;
  
  .date-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.5rem;
    font-weight: 500;
    white-space: nowrap;
    
    .year-text, .month-text {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      
      &:hover {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }

    .arrow-buttons {
      display: flex;
      align-items: center;
      margin-left: 16px;

      .arrow-btn {
        padding: 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1.2rem;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .arrow-buttons {
    display: flex;
    align-items: center;
    margin-left: 16px;

    .arrow-btn {
      padding: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.2rem;
      
      &:hover {
        color: var(--el-color-primary);
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
      
      &.normal {
        background: #E3F9E5;
        color: #276749;
      }
      
      &.late {
        background: #FED7D7;
        color: #9B2C2C;
      }
      
      &.early {
        background: #FEEBC8;
        color: #9C4221;
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
</style> 