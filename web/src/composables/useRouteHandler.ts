import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由處理 composable
// Route handling composable
export const useRouteHandler = (openAddModal: () => Promise<void>) => {
  const route = useRoute()
  const router = useRouter()

  // 監聽路由參數變化
  // Listen to route parameter changes
  onMounted(() => {
    // 檢查 URL 參數
    // Check URL parameters
    if (route.query.openAddModal === 'true') {
      // 移除 URL 參數
      // Remove URL parameters
      router.replace({ query: {} })
      // 打開新增對話框
      // Open add modal
      openAddModal()
    }
  })

  return {
    route,
    router
  }
} 