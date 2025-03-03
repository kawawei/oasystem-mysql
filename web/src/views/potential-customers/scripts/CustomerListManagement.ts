import { ref } from 'vue'
import { message } from '@/plugins/message'
import type { FormInstance } from 'element-plus'
import { ElMessageBox } from 'element-plus'

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
  status: string
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

export default function useCustomerListManagement(emit: (event: 'data-updated') => void, filterInterested = false) {
  // 當前標籤頁 Current tab
  const currentTab = ref('import')

  // 表格列定義
  const columns = [
    { 
      key: 'index', 
      title: '序號',
      width: '70px',
      template: 'index'
    },
    { 
      key: 'name', 
      title: '補習班名稱',
      minWidth: '150px'
    },
    { 
      key: 'phone', 
      title: '電話',
      minWidth: '120px'
    },
    { 
      key: 'city', 
      title: '縣市',
      width: '100px'
    },
    { 
      key: 'district', 
      title: '區域',
      width: '100px'
    },
    { 
      key: 'contact', 
      title: '聯絡人',
      width: '100px'
    },
    { 
      key: 'email', 
      title: 'Email',
      minWidth: '180px'
    },
    { 
      key: 'notes', 
      title: '備註',
      minWidth: '150px'
    },
    { 
      key: 'status', 
      title: '意向狀態',
      width: '100px'
    },
    { 
      key: 'actions', 
      title: '操作',
      width: '150px',
      fixed: 'right',
      template: 'actions'
    }
  ]

  // 導入相關 Import related
  const uploadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/tutorial-centers/import`

  // 名單管理相關 List management related
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedArea = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const tutorialCenters = ref<TutorialCenter[]>([])

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
    currentPage.value = 1 // 重置到第一頁
    fetchTutorialCenters() // 重新獲取數據
  }

  // 區域變更處理 Handle area change
  const handleAreaChange = () => {
    currentPage.value = 1 // 重置到第一頁
    fetchTutorialCenters() // 重新獲取數據
  }

  // 分頁處理 Handle pagination
  const handleSizeChange = (val: number) => {
    pageSize.value = val
    fetchTutorialCenters() // 重新獲取數據
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    fetchTutorialCenters() // 重新獲取數據
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

  // 處理表單提交 Handle form submission
  const handleFormSubmit = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          loading.value = true
          const url = isEdit.value 
            ? `/tutorial-centers/${form.value.id}`
            : '/tutorial-centers'
          const method = isEdit.value ? 'PUT' : 'POST'
          
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${url}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(form.value)
          })

          if (!response.ok) {
            throw new Error('操作失敗')
          }

          message.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          await fetchTutorialCenters() // 重新獲取數據
          emit('data-updated') // 通知父組件數據已更新
        } catch (error) {
          console.error('Error:', error)
          message.error(isEdit.value ? '更新失敗' : '新增失敗')
        } finally {
          loading.value = false
        }
      }
    })
  }

  // 處理刪除 Handle delete
  const handleTutorialCenterDelete = async (row: TutorialCenter) => {
    try {
      await ElMessageBox.confirm(
        '確定要刪除這個補習班嗎？',
        '警告',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/tutorial-centers/${row.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('刪除失敗')
      }

      message.success('刪除成功')
      await fetchTutorialCenters() // 重新獲取數據
      emit('data-updated') // 通知父組件數據已更新
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Error:', error)
        message.error('刪除失敗')
      }
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

  // 處理文件上傳成功 Handle file upload success
  const handleFileUploadSuccess = async () => {
    message.success('導入成功')
    await fetchTutorialCenters() // 重新獲取數據
    emit('data-updated') // 通知父組件數據已更新
  }

  // 下載範本 Download template
  const downloadTemplate = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    window.open(`${baseUrl}/tutorial-centers/template`, '_blank')
  }

  // 獲取補習班列表
  const fetchTutorialCenters = async () => {
    try {
      loading.value = true
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const queryParams = new URLSearchParams({
        page: currentPage.value.toString(),
        pageSize: pageSize.value.toString()
      })

      if (filterInterested) {
        queryParams.append('intention', ['interested', 'considering', 'visited'].join(','))
      }

      if (searchQuery.value) {
        queryParams.append('search', searchQuery.value)
      }

      if (selectedArea.value) {
        queryParams.append('district', selectedArea.value)
      }

      const response = await fetch(`${baseUrl}/tutorial-centers?${queryParams.toString()}`, {
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
          throw new Error(errorData.message || '獲取補習班列表失敗')
        } else {
          throw new Error('伺服器回應格式錯誤')
        }
      }

      const result = await response.json()
      
      // 將後端數據轉換為前端所需格式
      let data = result.data;
      
      // 如果需要過濾意向客戶
      if (filterInterested) {
        data = data.filter((item: any) => {
          const intention = item.contactHistory?.[0]?.intention;
          return intention === 'interested' || intention === 'considering' || intention === 'visited';
        });
      }

      tutorialCenters.value = data.map((item: any, index: number) => ({
        id: item.id,
        index: (currentPage.value - 1) * pageSize.value + index + 1,
        name: item.name || '',
        phone: item.phone || '',
        city: item.city || '',
        district: item.district || '',
        address: item.address || '',
        contact: item.contact || '',
        email: item.email || '',
        notes: item.notes || '',
        status: item.contactHistory?.[0]?.intention || ''
      }))

      total.value = filterInterested ? data.length : result.total
    } catch (error) {
      console.error('Error fetching tutorial centers:', error)
      message.error(error instanceof Error ? error.message : '獲取補習班列表失敗')
    } finally {
      loading.value = false
    }
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
    downloadTemplate,
    columns,
    fetchTutorialCenters
  }
}