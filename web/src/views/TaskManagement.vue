<template>
  <div class="task-management">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>任務管理</h1>
        <div class="header-filters">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="搜尋任務名稱"
            class="search-input"
          >
          <button class="btn-add" @click="openAddModal">
            + 新增任務
          </button>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="mobile-header" v-show="isMobile">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="搜尋任務名稱"
        class="search-input"
      >
      <button class="btn-add" @click="openAddModal">
        + 新增任務
      </button>
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
      <table class="data-table">
        <thead>
          <tr>
            <th>任務名稱</th>
            <th>負責人</th>
            <th>開始時間</th>
            <th>結束時間</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td>{{ task.name }}</td>
            <td>{{ task.assignee }}</td>
            <td>{{ formatDate(task.startDate) }}</td>
            <td>{{ formatDate(task.endDate) }}</td>
            <td>
              <span :class="['status', task.status]">
                {{ getStatusText(task.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="openEditModal(task)" class="btn-view">
                查看
              </button>
              <button @click="deleteTask(task)" class="btn-delete">
                刪除
              </button>
            </td>
          </tr>
          <tr v-if="filteredTasks.length === 0">
            <td colspan="6" class="no-data">暫無任務</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-card-view" v-show="isMobile">
      <div v-for="task in filteredTasks" :key="task.id" class="task-card">
        <div class="card-header">
          <h3>{{ task.name }}</h3>
          <span :class="['status', task.status]">
            {{ getStatusText(task.status) }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-item">
            <span class="label">負責人</span>
            <span class="value">{{ task.assignee }}</span>
          </div>
          <div class="info-item">
            <span class="label">開始時間</span>
            <span class="value">{{ formatDate(task.startDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">結束時間</span>
            <span class="value">{{ formatDate(task.endDate) }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button @click="openEditModal(task)" class="btn-view">
            查看詳情
          </button>
          <button @click="deleteTask(task)" class="btn-delete">
            刪除
          </button>
        </div>
      </div>
      <div v-if="filteredTasks.length === 0" class="no-data-card">
        暫無任務
      </div>
    </div>

    <!-- 編輯/新增任務彈窗 -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content">
        <h2>{{ editForm.id ? '編輯任務' : '新增任務' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>任務名稱</label>
            <input 
              type="text" 
              v-model="editForm.name"
              required
            >
          </div>
          <div class="form-group">
            <label>負責人</label>
            <select v-model="editForm.assignee" required>
              <option value="">請選擇負責人</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.username }}){{ user.department ? ` - ${user.department}` : '' }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>開始時間</label>
            <input 
              type="date" 
              v-model="editForm.startDate"
              required
            >
          </div>
          <div class="form-group">
            <label>結束時間</label>
            <input 
              type="date" 
              v-model="editForm.endDate"
              required
            >
          </div>
          <div class="form-group">
            <label>狀態</label>
            <select v-model="editForm.status" required>
              <option value="pending">待處理</option>
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea 
              v-model="editForm.description"
              rows="4"
              placeholder="請輸入任務描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label>工作報告</label>
            <div class="report-content">
              <p v-if="!editForm.report">暫無工作報告</p>
              <p v-else>{{ editForm.report }}</p>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '../composables/useToast'
import { userApi, taskApi, type Task as ApiTask } from '../services/api'

interface Task {
  id: number
  name: string
  assignee: string
  startDate: string
  endDate: string
  status: 'pending' | 'in_progress' | 'completed'
  description: string
  report?: string
}

interface User {
  id: number
  username: string
  name: string
  department?: string
}

interface EditForm {
  id: number | null
  name: string
  assignee: string
  startDate: string
  endDate: string
  status: 'pending' | 'in_progress' | 'completed'
  description: string
  report?: string
}

const toast = useToast()
const tasks = ref<Task[]>([])
const users = ref<User[]>([])
const searchQuery = ref('')
const showEditModal = ref(false)
const isMobile = ref(false)

const editForm = ref<EditForm>({
  id: null,
  name: '',
  assignee: '',
  startDate: '',
  endDate: '',
  status: 'pending',
  description: '',
  report: undefined
})

// 獲取用戶列表
const fetchUsers = async () => {
  try {
    const response = await userApi.getUsers()
    users.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
    toast.error('獲取用戶列表失敗')
  }
}

// 獲取任務列表
const fetchTasks = async () => {
  try {
    const response = await taskApi.getTasks({
      search: searchQuery.value
    })
    tasks.value = response.data.map((task: ApiTask) => ({
      id: task.id,
      name: task.title,
      assignee: task.assignee?.name || '-',
      startDate: new Date().toISOString().split('T')[0], // 暫時使用當前日期
      endDate: task.dueDate?.split('T')[0] || '-',
      status: task.status,
      description: task.description,
      report: task.report
    }))
  } catch (error) {
    console.error('Error fetching tasks:', error)
    toast.error('獲取任務列表失敗')
  }
}

// 過濾任務列表
const filteredTasks = computed(() => {
  if (!searchQuery.value) return tasks.value
  const query = searchQuery.value.toLowerCase()
  return tasks.value.filter(task => 
    task.name.toLowerCase().includes(query) ||
    task.assignee.toLowerCase().includes(query)
  )
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

// 獲取狀態文字
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': '待處理',
    'in_progress': '進行中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

// 打開新增模態框
const openAddModal = () => {
  editForm.value = {
    id: null,
    name: '',
    assignee: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'pending',
    description: '',
    report: undefined
  }
  showEditModal.value = true
}

// 打開編輯模態框
const openEditModal = (task: Task) => {
  editForm.value = { 
    ...task,
    report: task.report || undefined
  }
  showEditModal.value = true
}

// 處理表單提交
const handleSubmit = async () => {
  try {
    const taskData = {
      title: editForm.value.name,
      description: editForm.value.description,
      assignedTo: parseInt(editForm.value.assignee),
      dueDate: editForm.value.endDate,
      status: editForm.value.status,
      report: editForm.value.report
    }

    if (editForm.value.id) {
      // 更新任務
      await taskApi.updateTask(editForm.value.id, taskData)
      toast.success('任務更新成功')
    } else {
      // 創建任務
      await taskApi.createTask(taskData)
      toast.success('任務創建成功')
    }
    showEditModal.value = false
    await fetchTasks()
  } catch (error) {
    console.error('Error submitting task:', error)
    toast.error('操作失敗')
  }
}

// 刪除任務
const deleteTask = async (task: Task) => {
  if (!confirm(`確定要刪除任務「${task.name}」嗎？`)) return
  try {
    await taskApi.deleteTask(task.id)
    toast.success('任務刪除成功')
    await fetchTasks()
  } catch (error) {
    console.error('Error deleting task:', error)
    toast.error('刪除失敗')
  }
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 監聽窗口大小變化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchUsers()
  fetchTasks()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
.task-management {
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
    
    .header-filters {
      display: flex;
      gap: var(--spacing-md);
    }
  }
}

.search-input {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  min-width: 240px;
  background: white;
  height: 32px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
  }
}

.btn-add {
  height: 32px;
  padding: 0 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  
  &:hover {
    background: var(--color-primary-dark);
  }
  
  &:active {
    transform: translateY(1px);
  }
}

.table-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.data-table {
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
  
  .actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &.pending {
    background: #FED7D7;
    color: #9B2C2C;
  }
  
  &.in_progress {
    background: #FEEBC8;
    color: #9C4221;
  }
  
  &.completed {
    background: #E3F9E5;
    color: #276749;
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
  
  .btn-view {
    background: var(--color-primary);
    color: white;
  }
  
  .btn-delete {
    background: #dc2626;
    color: white;
  }
}

.no-data {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

// 移動端樣式
.mobile-header {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  
  .search-input {
    width: 100%;
  }
  
  .btn-add {
    width: 100%;
  }
}

.mobile-card-view {
  padding: var(--spacing-md);
  
  .task-card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--spacing-md);
    overflow: hidden;
    
    .card-header {
      padding: var(--spacing-md);
      background: #f5f5f7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        font-size: 1rem;
      }
    }
    
    .card-body {
      padding: var(--spacing-md);
      
      .info-item {
        display: flex;
        justify-content: space-between;
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
    
    .card-actions {
      padding: var(--spacing-md);
      display: flex;
      gap: var(--spacing-md);
      
      button {
        flex: 1;
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
      
      .btn-view {
        background: var(--color-primary);
        color: white;
      }
      
      .btn-delete {
        background: #dc2626;
        color: white;
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

// 模態框樣式
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  
  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    h2 {
      margin: 0 0 20px;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
    }
  }
}

.form-group {
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 6px;
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
    height: 36px;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }
  
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
    resize: none;
    height: 80px;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 32px;
  }
}

.report-content {
  background: #f5f5f7;
  border-radius: 8px;
  padding: var(--spacing-md);
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
  
  p {
    margin: 0;
    white-space: pre-wrap;
    color: var(--color-text);
    
    &:empty::before {
      content: '暫無工作報告';
      color: var(--color-text-secondary);
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  
  button {
    padding: 8px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-cancel {
    background: #f5f5f7;
    color: var(--color-text);
    
    &:hover {
      background: #e5e5e5;
    }
  }
  
  .btn-save {
    background: var(--color-primary);
    color: white;
    min-width: 80px;
    
    &:hover {
      background: var(--color-primary-dark);
    }
  }
}
</style> 