# 創建基本的業務管理頁面結構
<template>
  <div class="business-management">
    <!-- 頁面標題 -->
    <header class="header">
      <div class="header-content">
        <h1>業務管理</h1>
      </div>
    </header>

    <!-- 業務人員列表 -->
    <div class="content-section">
      <base-table
        :data="businessUsers"
        :columns="columns"
        :loading="loading"
      >
        <template #name="{ row }">
          {{ row.name }}
        </template>
        <template #areas="{ row }">
          <div class="area-tags">
            <status-badge
              v-for="area in row.areas"
              :key="area.city + area.district"
              status="normal"
              :text="`${area.city} ${area.district}`"
              class="area-tag"
            />
          </div>
        </template>
        <template #permissions="{ row }">
          <div class="permission-tags">
            <status-badge
              v-for="permission in row.permissions.filter((p: Permission) => p.granted)"
              :key="permission.type"
              :status="getPermissionStatus(permission)"
              :text="getPermissionText(permission)"
              class="permission-tag"
            />
          </div>
        </template>
        <template #actions="{ row }">
          <base-button
            type="primary"
            size="small"
            @click="editUserAreas(row)"
          >
            編輯
          </base-button>
        </template>
      </base-table>
    </div>

    <!-- 編輯對話框 Edit dialog -->
    <base-modal
      v-model="showEditModal"
      title="編輯業務人員區域"
      width="600"
      @confirm="handleSaveEdit"
      @close="handleCancelEdit"
      :show-footer="true"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
    >
      <el-form class="edit-form" label-width="80px">
        <el-form-item label="負責區域">
          <div class="area-selector">
            <div class="select-group">
              <base-select
                v-model="selectedCity"
                :options="cityOptions"
                placeholder="選擇城市"
                class="city-select"
              />
              <base-select
                v-model="selectedDistrict"
                :options="districtOptions"
                placeholder="選擇區域"
                :disabled="!selectedCity"
                class="district-select"
              />
            </div>
            <base-button
              type="primary"
              size="medium"
              :disabled="!selectedCity || !selectedDistrict"
              @click="handleAddArea"
            >
              新增區域
            </base-button>
          </div>
          
          <!-- 已選區域列表 Selected Areas List -->
          <div class="area-list">
            <div 
              v-for="(area, index) in editForm.areas" 
              :key="index"
              class="area-item"
            >
              <span>{{ area.city }} {{ area.district }}</span>
              <i 
                class="fas fa-times" 
                @click="editForm.areas.splice(index, 1)"
              ></i>
            </div>
            <div v-if="editForm.areas.length === 0" class="no-areas">
              尚未選擇任何區域
            </div>
          </div>
        </el-form-item>
      </el-form>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseModal from '@/common/base/Modal.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { useToast } from '@/composables/useToast'
import { userApi, businessAreaApi } from '@/services/api'

// 定義類型
interface BusinessArea {
  city: string
  district: string
}

interface SelectOption {
  label: string
  value: string
}

interface City {
  label: string
  value: string
  districts: SelectOption[]
}

interface Permission {
  type: 'manage_leads' | 'manage_prospects' | 'manage_customers'
  granted: boolean
}

interface ApiUser {
  id: number
  username: string
  name: string
  role: string
  department?: string
  createdAt: string
  status: 'active' | 'inactive'
}

interface BusinessUser {
  id: number
  name: string
  username: string
  areas: BusinessArea[]
  permissions: Permission[]
}

// 表格列定義
interface Column {
  key: string
  title: string
  sortable?: boolean
  slot?: string
  width?: string
}

const columns: Column[] = [
  {
    key: 'name',
    title: '姓名',
    slot: 'name'
  },
  {
    key: 'areas',
    title: '負責區域',
    slot: 'areas'
  },
  {
    key: 'permissions',
    title: '權限',
    slot: 'permissions'
  },
  {
    key: 'actions',
    title: '操作',
    slot: 'actions',
    width: '120px'
  }
]

// 狀態管理
const loading = ref(false)
const businessUsers = ref<BusinessUser[]>([])

// 編輯對話框相關狀態
// Edit dialog related states
const showEditModal = ref(false)
const currentUser = ref<BusinessUser | null>(null)
const editForm = ref({
  areas: [] as BusinessArea[],
  permissions: [] as Permission[]
})

// 區域選擇相關
// Area selection related
const cities = ref<City[]>([])
const cityOptions = computed(() => cities.value.map(city => ({
  label: city.label,
  value: city.value
})))

const districtOptions = computed(() => {
  if (!selectedCity.value || !cities.value.length) return []
  const city = cities.value.find(c => c.value === selectedCity.value)
  return city ? city.districts : []
})

const selectedCity = ref('')
const selectedDistrict = ref('')

// 獲取縣市和區域列表
// Get cities and districts list
const fetchAreas = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/tutorial-centers/areas`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('獲取區域列表失敗')
    }

    const result = await response.json()
    cities.value = result.cities
  } catch (error) {
    console.error('Error fetching areas:', error)
    useToast().error('獲取區域列表失敗')
  }
}

const handleAddArea = () => {
  if (!selectedCity.value || !selectedDistrict.value) return
  
  // 檢查是否已存在
  // Check if already exists
  const exists = editForm.value.areas.some(
    area => area.city === selectedCity.value && area.district === selectedDistrict.value
  )
  
  if (!exists) {
    // 從選項中獲取完整的區域信息
    const city = cities.value.find(c => c.value === selectedCity.value)
    const district = city?.districts.find(d => d.value === selectedDistrict.value)
    
    if (city && district) {
      editForm.value.areas.push({
        city: city.value,
        district: district.value
      })
    }
  }
  
  // 重置選擇
  // Reset selection
  selectedCity.value = ''
  selectedDistrict.value = ''
}

// 權限相關方法
const getPermissionStatus = (permission: Permission): 'stranger' | 'prospect' | 'cooperative' => {
  const statusMap: Record<string, 'stranger' | 'prospect' | 'cooperative'> = {
    manage_leads: 'stranger',
    manage_prospects: 'prospect',
    manage_customers: 'cooperative'
  }
  return statusMap[permission.type]
}

const getPermissionText = (permission: Permission): string => {
  const textMap: Record<string, string> = {
    manage_leads: '陌生客戶',
    manage_prospects: '意向客戶',
    manage_customers: '合作客戶'
  }
  return textMap[permission.type]
}

// 方法
const editUserAreas = (user: BusinessUser) => {
  currentUser.value = user
  editForm.value = {
    areas: [...user.areas],
    permissions: [...user.permissions]
  }
  showEditModal.value = true
}

const handleSaveEdit = async () => {
  if (!currentUser.value) return
  
  try {
    loading.value = true
    // 調用 API 保存修改
    // Call API to save changes
    await businessAreaApi.updateBusinessUserAreas(
      currentUser.value.id,
      editForm.value.areas
    )
    
    // 更新本地數據
    // Update local data
    const index = businessUsers.value.findIndex(u => u.id === currentUser.value?.id)
    if (index !== -1) {
      businessUsers.value[index] = {
        ...businessUsers.value[index],
        areas: editForm.value.areas,
        permissions: editForm.value.permissions
      }
    }
    
    useToast().success('保存成功')
    showEditModal.value = false
    currentUser.value = null
  } catch (error) {
    console.error('Error saving business user areas:', error)
    useToast().error('保存失敗')
  } finally {
    loading.value = false
  }
}

const handleCancelEdit = () => {
  showEditModal.value = false
  currentUser.value = null
}

// 獲取業務部用戶列表
const fetchBusinessUsers = async () => {
  try {
    const response = await userApi.getUsers()
    // 篩選部門為業務部的用戶
    const businessDeptUsers = (response.data as ApiUser[]).filter(
      (user: ApiUser) => user.department === '業務部'
    )
    
    // 轉換為業務用戶格式並獲取每個用戶的區域
    const usersWithAreas = await Promise.all(
      businessDeptUsers.map(async (user: ApiUser) => {
        try {
          // 獲取用戶的負責區域
          const areasResponse = await businessAreaApi.getBusinessUserAreas(user.id)
          const businessUser: BusinessUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            areas: areasResponse.data || [],
            permissions: [
              { type: 'manage_leads', granted: true },
              { type: 'manage_prospects', granted: false },
              { type: 'manage_customers', granted: false }
            ] as Permission[]
          }
          return businessUser
        } catch (error) {
          console.error(`Error fetching areas for user ${user.id}:`, error)
          // 如果獲取區域失敗，使用空數組
          const businessUser: BusinessUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            areas: [],
            permissions: [
              { type: 'manage_leads', granted: true },
              { type: 'manage_prospects', granted: false },
              { type: 'manage_customers', granted: false }
            ] as Permission[]
          }
          return businessUser
        }
      })
    )
    
    businessUsers.value = usersWithAreas
  } catch (error) {
    console.error('Error fetching business users:', error)
    useToast().error('獲取業務人員列表失敗')
  }
}

// 生命週期鉤子
onMounted(async () => {
  try {
    loading.value = true
    // 獲取區域列表
    await fetchAreas()
    // 獲取業務人員列表
    await fetchBusinessUsers()
  } catch (error) {
    useToast().error('初始化數據失敗')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import './styles/BusinessManagement.scss';
</style> 