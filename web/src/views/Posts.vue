<template>
  <div class="posts">
    <h1>貼文列表</h1>
    <div class="content">
      <!-- 這裡將來放置貼文列表的內容 -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Posts',
  components: {},
  setup() {
    return {}
  }
})
</script>

<style scoped>
.posts {
  padding: 20px;
}

.content {
  margin-top: 20px;
}
</style> 