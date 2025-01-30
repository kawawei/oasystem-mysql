<template>
  <div class="user-setting">
    <div class="page-header">
      <div class="header-content">
        <div class="header-main">
          <h1>用戶管理</h1>
          <div class="header-actions">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="搜尋用戶名稱"
              class="search-input"
            >
            <button class="btn-add" @click="openAddModal">
              + 新增用戶
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>用戶名</th>
            <th>姓名</th>
            <th>部門</th>
            <th>角色</th>
            <th>創建時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.department || '-' }}</td>
            <td>{{ user.role === 'admin' ? '管理員' : '用戶' }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="actions">
              <button @click="openEditModal(user)" class="btn-edit">
                編輯
              </button>
              <button 
                @click="toggleUserStatus(user)" 
                :class="['btn-status', user.status === 'inactive' ? 'btn-enable' : 'btn-disable']"
              >
                {{ user.status === 'inactive' ? '啟用' : '停用' }}
              </button>
              <button @click="openRemoveModal(user)" class="btn-remove">
                移除
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="no-data">暫無用戶</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 編輯用戶彈窗 -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content">
        <h2>{{ editForm.id ? '編輯用戶' : '新增用戶' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>用戶名</label>
            <input 
              type="text" 
              v-model="editForm.username"
              required
              :disabled="!!editForm.id"
            >
          </div>
          <div class="form-group">
            <label>姓名</label>
            <input 
              type="text" 
              v-model="editForm.name"
              required
            >
          </div>
          <div class="form-group">
            <label>部門</label>
            <input 
              type="text" 
              v-model="editForm.department"
              placeholder="請輸入部門名稱"
            >
          </div>
          <div class="form-group">
            <label>{{ editForm.id ? '新密碼' : '密碼' }}<span v-if="!editForm.id" class="required">*</span></label>
            <input 
              type="password" 
              v-model="editForm.password"
              :required="!editForm.id"
              :placeholder="editForm.id ? '不修改請留空' : '請輸入密碼'"
            >
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="editForm.role">
              <option value="user">一般用戶</option>
              <option value="admin">管理員</option>
            </select>
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

    <!-- 移除確認彈窗 -->
    <div v-if="showRemoveModal" class="modal" @click.self="showRemoveModal = false">
      <div class="modal-content">
        <h2>確認移除</h2>
        <p class="confirm-message" v-if="userToRemove">
          確定要永久移除用戶 {{ userToRemove.name }} 嗎？此操作無法恢復！
        </p>
        <div class="modal-actions">
          <button @click="showRemoveModal = false" class="btn-cancel">
            取消
          </button>
          <button @click="confirmRemove" class="btn-remove">
            確認移除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userApi } from '../services/api'
import { useToast } from '../composables/useToast'

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
  if (!searchQuery.value) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.name.toLowerCase().includes(query)
  )
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

// 在組件掛載時獲取用戶列表
onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.user-setting {
  .page-header {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    box-shadow: var(--shadow-sm);

    .header-content {
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-lg);

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          white-space: nowrap;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
      flex: 1;
      justify-content: flex-end;

      .search-input {
        width: 240px;
        padding: 8px 12px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        font-size: 0.9rem;
        
        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }

      .btn-add {
        padding: 8px 16px;
        background: var(--color-primary);
        color: white;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          background: var(--color-primary-dark);
        }
      }
    }
  }

  .table-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-top: var(--spacing-lg);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: var(--spacing-md);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.875rem;
      color: var(--color-text);
    }
    
    th {
      background: #f5f5f7;
      font-weight: 500;
      color: var(--color-text);
      white-space: nowrap;
    }

    tr:last-child td {
      border-bottom: none;
    }
    
    .actions {
      display: flex;
      gap: var(--spacing-sm);
      min-width: 180px;
      
      button {
        flex: 1;
        min-width: 50px;
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
        
        &.btn-edit {
          background: var(--color-primary);
          color: white;
        }
        
        &.btn-status {
          min-width: 60px;
          text-align: center;
        }
        
        &.btn-disable {
          background: #dc2626;
          color: white;
          
          &:hover {
            opacity: 0.8;
          }
        }
        
        &.btn-enable {
          background: #059669;
          color: white;
          
          &:hover {
            opacity: 0.8;
          }
        }
        
        &.btn-remove {
          background: #991b1b;
          color: white;
        }
      }
    }
  }

  .no-data {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
    background: white;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 400px;
  
  h2 {
    margin-bottom: var(--spacing-lg);
  }
}

.form-group {
  margin-bottom: var(--spacing-md);
  
  label {
    display: block;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-secondary);
  }
  
  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    
    &:disabled {
      background-color: var(--color-background-light);
      cursor: not-allowed;
    }
  }

  select {
    background-color: white;
    cursor: pointer;
    
    &:hover {
      border-color: var(--color-primary);
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  background-color: var(--color-background-light);
  
  &:hover {
    opacity: 0.9;
  }
}

.btn-save {
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  background-color: var(--color-primary);
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
}

.confirm-message {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
}

.required {
  color: var(--color-danger);
  margin-left: 4px;
}
</style> 