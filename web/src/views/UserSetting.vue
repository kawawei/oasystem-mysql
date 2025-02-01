<template>
  <div class="user-setting">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>用戶管理</h1>
        <div class="header-filters">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋用戶名稱"
            class="search-input"
            size="medium"
          />
          <base-button 
            type="primary"
            @click="openAddModal"
          >
            <i class="fas fa-plus"></i>
            新增用戶
          </base-button>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="search-section" v-show="isMobile">
      <base-button 
        type="primary"
        @click="openAddModal"
        class="btn-add"
      >
        <i class="fas fa-plus"></i>
        新增用戶
      </base-button>
      <base-input 
        v-model="searchQuery"
        placeholder="搜尋用戶名稱"
        class="search-input"
        size="medium"
      />
    </div>

    <!-- 移動端卡片視圖 -->
    <div class="mobile-cards" v-show="isMobile">
      <base-card
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ user.name }}</h3>
            <span class="username">{{ user.username }}</span>
          </div>
        </template>
        <template #content>
          <div class="card-content">
            <div class="info-item">
              <span class="label">部門：</span>
              <span class="value">{{ user.department || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色：</span>
              <span class="value">{{ user.role === 'admin' ? '管理員' : '用戶' }}</span>
            </div>
            <div class="info-item">
              <span class="label">創建時間：</span>
              <span class="value">{{ formatDate(user.createdAt) }}</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="card-actions">
            <base-button
              type="primary"
              size="small"
              @click="openEditModal(user)"
            >
              編輯
            </base-button>
            <template v-if="!isCurrentUser(user.id)">
              <base-button
                :type="user.status === 'inactive' ? 'primary' : 'secondary'"
                size="small"
                @click="toggleUserStatus(user)"
              >
                {{ user.status === 'inactive' ? '啟用' : '停用' }}
              </base-button>
              <base-button
                type="danger"
                size="small"
                @click="openRemoveModal(user)"
              >
                移除
              </base-button>
            </template>
          </div>
        </template>
      </base-card>
      <base-card v-if="filteredUsers.length === 0" class="empty-card">
        <template #content>
          <div class="no-data">暫無用戶</div>
        </template>
      </base-card>
    </div>

    <!-- 桌面端表格視圖 -->
    <div class="table-container" v-show="!isMobile">
      <base-table
        :data="filteredUsers"
        :columns="[
          { key: 'username', title: '用戶名' },
          { key: 'name', title: '姓名' },
          { key: 'department', title: '部門' },
          { key: 'role', title: '角色' },
          { key: 'createdAt', title: '創建時間' },
          { key: 'actions', title: '操作' }
        ]"
      >
        <template #department="{ row }">
          {{ row.department || '-' }}
        </template>
        <template #role="{ row }">
          {{ row.role === 'admin' ? '管理員' : '用戶' }}
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <base-button
              type="primary"
              size="small"
              @click="openEditModal(row)"
            >
              編輯
            </base-button>
            <template v-if="!isCurrentUser(row.id)">
              <base-button
                :type="row.status === 'inactive' ? 'primary' : 'secondary'"
                size="small"
                @click="toggleUserStatus(row)"
              >
                {{ row.status === 'inactive' ? '啟用' : '停用' }}
              </base-button>
              <base-button
                type="danger"
                size="small"
                @click="openRemoveModal(row)"
              >
                移除
              </base-button>
            </template>
          </div>
        </template>
        <template #empty>
          <div class="no-data">暫無用戶</div>
        </template>
      </base-table>
    </div>

    <!-- 編輯用戶彈窗 -->
    <base-modal
      v-model="showEditModal"
      :title="editForm.id ? '編輯用戶' : '新增用戶'"
      @confirm="handleSubmit"
    >
      <template #default>
        <div class="form-group">
          <label>用戶名</label>
          <base-input 
            v-model="editForm.username"
            required
            :disabled="!!editForm.id"
          />
        </div>
        <div class="form-group">
          <label>姓名</label>
          <base-input 
            v-model="editForm.name"
            required
          />
        </div>
        <div class="form-group">
          <label>部門</label>
          <base-input 
            v-model="editForm.department"
            placeholder="請輸入部門名稱"
          />
        </div>
        <div class="form-group">
          <label>{{ editForm.id ? '新密碼' : '密碼' }}<span v-if="!editForm.id" class="required">*</span></label>
          <base-input 
            type="password"
            v-model="editForm.password"
            :required="!editForm.id"
            :placeholder="editForm.id ? '不修改請留空' : '請輸入密碼'"
          />
        </div>
        <div class="form-group">
          <label>角色</label>
          <base-select 
            v-model="editForm.role"
            :options="[
              { value: 'user', label: '一般用戶' },
              { value: 'admin', label: '管理員' }
            ]"
          />
        </div>
      </template>
      <template #footer>
        <base-button
          type="secondary"
          @click="showEditModal = false"
        >
          取消
        </base-button>
        <base-button
          type="primary"
          @click="handleSubmit"
        >
          保存
        </base-button>
      </template>
    </base-modal>

    <!-- 移除確認彈窗 -->
    <base-modal
      v-model="showRemoveModal"
      title="確認移除"
      @confirm="confirmRemove"
    >
      <template #default>
        <p class="confirm-message" v-if="userToRemove">
          確定要永久移除用戶 {{ userToRemove.name }} 嗎？此操作無法恢復！
        </p>
      </template>
      <template #footer>
        <base-button
          type="secondary"
          @click="showRemoveModal = false"
        >
          取消
        </base-button>
        <base-button
          type="danger"
          @click="confirmRemove"
        >
          確認移除
        </base-button>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { userApi } from '../services/api'
import { useToast } from '../composables/useToast'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseCard from '@/common/base/Card.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseModal from '@/common/base/Modal.vue'

interface User {
  id: number
  username: string
  name: string
  role: string
  department?: string
  createdAt: string
  status: 'active' | 'inactive'
}

interface EditForm {
  id: number | null
  username: string
  name: string
  password: string
  role: string
  department: string
}

const toast = useToast()
const searchQuery = ref('')
const users = ref<User[]>([])
const showEditModal = ref(false)
const showRemoveModal = ref(false)
const userToRemove = ref<User | null>(null)
const editForm = ref<EditForm>({
  id: null,
  username: '',
  name: '',
  password: '',
  role: 'user',
  department: ''
})

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

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

// 過濾用戶
const filteredUsers = computed(() => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  let filtered = users.value

  // 如果不是管理員，過濾掉管理員用戶
  if (currentUser.role !== 'admin') {
    filtered = filtered.filter(user => user.role !== 'admin')
  }
  
  // 搜索過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.name.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 打開新增用戶彈窗
const openAddModal = () => {
  editForm.value = {
    id: null,
    username: '',
    name: '',
    password: '',
    role: 'user',
    department: ''
  }
  showEditModal.value = true
}

// 打開編輯用戶彈窗
const openEditModal = (user: User) => {
  editForm.value = {
    id: user.id,
    username: user.username,
    name: user.name,
    password: '',
    role: user.role,
    department: user.department || ''
  }
  showEditModal.value = true
}

// 打開移除確認彈窗
const openRemoveModal = (user: User) => {
  userToRemove.value = user
  showRemoveModal.value = true
}

// 處理表單提交
const handleSubmit = async () => {
  try {
    if (editForm.value.id) {
      // 編輯用戶
      const updateData: {
        name: string
        role: string
        department: string
        password?: string
      } = {
        name: editForm.value.name,
        role: editForm.value.role,
        department: editForm.value.department
      }
      
      // 如果有輸入新密碼，則更新密碼
      if (editForm.value.password) {
        updateData.password = editForm.value.password
      }
      
      await userApi.updateUser(editForm.value.id, updateData)
      toast.success('用戶更新成功')
    } else {
      // 創建新用戶
      await userApi.createUser({
        username: editForm.value.username,
        name: editForm.value.name,
        password: editForm.value.password,
        role: editForm.value.role,
        department: editForm.value.department
      })
      toast.success('用戶創建成功')
    }
    showEditModal.value = false
    fetchUsers() // 重新獲取用戶列表
  } catch (error) {
    console.error('Error submitting form:', error)
    toast.error(editForm.value.id ? '更新用戶失敗' : '創建用戶失敗')
  }
}

// 確認移除用戶
const confirmRemove = async () => {
  if (!userToRemove.value) return
  
  try {
    await userApi.removeUser(userToRemove.value.id)
    toast.success('用戶已永久移除')
    showRemoveModal.value = false
    fetchUsers() // 重新獲取用戶列表
  } catch (error) {
    console.error('Error removing user:', error)
    toast.error('移除用戶失敗')
  }
}

// 切換用戶狀態
const toggleUserStatus = async (user: User) => {
  try {
    const newStatus = user.status === 'inactive' ? 'active' : 'inactive'
    await userApi.updateUser(user.id, { status: newStatus })
    // 更新本地用戶狀態，立即反映在 UI 上
    const updatedUser = users.value.find(u => u.id === user.id)
    if (updatedUser) {
      updatedUser.status = newStatus
    }
    toast.success(newStatus === 'active' ? '用戶已啟用' : '用戶已停用')
  } catch (error) {
    console.error('Error toggling user status:', error)
    toast.error('更新用戶狀態失敗')
    // 如果更新失敗，重新獲取用戶列表以確保顯示正確的狀態
    fetchUsers()
  }
}

// 檢查是否為當前用戶
const isCurrentUser = (userId: number) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  return currentUser.id === userId
}

// 在組件掛載時獲取用戶列表
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchUsers()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
@import '@/styles/views/user-setting.scss';
</style> 