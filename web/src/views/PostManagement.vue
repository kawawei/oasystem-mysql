<template>
  <div class="post-management">
    <h1>貼文管理</h1>
    <div class="content">
      <!-- 這裡將來放置貼文管理的內容 -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PostManagement',
  components: {},
  setup() {
    return {}
  }
})
</script>

<style scoped>
.post-management {
  padding: 20px;
}

.content {
  margin-top: 20px;
}
</style> 