<template>
  <div class="basic-settings">
    <div class="page-header">
      <h1>基礎設置</h1>
    </div>
    
    <div class="settings-container">
      <div class="settings-section">
        <h2>系統設置</h2>
        <div class="setting-item">
          <label>系統名稱</label>
          <base-input
            v-model="settings.systemName"
            placeholder="請輸入系統名稱"
          />
        </div>
        <div class="setting-item">
          <label>系統 Logo</label>
          <div class="logo-uploader">
            <div class="logo-preview" v-if="settings.logo || previewImage">
              <img :src="previewImage || settings.logo" alt="Logo預覽" />
              <base-button
                class="remove-logo"
                type="text"
                @click="removeLogo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </base-button>
            </div>
            <div class="upload-area" v-else @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                style="display: none"
                @change="handleFileChange"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>點擊或拖拽上傳 Logo</span>
              <span class="upload-hint">建議尺寸 200x200px，支援 PNG、JPG 格式</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>權限設置</h2>
        <div class="permission-container">
          <div class="permission-header">
            <div class="user-selector">
              <label>選擇用戶</label>
              <base-select
                v-model="selectedUserId"
                placeholder="請選擇用戶"
                :options="users.map(user => ({
                  label: `${user.name} (${user.role === 'admin' ? '管理員' : '一般用戶'})`,
                  value: user.id
                }))"
              />
            </div>
            <div class="user-info" v-if="selectedUser">
              <span class="role-badge" :class="selectedUser.role">
                {{ selectedUser.role === 'admin' ? '管理員' : '一般用戶' }}
              </span>
            </div>
          </div>

          <div class="permission-content" v-if="selectedUser">
            <div class="permission-note">
              <div class="note-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="8"/>
                </svg>
              </div>
              <span>首頁為默認訪問權限，無需額外設置</span>
            </div>

            <div class="permission-groups">
              <div class="permission-group" v-for="group in permissionGroups" :key="group.id">
                <div class="group-header">
                  <h3>{{ group.name }}</h3>
                  <p class="group-description">{{ group.description }}</p>
                </div>
                <div class="permission-cards">
                  <div 
                    v-for="permission in group.permissions" 
                    :key="permission.id"
                    class="permission-card"
                    :class="{ 
                      'active': getPermissionLevel(selectedUser.id, permission.id),
                      'disabled': isPermissionDisabled(selectedUser, permission.id)
                    }"
                  >
                    <div class="permission-info">
                      <div class="permission-title">{{ permission.name }}</div>
                      <div class="permission-description">{{ permission.description }}</div>
                    </div>
                    <div class="toggle-switch">
                      <input 
                        type="checkbox" 
                        :id="'permission-' + selectedUser.id + '-' + permission.id"
                        :checked="getPermissionLevel(selectedUser.id, permission.id)"
                        :disabled="isPermissionDisabled(selectedUser, permission.id)"
                        @change="togglePermission(selectedUser.id, permission.id)"
                      />
                      <label :for="'permission-' + selectedUser.id + '-' + permission.id"></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" v-else>
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>選擇用戶來設置權限</h3>
            <p>請從上方選擇一個用戶來查看和修改其權限設置</p>
          </div>
        </div>
      </div>

      <div class="actions">
        <base-button
          type="primary"
          @click="saveSettings"
        >
          保存設置
        </base-button>
        <base-button
          type="danger"
          @click="resetSettings"
        >
          重置
        </base-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { userApi, settingsApi, permissionApi } from '../services/api'
import { useStore } from '../store'
import { usePermissionStore } from '../store/permission'
import { useToast } from '../composables/useToast'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseSelect from '@/common/base/Select.vue'

interface User {
  id: number
  name: string
  role: string
}

const permissionGroups = [
  {
    id: 'attendance',
    name: '考勤功能',
    description: '考勤記錄和管理相關功能',
    permissions: [
      { id: 'attendance_record', name: '考勤記錄', description: '查看個人考勤記錄' },
      { id: 'attendance_management', name: '考勤管理', description: '管理所有人的考勤記錄' }
    ]
  },
  {
    id: 'task',
    name: '任務功能',
    description: '任務相關功能',
    permissions: [
      { id: 'tasks', name: '任務列表', description: '查看個人任務' },
      { id: 'task_management', name: '任務管理', description: '管理所有人的任務' }
    ]
  },
  {
    id: 'post',
    name: '貼文功能',
    description: '貼文相關功能',
    permissions: [
      { id: 'posts', name: '貼文列表', description: '查看貼文列表' },
      { id: 'post_management', name: '貼文管理', description: '管理系統貼文' }
    ]
  },
  {
    id: 'admin',
    name: '管理功能',
    description: '系統管理功能',
    permissions: [
      { id: 'user_setting', name: '用戶管理', description: '管理系統用戶' },
      { id: 'basic_settings', name: '基礎設置', description: '系統基礎設置' }
    ]
  }
]

const fileInput = ref<HTMLInputElement | null>(null)
const previewImage = ref<string>('')

const settings = ref({
  systemName: '',
  logo: '',
  emailNotification: false
})

const originalSettings = ref<typeof settings.value>({
  systemName: '',
  logo: '',
  emailNotification: false
})

const users = ref<User[]>([])
const selectedUserId = ref<string | number>('')
const permissions = ref<Record<number, Record<string, boolean>>>({})

const selectedUser = computed(() => {
  const id = typeof selectedUserId.value === 'string' 
    ? parseInt(selectedUserId.value) 
    : selectedUserId.value
  return users.value.find(user => user.id === id)
})

const store = useStore()
const permissionStore = usePermissionStore()
const toast = useToast()

// 監聽選擇的用戶變化
watch(selectedUserId, async (newUserId) => {
  if (newUserId) {
    try {
      const id = typeof newUserId === 'string' ? parseInt(newUserId) : newUserId
      const response = await permissionApi.getUserPermissions(id)
      permissions.value[id] = response.data
    } catch (error) {
      toast.error('獲取用戶權限失敗')
    }
  }
})

const getPermissionLevel = (userId: number, permissionId: string): boolean => {
  const user = users.value.find(u => u.id === userId)
  
  if (!user) return false

  // 檢查是否為管理員核心權限
  const adminCorePermissions = [
    'attendance_management',
    'task_management',
    'user_setting',
    'basic_settings'
  ]
  if (user.role === 'admin' && adminCorePermissions.includes(permissionId)) {
    return true
  }
  
  // 檢查是否為普通用戶的默認權限
  if (user.role === 'user') {
    const defaultPermissions = ['tasks', 'attendance_record']
    if (defaultPermissions.includes(permissionId)) {
      return true
    }
  }
  
  // 從數據庫中獲取權限
  return permissions.value[userId]?.[permissionId] || false
}

const isPermissionDisabled = (user: User | undefined, permissionId: string): boolean => {
  if (!user) return true
  
  if (user.role === 'admin') {
    // 管理員只有核心權限不能修改
    const adminLockedPermissions = [
      'attendance_management',
      'task_management',
      'user_setting',
      'basic_settings'
    ]
    return adminLockedPermissions.includes(permissionId)
  }
  
  if (user.role === 'user') {
    // 普通用戶的默認權限不能修改
    const defaultPermissions = ['tasks', 'attendance_record']
    return defaultPermissions.includes(permissionId)
  }
  
  return false
}

const togglePermission = async (userId: number, permissionId: string) => {
  const user = users.value.find(u => u.id === userId)
  
  if (isPermissionDisabled(user, permissionId)) {
    return
  }

  if (!permissions.value[userId]) {
    permissions.value[userId] = {}
  }
  
  permissions.value[userId][permissionId] = !permissions.value[userId][permissionId]
  
  try {
    await permissionApi.updateUserPermissions(userId, permissions.value[userId])
    
    // 如果當前登入用戶是被修改權限的用戶，重新加載權限
    const currentUser = store.user
    if (currentUser && currentUser.id === userId) {
      await permissionStore.loadPermissions(currentUser.id)
      // 觸發權限更新事件，通知側邊欄更新
      window.dispatchEvent(new CustomEvent('permissions-updated'))
    }
    
    toast.success('權限更新成功')
  } catch (error: any) {
    permissions.value[userId][permissionId] = !permissions.value[userId][permissionId]
    toast.error('權限更新失敗')
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    handleFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error('請上傳圖片文件')
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    toast.error('圖片大小不能超過 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeLogo = () => {
  settings.value.logo = ''
  previewImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onMounted(async () => {
  try {
    // 獲取用戶列表
    const userResponse = await userApi.getUsers()
    users.value = userResponse.data

    // 獲取當前設置
    const settingsResponse = await settingsApi.getSettings()
    const currentSettings = settingsResponse.data
    settings.value = {
      systemName: currentSettings.systemName || '',
      logo: currentSettings.logo || '',
      emailNotification: currentSettings.emailNotification || false
    }
    // 保存原始設置用於重置
    originalSettings.value = { ...settings.value }
  } catch (error) {
    toast.error('獲取數據失敗')
  }
})

const saveSettings = async () => {
  try {
    const response = await settingsApi.updateSettings(settings.value)
    if (response.data) {
      store.updateSystemName(response.data.data.systemName)
      
      // 如果當前登入用戶是被修改權限的用戶，重新加載權限
      const currentUser = store.user
      if (currentUser && currentUser.id === selectedUserId.value) {
        await permissionStore.loadPermissions(currentUser.id)
        // 觸發權限更新事件，通知側邊欄更新
        window.dispatchEvent(new CustomEvent('permissions-updated'))
      }
      
      toast.success('設置保存成功')
    }
  } catch (error) {
    toast.error('設置保存失敗')
  }
}

const resetSettings = () => {
  settings.value = { ...originalSettings.value }
  toast.success('設置已重置')
}
</script>

<style lang="scss" scoped>
@import '@/styles/views/basic-settings.scss';
</style> 