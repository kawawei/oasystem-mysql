import { watch } from 'vue'
import { message } from '@/plugins/message'
import { useCustomerList } from './useCustomerList'
import { debounce } from 'lodash-es'  // 添加 debounce 功能

// 擴展現有的 useCustomerList composable
export function useInterestedCustomerList() {
  // 獲取基本的客戶列表功能
  const baseCustomerList = useCustomerList()
  
  // 重寫 fetchCustomerList 方法，添加意向客戶的過濾條件
  const fetchCustomerList = async () => {
    if (!baseCustomerList.loading.value) {  // 防止重複請求
      baseCustomerList.loading.value = true
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const queryParams = new URLSearchParams({
          page: baseCustomerList.pagination.value.current.toString(),
          pageSize: baseCustomerList.pagination.value.pageSize.toString(),
          status: 'interested' // 只獲取意向客戶
        })

        if (baseCustomerList.searchQuery.value) {
          queryParams.append('search', baseCustomerList.searchQuery.value)
        }

        if (baseCustomerList.selectedCity.value) {
          queryParams.append('city', baseCustomerList.selectedCity.value)
        }

        if (baseCustomerList.selectedDistrict.value) {
          queryParams.append('district', baseCustomerList.selectedDistrict.value)
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

        baseCustomerList.pagination.value.total = result.total
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

  // 分別監聽搜索相關的值和分頁相關的值
  watch(
    [baseCustomerList.searchQuery, baseCustomerList.selectedCity, baseCustomerList.selectedDistrict],
    () => {
      // 重置分頁到第一頁
      baseCustomerList.pagination.value.current = 1
      debouncedFetch()
    },
    { deep: true }
  )

  watch(
    () => baseCustomerList.pagination.value,
    () => {
      fetchCustomerList()
    },
    { deep: true }
  )

  return {
    ...baseCustomerList,
    fetchCustomerList
  }
} 