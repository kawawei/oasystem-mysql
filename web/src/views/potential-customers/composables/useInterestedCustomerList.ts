import { watch } from 'vue'
import { message } from '@/plugins/message'
import { useCustomerList } from './useCustomerList'
import { debounce } from 'lodash-es'

// 擴展現有的 useCustomerList composable
export function useInterestedCustomerList() {
  // 獲取基本的客戶列表功能
  const baseCustomerList = useCustomerList()
  
  // 重寫 fetchCustomerList 方法
  const fetchCustomerList = async () => {
    if (!baseCustomerList.loading.value) {  // 防止重複請求
      baseCustomerList.loading.value = true
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const queryParams = new URLSearchParams({
          search: baseCustomerList.searchQuery.value || '',
          city: baseCustomerList.selectedCity.value || '',
          district: baseCustomerList.selectedDistrict.value || ''
        })

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
        
        // 將後端數據轉換為前端所需格式
        baseCustomerList.customerData.value = result.data.map((item: any) => ({
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

        // 更新分頁數據
        baseCustomerList.pagination.value = {
          current: 1,
          pageSize: result.data.length || 10, // 如果沒有數據，默認顯示10條
          total: result.total
        }
      } catch (error) {
        console.error('Error fetching interested customer list:', error)
        message.error(error instanceof Error ? error.message : '獲取意向客戶列表失敗')
      } finally {
        baseCustomerList.loading.value = false
      }
    }
  }

  // 使用 debounce 處理搜索請求
  const debouncedFetch = debounce(fetchCustomerList, 300)

  // 只監聽搜索相關的值
  watch(
    [baseCustomerList.searchQuery, baseCustomerList.selectedCity, baseCustomerList.selectedDistrict],
    () => {
      debouncedFetch()
    },
    { deep: true }
  )

  return {
    ...baseCustomerList,
    fetchCustomerList
  }
} 