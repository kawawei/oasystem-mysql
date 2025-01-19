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
        <div class="filters">
          <el-select
            v-model="selectedUser"
            filterable
            remote
            reserve-keyword
            placeholder="搜尋用戶"
            :remote-method="handleUserSearch"
            :loading="userSearchLoading"
            class="user-select"
          >
            <el-option
              v-for="option in userOptions"
              :key="option.id"
              :label="`${option.username} (${option.name})`"
              :value="option.id"
            />
          </el-select>
          <el-date-picker
            v-model="dateFilter"
            type="date"
            placeholder="選擇日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>
    </header>

    <!-- 月度統計視圖 -->
    <template v-if="showMonthlyStats">
      <div class="filters">
        <div class="date-filters">
          <select v-model="selectedYear">
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}年
            </option>
          </select>
          <select v-model="selectedMonth">
            <option v-for="month in 12" :key="month" :value="month">
              {{ month }}月
            </option>
          </select>
        </div>
      </div>

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
            <tr v-for="stat in monthlyStats" :key="stat.userId">
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
const selectedUser = ref<number | null>(null)
const userOptions = ref<User[]>([])
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

  return result
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

// 用戶選擇相關
const handleUserSearch = async (query: string) => {
  if (query) {
    userSearchLoading.value = true
    try {
      const response = await userApi.getUsers(query)
      userOptions.value = response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      ElMessage.error('獲取用戶列表失敗')
    } finally {
      userSearchLoading.value = false
    }
  }
}

// 獲取月度統計
const fetchMonthlyStats = async () => {
  try {
    const { data } = await attendanceApi.getMonthlyStats(selectedYear.value, selectedMonth.value)
    monthlyStats.value = data
  } catch (error) {
    toast.error('獲取月度統計失敗')
  }
}

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
</script>

<style lang="scss" scoped>
.attendance-management {
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
  gap: 16px;
  margin-bottom: 20px;
  
  .user-select {
    width: 240px;
  }
  
  .search-input,
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

.date-filters {
  display: flex;
  gap: var(--spacing-sm);
  
  select {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: white;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
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
</style> 