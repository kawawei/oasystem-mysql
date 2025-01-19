<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <h1>儀表板</h1>
      </div>
    </header>
    
    <main class="main-content">
      <template v-if="isAdmin">
        <div class="grid">
          <!-- 管理員看到的卡片 -->
          <div class="card schedule-card">
            <h2>今日排班</h2>
            <div class="card-content">
              <div class="stat-value">15</div>
              <div class="stat-label">人數</div>
            </div>
          </div>
          
          <div class="card checkin-card">
            <h2>已打卡</h2>
            <div class="card-content">
              <div class="stat-value">12</div>
              <div class="stat-label">人數</div>
            </div>
          </div>
          
          <div class="card leave-card">
            <h2>請假</h2>
            <div class="card-content">
              <div class="stat-value">3</div>
              <div class="stat-label">人數</div>
            </div>
          </div>
        </div>
      </template>
      
      <template v-else>
        <!-- 普通用戶看到的打卡卡片 -->
        <div class="card attendance-card">
          <h2>考勤狀態</h2>
          <div class="attendance-status">
            <div class="time">{{ currentTime }}</div>
            <button 
              class="attendance-button"
              :class="{
                'checked-in': isCheckedIn && !hasCheckedOut,
                'checked-out': hasCheckedOut
              }"
              @click="handleAttendance"
              :disabled="loading || hasCheckedOut"
            >
              {{ getButtonText() }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from '../composables/useToast'
import { attendanceApi } from '../services/api'
import { useRoute } from 'vue-router'

const toast = useToast()
const route = useRoute()
const currentTime = ref(new Date().toLocaleTimeString())
const isCheckedIn = ref(false)
const hasCheckedOut = ref(false)
const loading = ref(false)

// 更新當前時間
const timeInterval = setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString()
}, 1000)

// 判斷是否為管理員
const isAdmin = computed(() => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  return user?.role === 'admin'
})

// 獲取按鈕文字
const getButtonText = () => {
  if (loading.value) return '載入中...'
  if (hasCheckedOut.value) return '今日已完成打卡'
  if (isCheckedIn.value) return '簽退'
  return '簽到'
}

// 格式化日期為 YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 檢查今天的打卡狀態
const checkTodayStatus = async () => {
  try {
    const { data } = await attendanceApi.getRecords(
      formatDate(new Date()),
      formatDate(new Date())
    )
    console.log('Today\'s attendance records:', data)

    // Reset states
    isCheckedIn.value = false
    hasCheckedOut.value = false

    // If we have records for today
    if (data && data.length > 0) {
      const record = data[0] // Get the latest record
      console.log('Latest record:', record)

      // If we have a check-in time
      if (record.checkInTime) {
        isCheckedIn.value = true
        // If we also have a check-out time
        if (record.checkOutTime) {
          hasCheckedOut.value = true
        }
      }
    }

    console.log('Final button state:', {
      isCheckedIn: isCheckedIn.value,
      hasCheckedOut: hasCheckedOut.value,
      buttonText: getButtonText()
    })
  } catch (error) {
    console.error('Error checking today\'s status:', error)
    toast.error('檢查打卡狀態失敗')
  }
}

// 處理打卡
const handleAttendance = async () => {
  if (loading.value || hasCheckedOut.value) return
  
  loading.value = true
  try {
    if (!isCheckedIn.value) {
      const response = await attendanceApi.checkIn()
      console.log('簽到結果:', response)
      isCheckedIn.value = true
      hasCheckedOut.value = false
      toast.success('簽到成功')
    } else {
      const response = await attendanceApi.checkOut()
      console.log('簽退結果:', response)
      isCheckedIn.value = true
      hasCheckedOut.value = true
      toast.success('簽退成功')
    }
  } catch (error: any) {
    console.error('打卡失敗:', error)
    const message = error.response?.data?.message || '打卡失敗'
    toast.error(message)
  } finally {
    loading.value = false
    // 延遲一下再重新檢查狀態，確保後端資料已更新
    setTimeout(async () => {
      await checkTodayStatus()
    }, 1000)
  }
}

// 組件掛載時檢查狀態
onMounted(checkTodayStatus)

// 監聽路由變化
watch(() => route.path, (newPath) => {
  if (newPath === '/home') {
    checkTodayStatus()
  }
})

// 每5分鐘檢查一次打卡狀態
const statusInterval = setInterval(() => {
  if (route.path === '/home' && !loading.value) {
    checkTodayStatus()
  }
}, 300000)

// 組件卸載時清理定時器
onUnmounted(() => {
  clearInterval(timeInterval)
  clearInterval(statusInterval)
})
</script>

<style lang="scss" scoped>
.dashboard {
  min-height: 100vh;
}

.header {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-border);
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-md) var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h1 {
      font-size: 1.5rem;
      margin: 0;
    }
  }
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.card {
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  
  h2 {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-lg);
    color: var(--color-text);
  }
}

.schedule-card {
  border-top: 4px solid var(--color-primary);
}

.checkin-card {
  border-top: 4px solid #34C759;
}

.leave-card {
  border-top: 4px solid #FF9500;
}

.card-content {
  text-align: center;
  padding: var(--spacing-lg) 0;
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: var(--spacing-xs);
  }
  
  .stat-label {
    font-size: 1rem;
    color: var(--color-text-secondary);
  }
}

.attendance-card {
  max-width: 400px;
  margin: 0 auto;
  
  .attendance-status {
    text-align: center;
    
    .time {
      font-size: 2.5rem;
      font-weight: 200;
      color: var(--color-text);
      margin-bottom: var(--spacing-lg);
    }
  }
}

.attendance-button {
  width: 100%;
  height: 44px;
  background-color: var(--color-primary);
  color: white;
  font-size: 1rem;
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  
  &.checked-in {
    background-color: #34C759;
  }
  
  &.checked-out {
    background-color: #8E8E93;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style> 