import { ref, watch } from 'vue'
import { message } from '@/plugins/message'
import dayjs from 'dayjs'

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
    callTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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
    loading.value = true
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const queryParams = new URLSearchParams({
        page: pagination.value.current.toString(),
        pageSize: pagination.value.pageSize.toString()
      })

      if (searchQuery.value) {
        queryParams.append('search', searchQuery.value)
      }

      if (selectedCity.value) {
        queryParams.append('city', selectedCity.value)
      }

      if (selectedDistrict.value) {
        queryParams.append('district', selectedDistrict.value)
      }

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
      
      // 將後端數據轉換為前端所需格式
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
    } catch (error) {
      console.error('Error fetching customer list:', error)
      message.error(error instanceof Error ? error.message : '獲取客戶列表失敗')
    } finally {
      loading.value = false
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
      callTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      result: '',
      intention: '',
      notes: '',
    }
    callModalVisible.value = true
  }

  const handleCallRecord = async () => {
    if (!callFormRef.value || !currentCustomer.value) return
    
    await callFormRef.value.validate(async (valid: boolean) => {
      if (valid && currentCustomer.value) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${baseUrl}/customers/${currentCustomer.value.id}/contact-records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(callForm.value)
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

          // 更新本地數據
          const index = customerData.value.findIndex(c => c.id === currentCustomer.value?.id)
          if (index !== -1) {
            // 根據通話結果更新客戶狀態
            const statusMap: { [key: string]: string } = {
              answered: callForm.value.intention || customerData.value[index].status, // 如果已接聽，使用意向作為狀態
              no_answer: 'no_answer',
              busy: 'busy',
              invalid: 'invalid',
              wrong_number: 'invalid' // 號碼有誤也標記為無效
            }
            
            // 更新客戶狀態和最後聯繫時間
            customerData.value[index].status = statusMap[callForm.value.result]
            customerData.value[index].lastContactTime = callForm.value.callTime
            
            // 更新聯繫記錄
            if (!customerData.value[index].contactHistory) {
              customerData.value[index].contactHistory = []
            }
            customerData.value[index].contactHistory.unshift({
              id: result.data.id,
              callTime: callForm.value.callTime,
              result: callForm.value.result,
              intention: callForm.value.intention,
              notes: callForm.value.notes
            })
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

  const handleCellEdit = async (row: Customer, field: string, value: any) => {
    try {
      let isValid = true
      let errorMessage = ''
  
      // 驗證輸入 Validate input
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
      
      // 構建請求 URL 和數據 Build request URL and data
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/customers/${row.id}/tutorial-center`
      
      // 準備更新數據 Prepare update data
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

      // 發送請求 Send request
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

      message.success('更新成功')
      
      // 重新獲取客戶列表以確保數據同步
      await fetchCustomerList()
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
    handleCellEdit
  }
} 