import { ref } from 'vue'
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

// 表格列定義
export const columns = [
  { 
    key: 'status', 
    title: '狀態',
    width: '120px',
    template: 'status'
  },
  { 
    key: 'tutorialCenter', 
    title: '補習班', 
    sortable: true,
    editable: true,
    width: '180px'
  },
  { 
    key: 'area', 
    title: '區域',
    editable: true,
    width: '120px'
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
  const areas = ref<Area[]>([
    { label: '北區', value: 'north' },
    { label: '中區', value: 'central' },
    { label: '南區', value: 'south' },
    { label: '東區', value: 'east' },
  ])

  // 頁面狀態
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedArea = ref('')
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
  const callForm = ref({
    callTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    result: '',
    intention: '',
    notes: '',
  })

  // 通話記錄歷史
  const historyModalVisible = ref(false)
  const callHistory = ref<CallRecord[]>([])

  // 表單驗證規則
  const callFormRules = {
    callTime: [{ required: true, message: '請選擇通話時間', trigger: 'change' }],
    result: [{ required: true, message: '請選擇通話結果', trigger: 'change' }],
  }

  const fetchCustomerList = async () => {
    loading.value = true
    try {
      // TODO: 實際環境中這裡應該是調用後端 API
      // const response = await api.getCustomerList({
      //   page: pagination.value.current,
      //   pageSize: pagination.value.pageSize,
      //   search: searchQuery.value,
      //   area: selectedArea.value
      // })

      // 模擬數據 - 根據搜索條件和區域進行篩選
      const mockData = [
        {
          id: 1,
          customerName: '張小明',
          phone: '0912345678',
          email: 'zhang@example.com',
          contact: '王老師',
          tutorialCenter: '大安補習班',
          area: 'north',
          status: 'new',
          notes: '家長很關心孩子的學習狀況',
          lastContactTime: '2024-02-27 10:00:00',
          contactHistory: [
            {
              id: 1,
              callTime: '2024-02-27 10:00:00',
              result: 'answered',
              intention: 'interested',
              notes: '初次通話，表示有興趣'
            },
            {
              id: 2,
              callTime: '2024-02-26 15:30:00',
              result: 'no_answer',
              notes: '無人接聽'
            },
            {
              id: 3,
              callTime: '2024-02-25 14:20:00',
              result: 'busy',
              notes: '忙線中'
            }
          ]
        },
        {
          id: 2,
          customerName: '李小華',
          phone: '0923456789',
          email: 'li@example.com',
          contact: '陳主任',
          tutorialCenter: '中山補習班',
          area: 'central',
          status: 'in_progress',
          notes: '家長表示需要更多時間考慮',
          lastContactTime: '2024-02-26 15:30:00',
          contactHistory: [
            {
              id: 4,
              callTime: '2024-02-26 15:30:00',
              result: 'no_answer',
              notes: '無人接聽'
            }
          ]
        }
      ]

      // 根據搜索條件篩選
      let filteredData = mockData
      if (searchQuery.value) {
        const searchLower = searchQuery.value.toLowerCase()
        filteredData = mockData.filter(item => 
          item.customerName.toLowerCase().includes(searchLower) ||
          item.phone.includes(searchQuery.value) ||
          item.tutorialCenter.toLowerCase().includes(searchLower) ||
          item.email.toLowerCase().includes(searchLower)
        )
      }

      // 根據區域篩選
      if (selectedArea.value) {
        filteredData = filteredData.filter(item => item.area === selectedArea.value)
      }

      customerData.value = filteredData
      pagination.value.total = filteredData.length
    } catch (error) {
      message.error('獲取客戶列表失敗')
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
      if (valid) {
        try {
          // TODO: 調用API保存通話記錄
          // const response = await api.saveCallRecord({
          //   customerId: currentCustomer.value.id,
          //   ...callForm.value
          // })

          // 更新客戶狀態和記錄
          const index = customerData.value.findIndex(c => c.id === currentCustomer.value?.id)
          if (index !== -1) {
            // 更新狀態：已接聽顯示意願程度，其他顯示通話結果
            if (callForm.value.result === 'answered') {
              const statusMap: Record<string, string> = {
                interested: 'interested',
                considering: 'in_progress',
                not_interested: 'not_interested',
                call_back: 'call_back'
              }
              customerData.value[index].status = statusMap[callForm.value.intention] || 'in_progress'
            } else {
              // 其他通話結果直接映射到狀態
              const resultStatusMap: Record<string, string> = {
                no_answer: 'no_answer',
                busy: 'busy',
                invalid: 'invalid'
              }
              customerData.value[index].status = resultStatusMap[callForm.value.result] || 'new'
            }

            // 創建新的通話記錄
            const newRecord: CallRecord = {
              id: Date.now(), // 臨時使用時間戳作為ID
              callTime: callForm.value.callTime,
              result: callForm.value.result,
              intention: callForm.value.intention,
              notes: callForm.value.notes
            }

            // 更新聯繫記錄
            if (!customerData.value[index].contactHistory) {
              customerData.value[index].contactHistory = []
            }
            customerData.value[index].contactHistory.unshift(newRecord) // 將新記錄添加到開頭
            customerData.value[index].contactHistory = customerData.value[index].contactHistory.slice(0, 3) // 只保留最新的3筆

            // 更新備註為最新的通話記錄備註
            if (callForm.value.notes) {
              customerData.value[index].notes = callForm.value.notes
            }
          }

          message.success('通話記錄保存成功')
          callModalVisible.value = false
        } catch (error) {
          message.error('通話記錄保存失敗')
        }
      }
    })
  }

  const showHistoryModal = async (record: Customer) => {
    try {
      callHistory.value = [
        {
          id: 1,
          callTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          result: 'answered',
          intention: 'interested',
          notes: `客戶名稱：${record.customerName}\n初次通話，對方表示有興趣了解更多`
        },
        {
          id: 2,
          callTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          result: 'no_answer',
          notes: '無人接聽'
        }
      ]
      
      historyModalVisible.value = true
    } catch (error) {
      message.error('獲取通話記錄失敗')
    }
  }

  const handleCellEdit = async (row: Customer, field: string, value: any) => {
    try {
      let isValid = true
      let errorMessage = ''
  
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
          isValid = areas.value.some(area => area.value === value)
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
      
      const index = customerData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        customerData.value[index] = {
          ...customerData.value[index],
          [field]: value
        }
      }
      
      message.success('更新成功')
    } catch (error) {
      message.error('更新失敗')
    }
  }

  return {
    // 狀態
    loading,
    searchQuery,
    selectedArea,
    customerData,
    pagination,
    callModalVisible,
    currentCustomer,
    callFormRef,
    callForm,
    historyModalVisible,
    callHistory,
    callFormRules,
    areas,
    columns,

    // 方法
    fetchCustomerList,
    handleSearch,
    handleAreaChange,
    handleSizeChange,
    handleCurrentChange,
    showCallModal,
    handleCallRecord,
    showHistoryModal,
    handleCellEdit
  }
} 