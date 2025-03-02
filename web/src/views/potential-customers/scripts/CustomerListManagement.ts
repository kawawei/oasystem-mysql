import { ref } from 'vue'
import { message } from '@/plugins/message'
import type { FormInstance } from 'element-plus'

// 定義補習班資料類型 Define tutorial center data type
export interface TutorialCenter {
  id: string | number
  index: number
  name: string
  phone: string
  city: string
  district: string
  address: string
  contact: string
  email: string
  notes: string
}

// 定義表單資料類型 Define form data type
export interface TutorialCenterForm {
  id: string | number
  name: string
  phone: string
  city: string
  district: string
  address: string
  contact: string
  email: string
  notes: string
  status?: string // 添加可選的 status 字段
}

// 定義區域映射類型 Define district map type
export interface DistrictOption {
  value: string
  label: string
}

export interface DistrictMap {
  [key: string]: DistrictOption[]
}

export default function useCustomerListManagement(emit: (event: 'data-updated') => void) {
  // 當前標籤頁 Current tab
  const currentTab = ref('import')

  // 導入相關 Import related
  const uploadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/tutorial-centers/import`

  // 名單管理相關 List management related
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedArea = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(5)
  const tutorialCenters = ref<TutorialCenter[]>([
    {
      id: 1,
      index: 1,
      name: '大安優質補習班',
      phone: '02-2771-8888',
      city: '台北市',
      district: '大安區',
      address: '大安區',
      contact: '王主任',
      email: 'daan.edu@example.com',
      notes: '對國中數理班有興趣'
    },
    {
      id: 2,
      index: 2,
      name: '松山數學專門班',
      phone: '02-2756-6666',
      city: '台北市',
      district: '松山區',
      address: '松山區',
      contact: '李老師',
      email: 'math.pro@example.com',
      notes: '希望合作開設高中數學班'
    },
    {
      id: 3,
      index: 3,
      name: '林口英語補習班',
      phone: '02-2601-5555',
      city: '新北市',
      district: '林口區',
      address: '林口區',
      contact: '陳經理',
      email: 'english.edu@example.com',
      notes: '想了解多益課程方案'
    },
    {
      id: 4,
      index: 4,
      name: '三重課輔中心',
      phone: '02-2857-7777',
      city: '新北市',
      district: '三重區',
      address: '三重區',
      contact: '張主任',
      email: 'sanchong.edu@example.com',
      notes: '需要國小全科課程資料'
    },
    {
      id: 5,
      index: 5,
      name: '新莊文理補習班',
      phone: '02-2992-9999',
      city: '新北市',
      district: '新莊區',
      address: '新莊區',
      contact: '林老師',
      email: 'xinzhuang.edu@example.com',
      notes: '有意願合作國中升學班'
    }
  ])

  // 表單相關 Form related
  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const formRef = ref<FormInstance>()
  const form = ref<TutorialCenterForm>({
    id: '',
    name: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    contact: '',
    email: '',
    notes: ''
  })

  const rules = {
    name: [{ required: true, message: '請輸入補習班名稱', trigger: 'blur' }],
    phone: [{ required: true, message: '請輸入電話', trigger: 'blur' }],
    city: [{ required: true, message: '請選擇縣市', trigger: 'change' }],
    district: [{ required: true, message: '請選擇區域', trigger: 'change' }]
  }

  // 縣市選項 City options
  const cityOptions = [
    { value: '台北市', label: '台北市' },
    { value: '新北市', label: '新北市' }
  ]

  // 區域選項 District options
  const districtOptions = ref<DistrictOption[]>([])

  // 區域映射 District mapping
  const districtMap: DistrictMap = {
    '台北市': [
      { value: '中正區', label: '中正區' },
      { value: '大同區', label: '大同區' },
      { value: '中山區', label: '中山區' },
      { value: '松山區', label: '松山區' },
      { value: '大安區', label: '大安區' },
      { value: '萬華區', label: '萬華區' },
      { value: '信義區', label: '信義區' },
      { value: '士林區', label: '士林區' },
      { value: '北投區', label: '北投區' },
      { value: '內湖區', label: '內湖區' },
      { value: '南港區', label: '南港區' },
      { value: '文山區', label: '文山區' }
    ],
    '新北市': [
      { value: '板橋區', label: '板橋區' },
      { value: '新莊區', label: '新莊區' },
      { value: '中和區', label: '中和區' },
      { value: '永和區', label: '永和區' },
      { value: '土城區', label: '土城區' },
      { value: '樹林區', label: '樹林區' },
      { value: '三峽區', label: '三峽區' },
      { value: '鶯歌區', label: '鶯歌區' },
      { value: '三重區', label: '三重區' },
      { value: '蘆洲區', label: '蘆洲區' },
      { value: '五股區', label: '五股區' },
      { value: '泰山區', label: '泰山區' },
      { value: '林口區', label: '林口區' },
      { value: '八里區', label: '八里區' },
      { value: '淡水區', label: '淡水區' },
      { value: '三芝區', label: '三芝區' },
      { value: '石門區', label: '石門區' },
      { value: '金山區', label: '金山區' },
      { value: '萬里區', label: '萬里區' },
      { value: '汐止區', label: '汐止區' },
      { value: '瑞芳區', label: '瑞芳區' },
      { value: '貢寮區', label: '貢寮區' },
      { value: '平溪區', label: '平溪區' },
      { value: '雙溪區', label: '雙溪區' },
      { value: '新店區', label: '新店區' },
      { value: '深坑區', label: '深坑區' },
      { value: '石碇區', label: '石碇區' },
      { value: '坪林區', label: '坪林區' },
      { value: '烏來區', label: '烏來區' }
    ]
  }

  // 監聽縣市變化 Watch city changes
  const handleCityChange = (value: string) => {
    form.value.district = '' // 清空區域選擇
    if (value) {
      districtOptions.value = districtMap[value] || []
    } else {
      districtOptions.value = []
    }
  }

  // 搜索處理 Handle search
  const handleSearch = () => {
    // 根據搜索關鍵字過濾數據 Filter data by search query
    const filteredData = tutorialCenters.value.filter(item => {
      const searchStr = searchQuery.value.toLowerCase()
      return (
        item.name.toLowerCase().includes(searchStr) ||
        item.phone.includes(searchStr) ||
        item.email.toLowerCase().includes(searchStr) ||
        item.contact.toLowerCase().includes(searchStr) ||
        item.notes.toLowerCase().includes(searchStr)
      )
    })
    
    // 更新數據和總數 Update data and total count
    tutorialCenters.value = filteredData
    total.value = filteredData.length
    currentPage.value = 1
  }

  // 區域變更處理 Handle area change
  const handleAreaChange = () => {
    // 根據選擇的區域過濾數據 Filter data by selected area
    const filteredData = tutorialCenters.value.filter(item => {
      if (!selectedArea.value) return true
      return item.district === selectedArea.value
    })
    
    // 更新數據和總數 Update data and total count
    tutorialCenters.value = filteredData
    total.value = filteredData.length
    currentPage.value = 1
  }

  // 分頁處理 Handle pagination
  const handleSizeChange = (val: number) => {
    pageSize.value = val
    // TODO: 重新加載數據 Reload data
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    // TODO: 重新加載數據 Reload data
  }

  // 新增按鈕處理 Handle add button
  const handleAdd = () => {
    isEdit.value = false
    form.value = {
      id: '',
      name: '',
      phone: '',
      city: '',
      district: '',
      address: '',
      contact: '',
      email: '',
      notes: ''
    }
    districtOptions.value = [] // 清空區域選項
    dialogVisible.value = true
  }

  // 編輯按鈕處理 Handle edit button
  const handleEdit = (row: TutorialCenter) => {
    isEdit.value = true
    form.value = { ...row }
    if (form.value.city) {
      districtOptions.value = districtMap[form.value.city] || []
    }
    dialogVisible.value = true
  }

  // 刪除按鈕處理 Handle delete button
  const handleTutorialCenterDelete = async (row: TutorialCenter) => {
    try {
      loading.value = true
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${baseUrl}/tutorial-centers/${row.id}`, {
        method: 'DELETE',
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
          throw new Error(errorData.message || '刪除失敗')
        } else {
          throw new Error('伺服器回應格式錯誤')
        }
      }

      message.success('刪除成功')
      emit('data-updated')
    } catch (error) {
      console.error('Error deleting tutorial center:', error)
      message.error(error instanceof Error ? error.message : '刪除失敗')
    } finally {
      loading.value = false
    }
  }

  // 表單提交處理 Handle form submit
  const handleFormSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const method = isEdit.value ? 'PUT' : 'POST'
      const url = isEdit.value 
        ? `${baseUrl}/tutorial-centers/${form.value.id}`
        : `${baseUrl}/tutorial-centers`

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(form.value)
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.message || `${isEdit.value ? '更新' : '新增'}失敗`)
        } else {
          throw new Error('伺服器回應格式錯誤')
        }
      }

      message.success(`${isEdit.value ? '更新' : '新增'}成功`)
      dialogVisible.value = false
      emit('data-updated')
    } catch (error) {
      console.error('Error submitting form:', error)
      message.error(error instanceof Error ? error.message : `${isEdit.value ? '更新' : '新增'}失敗`)
    } finally {
      loading.value = false
    }
  }

  // 上傳前檢查 Before upload check
  const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.type === 'application/vnd.ms-excel'
    if (!isExcel) {
      message.error('只能上傳 Excel 檔案!')
      return false
    }
    return true
  }

  // 上傳成功處理 Handle upload success
  const handleFileUploadSuccess = () => {
    message.success('上傳成功')
    emit('data-updated')
  }

  // 下載範本 Download template
  const downloadTemplate = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    window.open(`${baseUrl}/tutorial-centers/template`, '_blank')
  }

  return {
    currentTab,
    loading,
    searchQuery,
    selectedArea,
    currentPage,
    pageSize,
    total,
    tutorialCenters,
    dialogVisible,
    isEdit,
    formRef,
    form,
    rules,
    cityOptions,
    districtOptions,
    uploadUrl,
    handleSearch,
    handleAreaChange,
    handleSizeChange,
    handleCurrentChange,
    handleAdd,
    handleEdit,
    handleTutorialCenterDelete,
    handleFormSubmit,
    handleCityChange,
    beforeUpload,
    handleFileUploadSuccess,
    downloadTemplate
  }
}