# 客戶數據分析組件 - Customer Data Analysis Component
<template>
  <div class="data-analysis">
    <!-- 數據概覽卡片 Data Overview Cards -->
    <div class="overview-section">
      <div class="overview-card total">
        <div class="label">總客戶數</div>
        <div class="value">{{ totalCustomers }}</div>
      </div>
      <div class="overview-card">
        <div class="label">未聯繫</div>
        <div class="value">{{ uncontactedCount }}</div>
        <div class="percentage">{{ uncontactedPercentage }}%</div>
      </div>
      <div class="overview-card">
        <div class="label">已聯繫</div>
        <div class="value">{{ contactedCount }}</div>
        <div class="percentage">{{ contactedPercentage }}%</div>
      </div>
      <div class="overview-card positive">
        <div class="label">有意願</div>
        <div class="value">{{ interestedCount }}</div>
        <div class="percentage">{{ interestedPercentage }}%</div>
      </div>
    </div>

    <!-- 圖表區域 Chart Section -->
    <div class="chart-section">
      <!-- 聯繫狀態圖表 Contact Status Chart -->
      <div class="chart-card">
        <h3>聯繫狀態分布</h3>
        <div ref="contactStatusChartRef" class="chart-container"></div>
      </div>
      <!-- 意向程度圖表 Intention Level Chart -->
      <div class="chart-card">
        <h3>意向程度分布</h3>
        <div ref="intentionChartRef" class="chart-container"></div>
      </div>
      <!-- 近3日通話數量圖表 Recent Calls Chart -->
      <div class="chart-card">
        <h3>近3日通話數量</h3>
        <div ref="recentCallsChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { Customer } from '@/views/potential-customers/composables/useCustomerList'
import dayjs from 'dayjs'

// 緩存相關常量 Cache related constants
const CACHE_KEY = 'customer_analysis_cache'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分鐘緩存過期時間 5 minutes cache expiry

// 緩存數據類型 Cache data type
interface CacheData {
  timestamp: number
  data: Customer[]
  stats: {
    total: number
    contacted: number
    uncontacted: number
    interested: number
    in_progress: number
    not_interested: number
    visited: number
  }
}

// 圖表引用
const contactStatusChartRef = ref<HTMLElement | null>(null)
const intentionChartRef = ref<HTMLElement | null>(null)
const recentCallsChartRef = ref<HTMLElement | null>(null)
let contactStatusChart: echarts.ECharts | null = null
let intentionChart: echarts.ECharts | null = null
let recentCallsChart: echarts.ECharts | null = null

// 客戶數據
const customerData = ref<Customer[]>([])

// 緩存相關函數 Cache related functions
const getFromCache = (): CacheData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsedCache = JSON.parse(cached)
    const now = Date.now()
    
    // 檢查緩存是否過期 Check if cache is expired
    if (now - parsedCache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return parsedCache
  } catch (error) {
    console.error('Error reading from cache:', error)
    return null
  }
}

const saveToCache = (data: Customer[]) => {
  try {
    const cacheData: CacheData = {
      timestamp: Date.now(),
      data,
      stats: calculateStats(data)
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error saving to cache:', error)
  }
}

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

// 計算統計數據 Calculate statistics
const calculateStats = (data: Customer[]) => {
  const stats = {
    total: data.length,
    contacted: 0,
    uncontacted: 0,
    interested: 0,
    in_progress: 0,
    not_interested: 0,
    visited: 0
  }

  // 獲取所有有通話記錄的客戶ID Get all customer IDs with call records
  const contactedCustomerIds = new Set(
    data.filter(customer => customer.contactHistory && customer.contactHistory.length > 0)
      .map(customer => customer.id)
  )

  stats.contacted = contactedCustomerIds.size
  stats.uncontacted = stats.total - stats.contacted

  data.forEach(customer => {
    if (customer.contactHistory && customer.contactHistory.length > 0) {
      const latestContact = customer.contactHistory[0]
      if (latestContact.result === 'answered') {
        switch (latestContact.intention) {
          case 'interested':
            stats.interested++
            break
          case 'considering':
            stats.in_progress++
            break
          case 'not_interested':
            stats.not_interested++
            break
          case 'visited':
            stats.visited++
            break
        }
      }
    }
  })

  return stats
}

// 計算顯示數據
const stats = computed(() => calculateStats(customerData.value))
const totalCustomers = computed(() => stats.value.total)
const uncontactedCount = computed(() => stats.value.uncontacted)
const contactedCount = computed(() => stats.value.contacted)
const interestedCount = computed(() => stats.value.interested)

const uncontactedPercentage = computed(() => 
  ((stats.value.uncontacted / stats.value.total) * 100).toFixed(1)
)
const contactedPercentage = computed(() => 
  ((stats.value.contacted / stats.value.total) * 100).toFixed(1)
)
const interestedPercentage = computed(() => 
  ((stats.value.interested / stats.value.total) * 100).toFixed(1)
)

// 計算近3日通話數量
const recentCallsStats = computed(() => {
  const today = dayjs()
  const dates = Array.from({ length: 3 }, (_, i) => today.subtract(i, 'day'))
  
  // 初始化每天的通話結果統計
  const stats = dates.map(date => ({
    date: date.format('MM/DD'),
    answered: 0,    // 已接
    no_answer: 0,   // 未接
    busy: 0,        // 忙線中
    invalid: 0,     // 空號
    wrong_number: 0 // 號碼錯誤
  }))

  // 統計每天的通話數量
  customerData.value.forEach(customer => {
    if (customer.contactHistory) {
      customer.contactHistory.forEach(record => {
        const recordDate = dayjs(record.callTime)
        const dayIndex = dates.findIndex(date => 
          date.format('YYYY-MM-DD') === recordDate.format('YYYY-MM-DD')
        )
        
        if (dayIndex !== -1) {
          // 根據通話結果增加對應的計數
          if (record.result in stats[dayIndex]) {
            stats[dayIndex][record.result as keyof typeof stats[0]]++
          }
        }
      })
    }
  })

  return stats.reverse() // 反轉數組使日期按順序顯示
})

// 獲取所有客戶數據 Get all customer data
const fetchAllCustomers = async () => {
  try {
    // 先檢查緩存 Check cache first
    const cached = getFromCache()
    if (cached) {
      customerData.value = cached.data
      return
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/customers?pageSize=5000`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('獲取客戶數據失敗')
    }

    const result = await response.json()
    customerData.value = result.data
    
    // 保存到緩存 Save to cache
    saveToCache(result.data)
  } catch (error) {
    console.error('Error fetching customer data:', error)
  }
}

// 更新數據 Update data
const updateData = async () => {
  clearCache()
  await fetchAllCustomers()
}

// 監聽客戶數據更新事件 Listen for customer data update events
const handleCustomerDataUpdate = () => {
  updateData()
}

// 初始化圖表
const initCharts = () => {
  if (contactStatusChartRef.value) {
    contactStatusChart = echarts.init(contactStatusChartRef.value)
  }
  if (intentionChartRef.value) {
    intentionChart = echarts.init(intentionChartRef.value)
  }
  if (recentCallsChartRef.value) {
    recentCallsChart = echarts.init(recentCallsChartRef.value)
  }
  updateCharts()
}

// 更新圖表數據
const updateCharts = () => {
  // 更新聯繫狀態圖表
  if (contactStatusChart) {
    const contactStatusOption: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom'
      },
      series: [
        {
          name: '聯繫狀態',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          data: [
            { 
              value: stats.value.uncontacted,
              name: '未聯繫', 
              itemStyle: { color: '#909399' }
            },
            { 
              value: stats.value.contacted, 
              name: '已聯繫', 
              itemStyle: { color: '#409EFF' }
            }
          ]
        }
      ]
    }
    contactStatusChart.setOption(contactStatusOption)
  }

  // 更新意向程度圖表
  if (intentionChart) {
    const intentionOption: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom'
      },
      series: [
        {
          name: '意向程度',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          data: [
            { 
              value: stats.value.interested, 
              name: '有意願', 
              itemStyle: { color: '#67C23A' }
            },
            { 
              value: stats.value.in_progress, 
              name: '考慮中', 
              itemStyle: { color: '#E6A23C' }
            },
            { 
              value: stats.value.not_interested, 
              name: '無意願', 
              itemStyle: { color: '#F56C6C' }
            },
            { 
              value: stats.value.visited, 
              name: '已約訪', 
              itemStyle: { color: '#409EFF' }
            }
          ].filter(item => item.value > 0)
        }
      ]
    }
    intentionChart.setOption(intentionOption)
  }

  // 更新近3日通話數量圖表
  if (recentCallsChart) {
    const recentCallsOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['已接', '未接', '忙線中', '空號', '號碼錯誤'],
        bottom: 'bottom'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: recentCallsStats.value.map(stat => stat.date)
      },
      yAxis: {
        type: 'value',
        minInterval: 1
      },
      series: [
        {
          name: '已接',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#67C23A' },
          data: recentCallsStats.value.map(stat => stat.answered)
        },
        {
          name: '未接',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#E6A23C' },
          data: recentCallsStats.value.map(stat => stat.no_answer)
        },
        {
          name: '忙線中',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#F56C6C' },
          data: recentCallsStats.value.map(stat => stat.busy)
        },
        {
          name: '空號',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#909399' },
          data: recentCallsStats.value.map(stat => stat.invalid)
        },
        {
          name: '號碼錯誤',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#FF9900' },
          data: recentCallsStats.value.map(stat => stat.wrong_number)
        }
      ]
    }
    recentCallsChart.setOption(recentCallsOption)
  }
}

// 監聽數據變化
watch(stats, () => {
  updateCharts()
}, { deep: true })

// 監聽視窗大小變化
const handleResize = () => {
  contactStatusChart?.resize()
  intentionChart?.resize()
  recentCallsChart?.resize()
}

onMounted(() => {
  fetchAllCustomers()
  initCharts()
  window.addEventListener('customer-data-updated', handleCustomerDataUpdate)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  contactStatusChart?.dispose()
  intentionChart?.dispose()
  recentCallsChart?.dispose()
  window.removeEventListener('customer-data-updated', handleCustomerDataUpdate)
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
@import '@/views/potential-customers/styles/data-analysis.scss';
</style> 