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

// 定義類型
interface Area {
  city: string
  district: string
}

interface Permission {
  type: 'manage_leads' | 'manage_prospects' | 'manage_customers'
  granted: boolean
}

interface BusinessUser {
  id: number
  name: string
  areas: Area[]
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
  areas: [] as Area[],
  permissions: [] as Permission[]
})

// 區域選擇相關
// Area selection related
const cityOptions = [
  { label: '台北市', value: '台北市' },
  { label: '新北市', value: '新北市' },
  // TODO: 從 API 獲取完整城市列表
  // TODO: Get complete city list from API
]

const districtOptions = computed(() => {
  const districts: Record<string, string[]> = {
    '台北市': ['大安區', '信義區', '中山區', '松山區'],
    '新北市': ['板橋區', '中和區', '新莊區', '三重區'],
    // TODO: 從 API 獲取完整區域列表
    // TODO: Get complete district list from API
  }
  return selectedCity.value ? districts[selectedCity.value].map(d => ({ label: d, value: d })) : []
})

const selectedCity = ref('')
const selectedDistrict = ref('')

const handleAddArea = () => {
  if (!selectedCity.value || !selectedDistrict.value) return
  
  // 檢查是否已存在
  // Check if already exists
  const exists = editForm.value.areas.some(
    area => area.city === selectedCity.value && area.district === selectedDistrict.value
  )
  
  if (!exists) {
    editForm.value.areas.push({
      city: selectedCity.value,
      district: selectedDistrict.value
    })
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

const handleSaveEdit = () => {
  if (!currentUser.value) return
  
  // TODO: 調用 API 保存修改
  // TODO: Call API to save changes
  console.log('保存修改:', editForm.value)
  
  // 臨時更新本地數據
  // Temporarily update local data
  const index = businessUsers.value.findIndex(u => u.id === currentUser.value?.id)
  if (index !== -1) {
    businessUsers.value[index] = {
      ...businessUsers.value[index],
      areas: editForm.value.areas,
      permissions: editForm.value.permissions
    }
  }
  
  showEditModal.value = false
  currentUser.value = null
}

const handleCancelEdit = () => {
  showEditModal.value = false
  currentUser.value = null
}

// 生命週期鉤子
onMounted(async () => {
  try {
    loading.value = true
    // TODO: 從 API 獲取業務人員列表
    // const response = await businessApi.getBusinessUsers()
    // businessUsers.value = response.data
    
    // 模擬數據
    businessUsers.value = [
      {
        id: 1,
        name: '張三',
        areas: [
          { city: '台北市', district: '大安區' },
          { city: '台北市', district: '信義區' }
        ],
        permissions: [
          { type: 'manage_leads', granted: true },
          { type: 'manage_prospects', granted: true },
          { type: 'manage_customers', granted: false }
        ]
      },
      {
        id: 2,
        name: '李四',
        areas: [
          { city: '新北市', district: '板橋區' },
          { city: '新北市', district: '中和區' }
        ],
        permissions: [
          { type: 'manage_leads', granted: true },
          { type: 'manage_prospects', granted: false },
          { type: 'manage_customers', granted: false }
        ]
      }
    ]
  } catch (error) {
    useToast().error('獲取業務人員列表失敗')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import './styles/BusinessManagement.scss';
</style> 