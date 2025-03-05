import { ref, onMounted, onUnmounted } from 'vue'

// 響應式處理 composable
// Responsive handling composable
export const useResponsive = () => {
  // 是否為移動端
  // Whether it is mobile device
  const isMobile = ref(false)

  // 檢查是否為移動端
  // Check if it is mobile device
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }

  // 組件掛載時添加事件監聽
  // Add event listener when component is mounted
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  // 組件卸載時移除事件監聽
  // Remove event listener when component is unmounted
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return {
    isMobile,
    checkMobile
  }
} 