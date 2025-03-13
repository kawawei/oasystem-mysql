import { ref, watch, onMounted, onUnmounted } from 'vue'
import { message } from '@/plugins/message'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { Customer, CallFormType, CallRecord, Area, City, columns, resultOptions } from './useCustomerList'

// 配置 dayjs 插件 Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Taipei')

// 擴展現有的 useCustomerList composable
export function useInterestedCustomerList() {
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

  // 添加一個標誌來防止重複調用
  const isUpdating = ref(false)

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
        loading.value = true
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const queryParams = new URLSearchParams({
          page: pagination.value.current.toString(),
          pageSize: pagination.value.pageSize.toString(),
          search: searchQuery.value || '',
          city: selectedCity.value || '',
          district: selectedDistrict.value || ''
        })

        console.log('Fetching interested customer list with params:', queryParams.toString())

        const response = await fetch(`${baseUrl}/customers/interested?${queryParams.toString()}`, {
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
            throw new Error(errorData.message || '獲取意向客戶列表失敗')
          } else {
            throw new Error('伺服器回應格式錯誤')
          }
        }

        const result = await response.json()
        console.log('Received interested customer data:', result)
        
        // 將後端數據轉換為前端所需格式
        customerData.value = result.data.map((item: any) => ({
          id: item.id,
          customerName: item.tutorialCenter.name,
          phone: item.tutorialCenter.phone,
          contact: item.tutorialCenter.contact,
          email: item.tutorialCenter.email,
          tutorialCenter: item.tutorialCenter.name,
          area: item.tutorialCenter.district || '未設置',
          city: item.tutorialCenter.city || '未設置',
          district: item.tutorialCenter.district || '未設置',
          status: item.status,
          notes: item.tutorialCenter.notes,
          lastContactTime: item.lastContactTime,
          contactHistory: item.contactHistory || []
        }))

        console.log('Transformed customer data:', customerData.value)

        // 更新分頁數據
        pagination.value.total = result.total
      } catch (error) {
        console.error('Error fetching interested customer list:', error)
        message.error(error instanceof Error ? error.message : '獲取意向客戶列表失敗')
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

  // 處理單元格編輯 Handle cell edit
  const handleCellEdit = async (row: Customer, field: string, value: string) => {
    console.log('Handling cell edit:', { row, field, value })
    let isValid = true
    let errorMessage = ''

    // 驗證輸入值 Validate input value
    switch (field) {
      case 'contact':
        // 允許空值
        isValid = true
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

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/customers/${row.id}/tutorial-center`

      const updateData: any = {}
      switch (field) {
        case 'contact':
          updateData.contact = value
          break
        case 'notes':
          updateData.notes = value
          break
      }

      console.log('Sending update request:', { url, updateData })

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

      // 更新本地數據 Update local data
      const index = customerData.value.findIndex(customer => customer.id === row.id)
      if (index !== -1) {
        customerData.value[index] = {
          ...customerData.value[index],
          [field]: value
        }
      }

      // 觸發陌生客戶列表更新事件 Trigger stranger customer list update event
      window.dispatchEvent(new CustomEvent('customer-data-updated'))

      message.success('更新成功')
    } catch (error) {
      console.error('Error updating customer:', error)
      message.error(error instanceof Error ? error.message : '更新失敗')
    }
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

      // 如果更新了最後聯繫時間，重新排序列表
      if (updatedData.lastContactTime) {
        customerData.value = [...customerData.value].sort((a, b) => {
          const timeA = new Date(a.lastContactTime || 0).getTime()
          const timeB = new Date(b.lastContactTime || 0).getTime()
          return timeB - timeA // 降序排序，最新的在前面
        })
      }
    }
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

          // 更新意向客戶列表數據
          const newContactRecord = {
            id: result.data.id,
            callTime: formData.callTime,
            result: formData.result,
            intention: formData.intention,
            notes: formData.notes
          }

          // 更新客戶的通話記錄和其他相關數據
          updateCustomerInList(currentCustomer.value.id, {
            lastContactTime: formData.callTime,
            contactHistory: [newContactRecord, ...(currentCustomer.value.contactHistory || [])],
            status: result.data.status // 從後端返回的最新狀態
          })

          // 更新陌生客戶列表的緩存
          const CACHE_KEY = 'customer_list_cache'
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) {
            const cacheData = JSON.parse(cached)
            const customerIndex = cacheData.data.findIndex((customer: any) => 
              customer.id === currentCustomer.value?.id || 
              (customer.tutorialCenter && customer.tutorialCenter === currentCustomer.value?.tutorialCenter)
            )
            
            if (customerIndex !== -1) {
              // 更新緩存中的完整客戶數據
              const updatedCustomer = {
                ...cacheData.data[customerIndex],
                lastContactTime: formData.callTime,
                contactHistory: [newContactRecord, ...(cacheData.data[customerIndex].contactHistory || [])],
                status: result.data.status
              }
              
              cacheData.data[customerIndex] = updatedCustomer
              localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
            }
          }

          // 觸發陌生客戶列表更新
          window.dispatchEvent(new CustomEvent('customer-data-updated'))

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

  // 修改事件處理函數
  const handleCustomerDataUpdate = () => {
    if (isUpdating.value) return
    
    console.log('Received customer-data-updated event, refreshing interested customer list')
    isUpdating.value = true
    
    // 重置所有值
    pagination.value.current = 1
    searchQuery.value = ''
    selectedCity.value = ''
    selectedDistrict.value = ''
    
    // 重新獲取數據
    fetchCustomerList().finally(() => {
      isUpdating.value = false
    })
  }

  // 監聽數據變化 Watch for data changes
  watch(
    [searchQuery, selectedCity, selectedDistrict, pagination],
    () => {
      if (!isUpdating.value) {
        fetchCustomerList()
      }
    },
    { deep: true }
  )

  // 添加事件監聽器，當陌生客戶列表更新時重新獲取數據
  onMounted(() => {
    window.addEventListener('customer-data-updated', handleCustomerDataUpdate)
  })

  // 移除事件監聽器以避免內存洩漏
  onUnmounted(() => {
    window.removeEventListener('customer-data-updated', handleCustomerDataUpdate)
  })

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
    handleCustomerDataUpdate,
    handleCellEdit
  }
} 