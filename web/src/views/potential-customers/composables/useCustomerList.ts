import { ref, watch } from 'vue'
import { message } from '@/plugins/message'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// 配置 dayjs 插件 Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Taipei')

// 定義接口類型
export interface Customer {
  id: number
  customerName: string
  phone: string
  email: string
  contact: string // 窗口聯繫人
  tutorialCenter: string
  area: string
  status: string
  notes: string
  lastContactTime: string
  contactHistory?: CallRecord[]
}

// 通話結果選項
export const resultOptions = [
  { label: '已接聽', value: 'answered' },
  { label: '未接聽', value: 'no_answer' },
  { label: '忙碌中', value: 'busy' },
  { label: '空號', value: 'invalid' },
  { label: '號碼有誤', value: 'wrong_number' }
]

// 通話表單類型定義
export interface CallFormType {
  callTime: string
  result: string
  intention: string
  notes: string
}

export interface CallRecord {
  id: number
  callTime: string
  result: string
  intention?: string
  notes?: string
}

export interface Area {
  label: string
  value: string
}

export interface City {
  label: string
  value: string
  districts: Area[]
}

// 表格列定義
export const columns = [
  { 
    key: 'status', 
    title: '狀態',
    width: '140px',
    template: 'status'
  },
  { 
    key: 'tutorialCenter', 
    title: '補習班', 
    sortable: true,
    editable: true,
    width: '250px'
  },
  { 
    key: 'area', 
    title: '區域',
    sortable: true,
    editable: true,
    width: '160px'
  },
  { 
    key: 'phone', 
    title: '聯繫電話',
    editable: true,
    width: '140px'
  },
  { 
    key: 'email', 
    title: 'Email',
    editable: true,
    width: '200px'
  },
  { 
    key: 'contact', 
    title: '窗口',
    editable: true,
    width: '120px',
    template: 'contact'
  },
  { 
    key: 'contactHistory', 
    title: '最近聯繫記錄',
    width: '300px',
    template: 'contactHistory'
  },
  { 
    key: 'actions', 
    title: '操作',
    width: '120px',
    fixed: 'right'
  },
  { 
    key: 'notes', 
    title: '備註',
    width: '80px',
    template: 'notes',
    fixed: 'right'
  }
]

// 定義緩存相關的常量
const CACHE_KEY = 'customer_list_cache'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分鐘緩存過期時間

// 緩存數據結構
interface CacheData {
  timestamp: number
  data: any[]
  total: number
  page: number
  pageSize: number
  searchQuery: string
  selectedCity: string
  selectedDistrict: string
}

// 從緩存中獲取數據
const getFromCache = (): CacheData | null => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null
  
  const cacheData = JSON.parse(cached)
  const now = Date.now()
  
  // 檢查緩存是否過期
  if (now - cacheData.timestamp > CACHE_EXPIRY) {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
  
  return cacheData
}

// 保存數據到緩存
const saveToCache = (
  data: any[], 
  total: number,
  paginationValue: { current: number; pageSize: number },
  searchQueryValue: string,
  selectedCityValue: string,
  selectedDistrictValue: string
) => {
  const cacheData: CacheData = {
    timestamp: Date.now(),
    data,
    total,
    page: paginationValue.current,
    pageSize: paginationValue.pageSize,
    searchQuery: searchQueryValue,
    selectedCity: selectedCityValue,
    selectedDistrict: selectedDistrictValue
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
}

export function useCustomerList() {
  // 區域選項
  const cities = ref<City[]>([])
  const selectedCity = ref('')
  const selectedDistrict = ref('')
  const districts = ref<Area[]>([])

  // 頁面狀態
  const loading = ref(false)
  const searchQuery = ref('')
  const customerData = ref<Customer[]>([])
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 通話記錄表單
  const callModalVisible = ref(false)
  const currentCustomer = ref<Customer | null>(null)
  const callFormRef = ref()
  const callForm = ref<CallFormType>({
    callTime: dayjs().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss'),
    result: '',
    intention: '',
    notes: '',
  })

  // 通話記錄歷史
  const historyModalVisible = ref(false)
  const callHistory = ref<CallRecord[]>([])
  const selectedHistoryRecord = ref<number | null>(null)

  // 表單驗證規則
  const callFormRules = {
    callTime: [{ required: true, message: '請選擇通話時間', trigger: 'change' }],
    result: [{ required: true, message: '請選擇通話結果', trigger: 'change' }],
  }

  // 獲取縣市和區域列表
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
      message.error('獲取區域列表失敗')
    }
  }

  // 監聽縣市變化
  watch(selectedCity, (newCity) => {
    selectedDistrict.value = '' // 清空區域選擇
    if (newCity) {
      const city = cities.value.find(c => c.value === newCity)
      districts.value = city?.districts || []
    } else {
      districts.value = []
    }
    handleAreaChange()
  })

  // 監聽區域變化
  watch(selectedDistrict, () => {
    handleAreaChange()
  })

  const fetchCustomerList = async () => {
    if (!loading.value) {
      try {
        // 檢查緩存
        const cached = getFromCache()
        if (cached && 
            cached.page === pagination.value.current &&
            cached.pageSize === pagination.value.pageSize &&
            cached.searchQuery === searchQuery.value &&
            cached.selectedCity === selectedCity.value &&
            cached.selectedDistrict === selectedDistrict.value) {
          customerData.value = cached.data
          pagination.value.total = cached.total
          return
        }

        loading.value = true
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const queryParams = new URLSearchParams({
          page: pagination.value.current.toString(),
          pageSize: pagination.value.pageSize.toString(),
          search: searchQuery.value || '',
          city: selectedCity.value || '',
          district: selectedDistrict.value || ''
        })

        const response = await fetch(`${baseUrl}/customers?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            throw new Error(errorData.message || '獲取客戶列表失敗')
          } else {
            throw new Error('伺服器回應格式錯誤')
          }
        }

        const result = await response.json()
        
        customerData.value = result.data.map((item: any) => ({
          id: item.id,
          customerName: item.tutorialCenter.name,
          phone: item.tutorialCenter.phone,
          email: item.tutorialCenter.email,
          contact: item.tutorialCenter.contact,
          tutorialCenter: item.tutorialCenter.name,
          area: item.tutorialCenter.district || '未設置',
          city: item.tutorialCenter.city || '未設置',
          district: item.tutorialCenter.district || '未設置',
          status: item.status,
          notes: item.tutorialCenter.notes,
          lastContactTime: item.lastContactTime,
          contactHistory: item.contactHistory || []
        }))

        pagination.value.total = result.total
        
        // 保存到緩存
        saveToCache(
          customerData.value, 
          result.total,
          pagination.value,
          searchQuery.value,
          selectedCity.value,
          selectedDistrict.value
        )
      } catch (error) {
        console.error('Error fetching customer list:', error)
        message.error(error instanceof Error ? error.message : '獲取客戶列表失敗')
      } finally {
        loading.value = false
      }
    }
  }

  const handleSearch = () => {
    pagination.value.current = 1 // 重置到第一頁
    fetchCustomerList() // 重新獲取數據
  }

  const handleAreaChange = () => {
    pagination.value.current = 1 // 重置到第一頁
    fetchCustomerList() // 重新獲取數據
  }

  const handleSizeChange = (val: number) => {
    pagination.value.pageSize = val
    fetchCustomerList()
  }

  const handleCurrentChange = (val: number) => {
    pagination.value.current = val
    fetchCustomerList()
  }

  const showCallModal = (record: Customer) => {
    currentCustomer.value = record
    callForm.value = {
      callTime: dayjs().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss'),
      result: '',
      intention: '',
      notes: '',
    }
    callModalVisible.value = true
  }

  // 添加局部更新函數
  const updateCustomerInList = (customerId: number, updatedData: Partial<Customer>) => {
    const index = customerData.value.findIndex(customer => customer.id === customerId)
    if (index !== -1) {
      // 合併更新的數據，保留未更新的字段
      customerData.value[index] = {
        ...customerData.value[index],
        ...updatedData
      }
    }
  }

  // 添加批量局部更新函數
  const batchUpdateCustomers = (updates: Array<{ id: number; data: Partial<Customer> }>) => {
    updates.forEach(({ id, data }) => {
      updateCustomerInList(id, data)
    })
  }

  // 修改 handleCallRecord 函數
  const handleCallRecord = async () => {
    if (!callFormRef.value || !currentCustomer.value) return
    
    await callFormRef.value.validate(async (valid: boolean) => {
      if (valid && currentCustomer.value) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

          // 將時間轉換為 ISO 格式，保留時區信息
          const formData = {
            ...callForm.value,
            callTime: dayjs(callForm.value.callTime).toISOString()
          }

          const response = await fetch(`${baseUrl}/customers/${currentCustomer.value.id}/contact-records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
          })

          if (!response.ok) {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json()
              throw new Error(errorData.message || '保存通話記錄失敗')
            } else {
              throw new Error('伺服器回應格式錯誤')
            }
          }

          const result = await response.json()

          // 根據通話結果和意向更新客戶狀態
          const intentionToStatusMap: Record<string, string> = {
            interested: 'interested',
            considering: 'in_progress',
            not_interested: 'not_interested',
            call_back: 'call_back',
            visited: 'visited'
          }

          let newStatus: string
          if (callForm.value.result === 'answered') {
            newStatus = callForm.value.intention ? 
              intentionToStatusMap[callForm.value.intention] : 
              currentCustomer.value.status
          } else {
            const latestIntentionRecord = currentCustomer.value.contactHistory?.find(record => 
              record.result === 'answered' && 
              record.intention && 
              ['interested', 'considering', 'visited'].includes(record.intention)
            )

            if (latestIntentionRecord?.intention) {
              newStatus = intentionToStatusMap[latestIntentionRecord.intention]
            } else {
              const resultToStatusMap: Record<string, string> = {
                no_answer: 'no_answer',
                busy: 'busy',
                invalid: 'invalid',
                wrong_number: 'invalid'
              }
              newStatus = resultToStatusMap[callForm.value.result] || currentCustomer.value.status
            }
          }

          // 使用局部更新函數更新數據
          const newContactRecord = {
            id: result.data.id,
            callTime: callForm.value.callTime,
            result: callForm.value.result,
            intention: callForm.value.intention,
            notes: callForm.value.notes
          }

          updateCustomerInList(currentCustomer.value.id, {
            status: newStatus,
            lastContactTime: callForm.value.callTime,
            contactHistory: [newContactRecord, ...(currentCustomer.value.contactHistory || [])]
          })

          // 更新緩存
          const cached = getFromCache()
          if (cached) {
            saveToCache(
              customerData.value,
              cached.total,
              pagination.value,
              searchQuery.value,
              selectedCity.value,
              selectedDistrict.value
            )
          }

          message.success('通話記錄已保存')
          callModalVisible.value = false
        } catch (error) {
          console.error('Error saving call record:', error)
          message.error(error instanceof Error ? error.message : '保存通話記錄失敗')
        }
      }
    })
  }

  // 切換歷史記錄詳情顯示
  const toggleHistoryDetails = (recordId: number) => {
    selectedHistoryRecord.value = selectedHistoryRecord.value === recordId ? null : recordId
  }

  const showHistoryModal = async (record: Customer) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${baseUrl}/customers/${record.id}/contact-records`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.message || '獲取通話記錄失敗')
        } else {
          throw new Error('伺服器回應格式錯誤')
        }
      }

      const result = await response.json()
      callHistory.value = result.data
      historyModalVisible.value = true
    } catch (error) {
      console.error('Error fetching call history:', error)
      message.error(error instanceof Error ? error.message : '獲取通話記錄失敗')
    }
  }

  // 監聽數據變化 Watch for data changes
  watch(
    [searchQuery, selectedCity, selectedDistrict, pagination],
    () => {
      fetchCustomerList()
    },
    { deep: true }
  )

  // 修改 handleCellEdit 函數
  const handleCellEdit = async (row: Customer, field: string, value: any) => {
    try {
      let isValid = true
      let errorMessage = ''
  
      // 驗證輸入
      switch (field) {
        case 'phone':
          isValid = /^[0-9]{10}$/.test(value)
          errorMessage = '請輸入正確的電話號碼格式'
          break
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          errorMessage = '請輸入正確的 Email 格式'
          break
        case 'contact':
          isValid = value.trim() !== ''
          errorMessage = '窗口不能為空'
          break
        case 'tutorialCenter':
          isValid = value.trim() !== ''
          errorMessage = '補習班名稱不能為空'
          break
        case 'area':
          isValid = districts.value.some(area => area.value === value)
          errorMessage = '請選擇有效的區域'
          break
        case 'notes':
          isValid = value.length <= 500
          errorMessage = '備註不能超過 500 字'
          break
      }
  
      if (!isValid) {
        message.error(errorMessage)
        return
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/customers/${row.id}/tutorial-center`
      
      const updateData: any = {}
      switch (field) {
        case 'phone':
          updateData.phone = value
          break
        case 'email':
          updateData.email = value
          break
        case 'contact':
          updateData.contact = value
          break
        case 'area':
          updateData.district = value
          break
        case 'notes':
          updateData.notes = value
          break
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.message || '更新失敗')
        } else {
          throw new Error('伺服器回應格式錯誤')
        }
      }

      // 使用局部更新函數更新數據
      updateCustomerInList(row.id, { [field]: value })

      // 更新緩存
      const cached = getFromCache()
      if (cached) {
        saveToCache(
          customerData.value,
          cached.total,
          pagination.value,
          searchQuery.value,
          selectedCity.value,
          selectedDistrict.value
        )
      }

      message.success('更新成功')
    } catch (error) {
      console.error('Error updating customer:', error)
      message.error(error instanceof Error ? error.message : '更新失敗')
    }
  }

  // 在組件掛載時獲取區域列表
  fetchAreas()

  return {
    // 狀態
    loading,
    searchQuery,
    selectedCity,
    selectedDistrict,
    cities,
    districts,
    customerData,
    pagination,
    callModalVisible,
    currentCustomer,
    callFormRef,
    callForm,
    historyModalVisible,
    callHistory,
    callFormRules,
    columns,
    selectedHistoryRecord,
    resultOptions,

    // 方法
    fetchCustomerList,
    handleSearch,
    handleAreaChange,
    handleSizeChange,
    handleCurrentChange,
    showCallModal,
    handleCallRecord,
    toggleHistoryDetails,
    showHistoryModal,
    handleCellEdit,
    updateCustomerInList,
    batchUpdateCustomers
  }
} 