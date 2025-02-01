<template>
  <div class="posts">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>貼文列表</h1>
        <div class="header-filters">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="搜尋貼文標題"
            class="search-input"
          >
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <i class="fas fa-list"></i>
              列表
            </button>
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'calendar' }"
              @click="viewMode = 'calendar'"
            >
              <i class="fas fa-calendar-alt"></i>
              行事曆
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="search-section" v-show="isMobile">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="搜尋貼文標題"
        class="search-input"
      >
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <i class="fas fa-list"></i>
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >
          <i class="fas fa-calendar-alt"></i>
        </button>
      </div>
    </div>

    <!-- 月曆視圖 -->
    <div v-if="viewMode === 'calendar'" class="calendar-container">
      <post-calendar :posts="posts" @view="handleView" />
    </div>

    <!-- 列表視圖 -->
    <template v-else>
      <div class="card-view" v-show="isMobile">
        <div v-if="loading" class="loading">載入中...</div>
        <template v-else>
          <div v-for="post in filteredPosts" :key="post.id" class="post-card">
            <div class="card-header">
              <h3>{{ post.title }}</h3>
              <div class="platform-icon" :class="post.platform">
                <i v-if="post.platform === 'facebook'" class="fab fa-facebook"></i>
                <i v-else-if="post.platform === 'instagram'" class="fab fa-instagram"></i>
                <span class="platform-name">{{ post.platform }}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="info-item">
                <span class="label">發文時間：</span>
                <span class="value">{{ formatDateTime(post.postTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">發文人：</span>
                <span class="value">{{ post.creator?.name || '未指定' }}</span>
              </div>
              <div class="info-item">
                <span class="label">狀態：</span>
                <span class="value status-badge" :class="post.status">
                  {{ getStatusText(post.status) }}
                </span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="handleView(post)" class="btn-edit">
                查看
              </button>
            </div>
          </div>
          <div v-if="filteredPosts.length === 0" class="no-data-card">
            暫無貼文
          </div>
        </template>
      </div>

      <!-- 桌面端表格視圖 -->
      <div class="table-container" v-show="!isMobile">
        <table class="data-table">
          <thead>
            <tr>
              <th>標題</th>
              <th>發文管道</th>
              <th>發文時間</th>
              <th>發文人</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="loading">載入中...</td>
            </tr>
            <template v-else>
              <tr v-for="post in filteredPosts" :key="post.id">
                <td>
                  <div class="post-title">
                    <span class="title-text">{{ post.title }}</span>
                    <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  </div>
                </td>
                <td>
                  <div class="platform-icon" :class="post.platform">
                    <i v-if="post.platform === 'facebook'" class="fab fa-facebook"></i>
                    <i v-else-if="post.platform === 'instagram'" class="fab fa-instagram"></i>
                    <span class="platform-name">{{ post.platform }}</span>
                  </div>
                </td>
                <td>{{ formatDateTime(post.postTime) }}</td>
                <td>{{ post.creator?.name || '未指定' }}</td>
                <td>
                  <div class="status-badge" :class="post.status">
                    {{ getStatusText(post.status) }}
                  </div>
                </td>
                <td class="actions">
                  <button @click="handleView(post)" class="btn-edit">
                    查看
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPosts.length === 0">
                <td colspan="6" class="no-data">暫無貼文</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 查看貼文對話框 -->
    <div v-if="showViewDialog" class="modal" @click.self="showViewDialog = false">
      <div class="modal-content">
        <h2>查看貼文</h2>
        <div class="post-detail" v-if="currentPost">
          <div class="form-group">
            <label>標題</label>
            <div class="text-content">{{ currentPost.title }}</div>
          </div>
          
          <div class="form-group">
            <label>內容</label>
            <div class="text-content">{{ currentPost.content }}</div>
          </div>
          
          <div class="form-group">
            <label>媒體內容</label>
            <div class="media-content">
              <template v-if="currentPost.mediaFiles && currentPost.mediaFiles.length > 0">
                <div v-for="file in currentPost.mediaFiles" :key="file" class="media-item">
                  <img :src="'/api/files/' + file" alt="媒體文件" />
                </div>
              </template>
              <div v-else class="no-media">暫無媒體文件</div>
            </div>
          </div>
          
          <div class="form-group">
            <label>發文管道</label>
            <div class="platform-icon" :class="currentPost.platform">
              <i v-if="currentPost.platform === 'facebook'" class="fab fa-facebook"></i>
              <i v-else-if="currentPost.platform === 'instagram'" class="fab fa-instagram"></i>
              <span class="platform-name">{{ currentPost.platform }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>發文時間</label>
            <div class="text-content">{{ formatDateTime(currentPost.postTime) }}</div>
          </div>
          
          <div class="form-group">
            <label>狀態</label>
            <select v-model="currentPost.status" class="status-select">
              <option value="pending">待審核</option>
              <option value="revision">需修改</option>
              <option value="approved">已通過</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>審核意見</label>
            <textarea 
              v-model="currentPost.reviewComment" 
              class="review-comment"
              placeholder="請輸入審核意見"
              rows="4"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button @click="handleSave" class="btn-save">
              保存
            </button>
            <button @click="showViewDialog = false" class="btn-cancel">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { postApi, type Post as ApiPost } from '@/services/api'
import PostCalendar from '@/components/calendar/PostCalendar.vue'

interface Post extends ApiPost {
  creator?: {
    id: number
    name: string
  }
}

export default defineComponent({
  name: 'Posts',
  components: {
    PostCalendar
  },
  setup() {
    const showViewDialog = ref(false)
    const currentPost = ref<Post | null>(null)
    const isMobile = ref(false)
    const searchQuery = ref('')
    const posts = ref<Post[]>([])
    const loading = ref(false)
    const viewMode = ref('list')

    // 格式化日期
    const formatDate = (date: string) => {
      return dayjs(date).format('YYYY-MM-DD')
    }

    // 格式化日期時間
    const formatDateTime = (datetime: string) => {
      return dayjs(datetime).format('YYYY-MM-DD HH:mm')
    }

    // 獲取狀態對應的文字
    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        pending: '待審核',
        revision: '需修改',
        approved: '已通過',
        published: '已發布'
      }
      return statusMap[status] || status
    }

    // 檢查是否為移動端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // 獲取貼文列表
    const fetchPosts = async () => {
      try {
        loading.value = true
        const response = await postApi.getPosts()
        console.log('Posts response:', response.data)
        posts.value = response.data
      } catch (error) {
        console.error('Error fetching posts:', error)
        ElMessage.error('獲取貼文列表失敗')
      } finally {
        loading.value = false
      }
    }

    // 處理查看貼文
    const handleView = async (postOrId: Post | number) => {
      try {
        let id: number;
        if (typeof postOrId === 'number') {
          id = postOrId;
        } else {
          id = postOrId.id;
        }

        const response = await postApi.getPost(id)
        currentPost.value = response.data
        showViewDialog.value = true
      } catch (error) {
        console.error('Error fetching post:', error)
        ElMessage.error('獲取貼文詳情失敗')
      }
    }

    // 保存貼文更新
    const handleSave = async () => {
      if (!currentPost.value) return
      
      try {
        await postApi.updatePost(currentPost.value.id, {
          status: currentPost.value.status,
          reviewComment: currentPost.value.reviewComment
        })
        ElMessage.success('更新成功')
        showViewDialog.value = false
        fetchPosts() // 重新獲取貼文列表
      } catch (error) {
        console.error('Error updating post:', error)
        ElMessage.error('更新失敗')
      }
    }

    // 過濾後的貼文列表
    const filteredPosts = computed(() => {
      if (!searchQuery.value) return posts.value
      const query = searchQuery.value.toLowerCase()
      return posts.value.filter(post => 
        post.title.toLowerCase().includes(query)
      )
    })

    // 監聽窗口大小變化
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      fetchPosts()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    return {
      showViewDialog,
      currentPost,
      isMobile,
      searchQuery,
      posts,
      loading,
      formatDate,
      formatDateTime,
      getStatusText,
      checkMobile,
      handleView,
      handleSave,
      filteredPosts,
      viewMode
    }
  }
})
</script>

<style scoped>
.posts {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
}

.header-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  width: 240px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.1);
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f5f5f7;
}

.data-table th {
  background: #f5f5f7;
  font-weight: 600;
  color: #1d1d1f;
}

.data-table td {
  color: #1d1d1f;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  font-weight: 500;
  min-width: 80px;
  background: #0071e3;
  color: white;
}

.btn-edit:hover {
  background: #0077ed;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-data {
  text-align: center;
  padding: 32px;
  color: #86868b;
}

/* 移動端樣式 */
.search-section {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-section .search-input {
  flex: 1;
}

.card-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: #86868b;
  font-size: 14px;
}

.info-item .value {
  color: #1d1d1f;
  font-size: 14px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.no-data-card {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 12px;
  color: #86868b;
}

/* 狀態標籤樣式 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fff7e6;
  color: #d46b08;
}

.status-badge.revision {
  background-color: #fff1f0;
  color: #cf1322;
}

.status-badge.approved {
  background-color: #f6ffed;
  color: #389e0d;
}

.status-badge.published {
  background-color: #e6f7ff;
  color: #096dd9;
}

/* 用戶信息樣式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background-color: #1677ff;
  color: #ffffff;
}

/* 平台圖標樣式 */
.platform-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 16px;
}

.platform-icon.facebook {
  background-color: #f5f9ff;
  color: #1877f2;
}

.platform-icon.instagram {
  background: linear-gradient(45deg, #f9f0ff, #fff0f6);
  color: #e4405f;
}

.platform-icon i {
  font-size: 20px;
}

.platform-name {
  font-size: 14px;
  text-transform: capitalize;
}

/* 貼文標題樣式 */
.post-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  font-weight: 500;
  color: #1d1d1f;
}

.post-date {
  font-size: 12px;
  color: #86868b;
}

/* 對話框樣式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1d1d1f;
}

.text-content {
  padding: 12px;
  background: #f5f5f7;
  border-radius: 8px;
  color: #1d1d1f;
  line-height: 1.5;
}

.media-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 8px;
}

.media-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.no-media {
  text-align: center;
  padding: 32px;
  color: #86868b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-save {
  padding: 8px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:hover {
  background-color: #66b1ff;
}

.btn-cancel {
  padding: 8px 20px;
  background-color: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background-color: #a6a9ad;
}

.status-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  margin-top: 4px;
}

.review-comment {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  resize: vertical;
  margin-top: 4px;
}

.loading {
  text-align: center;
  padding: 32px;
  color: #86868b;
}

.view-toggle {
  display: flex;
  gap: 8px;
  margin: 0 16px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: #0071e3;
  color: white;
  border-color: #0071e3;
}

.toggle-btn i {
  font-size: 14px;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  min-height: 500px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .posts {
    padding: 16px;
  }

  .search-input {
    width: 100%;
  }

  .platform-icon {
    padding: 4px 8px;
  }
  
  .platform-icon i {
    font-size: 18px;
  }
  
  .platform-name {
    font-size: 12px;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .media-content {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .media-item img {
    height: 120px;
  }

  .toggle-btn {
    padding: 8px;
  }
  
  .toggle-btn span {
    display: none;
  }
}
</style> 