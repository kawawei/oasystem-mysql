<template>
  <div class="task-management">
    <!-- 頂部區域 -->
    <header class="header">
      <div class="header-content">
        <h1>任務管理</h1>
        <div class="header-actions">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋任務名稱"
            class="search-input"
          />
          <base-button type="primary" class="btn-add" @click="openAddModal">
            + 新增任務
          </base-button>
        </div>
      </div>
    </header>

    <!-- 桌面版表格 -->
    <base-table
      v-show="!isMobile"
      :data="filteredTasks"
      :columns="[
        { key: 'name', title: '任務名稱' },
        { key: 'startDate', title: '開始時間' },
        { key: 'endDate', title: '結束時間' },
        { key: 'status', title: '狀態' },
        { key: 'assignee', title: '負責人' },
        { key: 'actions', title: '操作' }
      ]"
    >
      <template #status="{ row }">
        <span :class="['status', row.status]">{{ getStatusText(row.status) }}</span>
      </template>
      <template #assignee="{ row }">
        {{ row.assignee?.name || '未分配' }}
      </template>
      <template #actions="{ row }">
        <div class="action-buttons">
          <base-button type="primary" size="small" @click="openEditModal(row)">查看</base-button>
          <base-button type="danger" size="small" @click="deleteTask(row)">刪除</base-button>
        </div>
      </template>
    </base-table>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-show="isMobile">
      <base-card 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="task-card"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ task.name }}</h3>
            <span :class="['status', task.status]">{{ getStatusText(task.status) }}</span>
          </div>
        </template>
        
        <div class="card-content">
          <div class="info-item">
            <span class="label">負責人：</span>
            <span class="value">{{ task.assignee?.name || '未分配' }}</span>
          </div>
          <div class="info-item">
            <span class="label">開始時間：</span>
            <span class="value">{{ formatDate(task.startDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">結束時間：</span>
            <span class="value">{{ formatDate(task.endDate) }}</span>
          </div>
        </div>

        <template #footer>
          <div class="action-buttons">
            <base-button type="primary" size="small" @click="openEditModal(task)">查看</base-button>
            <base-button type="danger" size="small" @click="deleteTask(task)">刪除</base-button>
          </div>
        </template>
      </base-card>
      
      <base-card v-if="filteredTasks.length === 0" class="empty-card">
        <div class="empty-content">暫無任務</div>
      </base-card>
    </div>

    <!-- 編輯/新增任務彈窗 -->
    <base-modal 
      v-model="showEditModal"
      :title="editForm.id ? '編輯任務' : '新增任務'"
      @confirm="handleSubmit"
    >
      <div class="form-group">
        <label>任務名稱</label>
        <base-input 
          v-model="editForm.name"
          required
        />
      </div>
      <div class="form-group">
        <label>負責人</label>
        <select @change="handleAssigneeChange" :value="editForm.assignee?.id || ''" required>
          <option value="">請選擇負責人</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.username }}){{ user.department ? ` - ${user.department}` : '' }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>開始時間</label>
        <el-date-picker
          v-model="editForm.startDate"
          type="date"
          placeholder="選擇日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </div>
      <div class="form-group">
        <label>結束時間</label>
        <el-date-picker
          v-model="editForm.endDate"
          type="date"
          placeholder="選擇日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
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
        <base-input 
          v-model="editForm.description"
          type="textarea"
          :rows="4"
          placeholder="請輸入任務描述"
        />
      </div>
      <!-- 只在編輯模式顯示工作報告 -->
      <div v-if="editForm.id" class="form-group">
        <label>工作報告</label>
        <div class="report-content">
          <p v-if="!editForm.report">暫無工作報告</p>
          <p v-else>{{ editForm.report }}</p>
        </div>
      </div>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '../composables/useToast'
import { userApi, taskApi, type Task as ApiTask } from '../services/api'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'

interface Task {
  id: number
  name: string
  assignee?: {
    id: number
    name: string
    username: string
    department?: string
  }
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
  assignee?: {
    id: number
    name: string
    username: string
    department?: string
  }
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
  assignee: undefined,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  status: 'pending',
  description: '',
  report: undefined
})

// 獲取用戶列表
const fetchUsers = async () => {
  try {
    const response = await userApi.getUsers({ search: '' })
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
      assignee: task.assignee,
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
    task.assignee?.name.toLowerCase().includes(query) ||
    task.assignee?.username.toLowerCase().includes(query)
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
    assignee: undefined,
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
      assignedTo: editForm.value.assignee?.id,
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

// 處理負責人選擇
const handleAssigneeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedId = parseInt(target.value)
  if (!selectedId) {
    editForm.value.assignee = undefined
    return
  }
  const selectedUser = users.value.find(user => user.id === selectedId)
  if (selectedUser) {
    editForm.value.assignee = {
      id: selectedUser.id,
      name: selectedUser.name,
      username: selectedUser.username,
      department: selectedUser.department
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/views/task-management.scss';
</style> 