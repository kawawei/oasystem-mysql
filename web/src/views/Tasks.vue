<template>
  <div class="task-management">
    <!-- 桌面端頂部 -->
    <header class="header" v-if="!isMobile">
      <div class="header-content">
        <h1>我的任務</h1>
        <div class="header-filters">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋任務名稱"
            class="search-input"
          />
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="mobile-header" v-if="isMobile">
      <base-input 
        v-model="searchQuery"
        placeholder="搜尋任務名稱"
        class="search-input"
      />
    </div>

    <!-- 桌面端表格視圖 -->
    <base-table
      v-if="!isMobile"
      :data="filteredTasks"
      :columns="[
        { key: 'name', title: '任務名稱' },
        { key: 'startDate', title: '開始時間' },
        { key: 'endDate', title: '截止時間' },
        { key: 'status', title: '狀態' },
        { key: 'actions', title: '操作' }
      ]"
    >
      <template #status="{ row }">
        <span :class="['status', row.status]">{{ getStatusText(row.status) }}</span>
      </template>
      <template #actions="{ row }">
        <div class="action-buttons">
          <base-button type="primary" size="small" @click="openTaskDetail(row)">查看</base-button>
        </div>
      </template>
    </base-table>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-if="isMobile">
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
            <span class="label">開始時間</span>
            <span class="value">{{ formatDate(task.startDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">截止時間</span>
            <span class="value">{{ formatDate(task.endDate) }}</span>
          </div>
        </div>

        <template #footer>
          <div class="action-buttons">
            <base-button type="primary" size="small" @click="openTaskDetail(task)">查看詳情</base-button>
          </div>
        </template>
      </base-card>
      
      <base-card v-if="filteredTasks.length === 0" class="empty-card">
        <div class="empty-content">暫無任務</div>
      </base-card>
    </div>

    <!-- 任務詳情彈窗 -->
    <base-modal 
      v-model="showDetailModal"
      title="任務詳情"
      @confirm="updateTaskStatus"
    >
      <div class="task-detail">
        <div class="detail-item">
          <label>任務名稱</label>
          <div>{{ currentTask?.name }}</div>
        </div>
        <div class="detail-item">
          <label>開始時間</label>
          <div>{{ formatDate(currentTask?.startDate) }}</div>
        </div>
        <div class="detail-item">
          <label>截止時間</label>
          <div>{{ formatDate(currentTask?.endDate) }}</div>
        </div>
        <div class="detail-item">
          <label>任務描述</label>
          <div class="description">{{ currentTask?.description || '無' }}</div>
        </div>
        <div class="detail-item" v-if="currentTask">
          <label>任務狀態</label>
          <select 
            v-model="currentTask.status" 
            class="status-select"
          >
            <option value="pending">待處理</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="detail-item" v-if="currentTask">
          <label>工作報告</label>
          <base-input 
            v-model="currentTask.report"
            type="textarea"
            :rows="4"
            placeholder="請輸入工作報告..."
          />
        </div>
      </div>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '../composables/useToast'
import { taskApi, type Task as ApiTask } from '../services/api'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseModal from '@/common/base/Modal.vue'
import '@/styles/views/tasks.scss'

interface Task {
  id: number
  name: string
  startDate: string
  endDate: string
  status: 'pending' | 'in_progress' | 'completed'
  description: string
  report: string
}

const toast = useToast()
const tasks = ref<Task[]>([])
const searchQuery = ref('')
const showDetailModal = ref(false)
const isMobile = ref(false)
const currentTask = ref<Task | null>(null)

// 獲取當前用戶的任務列表
const fetchTasks = async () => {
  try {
    const response = await taskApi.getTasks({
      assignedTo: JSON.parse(localStorage.getItem('user') || '{}').id
    })
    tasks.value = response.data.map((task: ApiTask): Task => ({
      id: task.id,
      name: task.title,
      startDate: new Date().toISOString().split('T')[0], // 暫時使用當前日期
      endDate: task.dueDate?.split('T')[0] || '-',
      status: task.status as Task['status'],
      description: task.description || '',
      report: task.report || ''
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
    task.name.toLowerCase().includes(query)
  )
})

// 格式化日期
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr || dateStr === '-') return '-'
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

// 打開任務詳情
const openTaskDetail = (task: Task) => {
  currentTask.value = {
    ...task,
    report: task.report || ''
  }
  showDetailModal.value = true
}

// 更新任務狀態
const updateTaskStatus = async () => {
  if (!currentTask.value) return
  
  try {
    await taskApi.updateTask(currentTask.value.id, {
      status: currentTask.value.status,
      report: currentTask.value.report
    })
    toast.success('任務更新成功')
    showDetailModal.value = false
    await fetchTasks()
  } catch (error) {
    console.error('Error updating task:', error)
    toast.error('更新失敗')
  }
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchTasks()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/tasks.scss';
</style> 