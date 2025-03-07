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

// 圖表引用
const contactStatusChartRef = ref<HTMLElement | null>(null)
const intentionChartRef = ref<HTMLElement | null>(null)
const recentCallsChartRef = ref<HTMLElement | null>(null)
let contactStatusChart: echarts.ECharts | null = null
let intentionChart: echarts.ECharts | null = null
let recentCallsChart: echarts.ECharts | null = null

// 客戶數據
const customerData = ref<Customer[]>([])

// 計算統計數據
const stats = computed(() => {
  const data = {
    total: customerData.value.length,
    contacted: 0,     // 已聯繫（有通話記錄的）
    uncontacted: 0,   // 未聯繫
    interested: 0,    // 有意願
    in_progress: 0,   // 考慮中
    not_interested: 0,// 無意願
    visited: 0        // 已約訪
  }

  // 獲取所有有通話記錄的客戶ID
  const contactedCustomerIds = new Set(
    customerData.value
      .filter(customer => customer.contactHistory && customer.contactHistory.length > 0)
      .map(customer => customer.id)
  )

  // 計算已聯繫和未聯繫的客戶數量
  data.contacted = contactedCustomerIds.size
  data.uncontacted = data.total - data.contacted  // 未聯繫數量 = 總數 - 已聯繫數

  // 計算意向分布
  customerData.value.forEach(customer => {
    if (customer.contactHistory && customer.contactHistory.length > 0) {
      // 獲取最新的通話記錄
      const latestContact = customer.contactHistory[0]
      if (latestContact.result === 'answered') {
        switch (latestContact.intention) {
          case 'interested':
            data.interested++
            break
          case 'considering':
            data.in_progress++
            break
          case 'not_interested':
            data.not_interested++
            break
          case 'visited':
            data.visited++
            break
        }
      }
    }
  })

  return data
})

// 計算顯示數據
const totalCustomers = computed(() => stats.value.total)
const uncontactedCount = computed(() => stats.value.uncontacted)  // 使用 uncontacted 屬性
const contactedCount = computed(() => stats.value.contacted)
const interestedCount = computed(() => stats.value.interested)

const uncontactedPercentage = computed(() => 
  ((stats.value.uncontacted / stats.value.total) * 100).toFixed(1)  // 使用 uncontacted 屬性
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

// 獲取所有客戶數據
const fetchAllCustomers = async () => {
  try {
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
  } catch (error) {
    console.error('Error fetching customer data:', error)
  }
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
              value: stats.value.uncontacted,  // 使用 uncontacted 屬性
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

onMounted(async () => {
  await fetchAllCustomers()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  contactStatusChart?.dispose()
  intentionChart?.dispose()
  recentCallsChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.data-analysis {
  padding: var(--spacing-lg);
  
  .overview-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
    
    .overview-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      text-align: center;
      
      &.total {
        background: #409EFF;
        color: #fff;
      }
      
      &.positive {
        color: #67C23A;
      }
      
      .label {
        font-size: 14px;
        color: inherit;
        margin-bottom: 8px;
      }
      
      .value {
        font-size: 24px;
        font-weight: bold;
        color: inherit;
      }
      
      .percentage {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .chart-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    
    .chart-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      
      h3 {
        margin: 0 0 20px 0;
        color: var(--color-text-primary);
        font-size: 16px;
        font-weight: 500;
      }
      
      .chart-container {
        height: 400px;
        width: 100%;
      }
    }
  }
}
</style> 