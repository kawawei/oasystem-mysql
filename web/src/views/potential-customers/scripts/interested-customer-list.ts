import { ref } from 'vue'
import { Search, Phone, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useInterestedCustomerList } from '../composables/useInterestedCustomerList'
import { getStatusType, getStatusText, getTimelineType } from '../utils/statusUtils'

export const useInterestedCustomerListView = () => {
  const submitting = ref(false)

  // 選項定義
  const resultOptions = [
    { label: '已接聽', value: 'answered' },
    { label: '未接聽', value: 'no_answer' },
    { label: '忙線中', value: 'busy' },
    { label: '空號', value: 'invalid' },
    { label: '號碼有誤', value: 'wrong_number' }
  ]

  const intentionOptions = [
    { label: '有意願', value: 'interested' },
    { label: '無意願', value: 'not_interested' },
    { label: '考慮中', value: 'considering' },
    { label: '不相關', value: 'irrelevant' }
  ]

  // 使用組合式函數
  const {
    loading,
    searchQuery,
    selectedCity,
    selectedDistrict,
    customerData,
    pagination,
    cities,
    districts,
    columns,
    callModalVisible,
    callForm,
    callFormRef,
    callFormRules,
    fetchCustomerList,
    handleSearch,
    handleAreaChange,
    handleSizeChange,
    handleCurrentChange,
    showCallModal,
    showHistoryModal,
    handleCellEdit,
    handleCallRecord,
    historyModalVisible,
    callHistory,
    selectedHistoryRecord,
    toggleHistoryDetails
  } = useInterestedCustomerList()

  // 在組件掛載時獲取數據
  fetchCustomerList()

  return {
    // 狀態
    submitting,
    loading,
    searchQuery,
    selectedCity,
    selectedDistrict,
    customerData,
    pagination,
    
    // 數據
    cities,
    districts,
    columns,
    resultOptions,
    intentionOptions,
    
    // 模態框相關
    callModalVisible,
    callForm,
    callFormRef,
    callFormRules,
    historyModalVisible,
    callHistory,
    selectedHistoryRecord,
    
    // 方法
    fetchCustomerList,
    handleSearch,
    handleAreaChange,
    handleSizeChange,
    handleCurrentChange,
    showCallModal,
    showHistoryModal,
    handleCellEdit,
    handleCallRecord,
    toggleHistoryDetails,
    
    // 工具函數
    getStatusType,
    getStatusText,
    getTimelineType,
    dayjs,
    
    // 圖標
    Search,
    Phone,
    InfoFilled
  }
} 