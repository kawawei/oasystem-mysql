import { ref } from 'vue'
import type { Customer } from './useCustomerList'

// 定義意向統計數據類型
interface IntentionStats {
  value: number
  name: string
  itemStyle: {
    color: string
  }
}

export function useCustomerStats() {
  // 意向分布數據
  const intentionStats = ref<IntentionStats[]>([])

  // 計算意向分布
  const calculateIntentionStats = (customers: Customer[]) => {
    // 初始化計數器，使用與數據庫完全一致的狀態分類
    const stats = {
      new: 0,              // 新名單
      interested: 0,       // 有意願
      in_progress: 0,      // 考慮中
      not_interested: 0,   // 無意願
      busy: 0,            // 忙碌中
      no_answer: 0,       // 未接聽
      invalid: 0,         // 空號
      call_back: 0,       // 預約回撥
      visited: 0,         // 已約訪
      contracted: 0       // 已簽約
    }

    // 統計各狀態的數量
    customers.forEach(customer => {
      // 確保 status 是有效的鍵值
      if (customer.status in stats) {
        stats[customer.status as keyof typeof stats]++
      }
    })

    // 轉換為圖表所需格式，使用實際狀態名稱
    intentionStats.value = [
      { value: stats.new, name: '新名單', itemStyle: { color: '#909399' } },
      { value: stats.interested, name: '有意願', itemStyle: { color: '#67C23A' } },
      { value: stats.in_progress, name: '考慮中', itemStyle: { color: '#E6A23C' } },
      { value: stats.not_interested, name: '無意願', itemStyle: { color: '#F56C6C' } },
      { value: stats.busy, name: '忙碌中', itemStyle: { color: '#409EFF' } },
      { value: stats.no_answer, name: '未接聽', itemStyle: { color: '#909399' } },
      { value: stats.invalid, name: '空號', itemStyle: { color: '#F56C6C' } },
      { value: stats.call_back, name: '預約回撥', itemStyle: { color: '#E6A23C' } },
      { value: stats.visited, name: '已約訪', itemStyle: { color: '#67C23A' } },
      { value: stats.contracted, name: '已簽約', itemStyle: { color: '#67C23A' } }
    ].filter(item => item.value > 0) // 只顯示有數據的狀態
  }

  return {
    intentionStats,
    calculateIntentionStats
  }
} 