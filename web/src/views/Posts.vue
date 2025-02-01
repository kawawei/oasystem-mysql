<template>
  <div class="posts">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>貼文列表</h1>
        <div class="header-filters">
          <base-input
            v-model="searchQuery"
            placeholder="搜尋貼文標題"
            size="medium"
            prefixIcon="fas fa-search"
          />
          <div class="view-toggle">
            <base-button 
              type="secondary"
              :class="{ active: viewMode === 'list' }"
              @click="handleViewModeChange('list')"
            >
              <i class="fas fa-list"></i>
              <span>列表</span>
            </base-button>
            <base-button 
              type="secondary"
              :class="{ active: viewMode === 'calendar' }"
              @click="handleViewModeChange('calendar')"
            >
              <i class="fas fa-calendar-alt"></i>
              <span>行事曆</span>
            </base-button>
          </div>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="search-section" v-show="isMobile">
      <base-input
        v-model="searchQuery"
        placeholder="搜尋貼文標題"
        size="medium"
        prefixIcon="fas fa-search"
      />
      <div class="view-toggle">
        <base-button 
          type="secondary"
          :class="{ active: viewMode === 'list' }"
          @click="handleViewModeChange('list')"
        >
          <i class="fas fa-list"></i>
        </base-button>
        <base-button 
          type="secondary"
          :class="{ active: viewMode === 'calendar' }"
          @click="handleViewModeChange('calendar')"
        >
          <i class="fas fa-calendar-alt"></i>
        </base-button>
      </div>
    </div>

    <!-- 月曆視圖 -->
    <div v-if="viewMode === 'calendar'" class="calendar-container">
      <post-calendar 
        :posts="posts" 
        @view="handleView"
      />
    </div>

    <!-- 列表視圖 -->
    <template v-else>
      <div class="card-view" v-show="isMobile">
        <div v-if="loading" class="loading">載入中...</div>
        <template v-else>
          <post-card
            v-for="post in filteredPosts"
            :key="post.id"
            :post="post"
            @view="handleView"
          />
          <base-card v-if="filteredPosts.length === 0" class="no-data-card">
            暫無貼文
          </base-card>
        </template>
      </div>

      <!-- 桌面端表格視圖 -->
      <div v-show="!isMobile">
        <base-table
          :columns="columns"
          :data="filteredPosts"
          :loading="loading"
        >
          <template #title="{ row }">
            <div class="post-title">
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
          
          <template #platform="{ row }">
            <platform-icon :platform="row.platform" />
          </template>
          
          <template #postTime="{ row }">
            {{ formatDateTime(row.postTime) }}
          </template>
          
          <template #creator="{ row }">
            <div class="creator-info" v-if="row.creator">
              <div class="avatar">{{ row.creator.name.charAt(0) }}</div>
              <span>{{ row.creator.name }}</span>
            </div>
            <span v-else>未指定</span>
          </template>
          
          <template #status="{ row }">
            <status-badge :status="row.status" />
          </template>
          
          <template #actions="{ row }">
            <div class="actions">
              <base-button 
                type="primary"
                size="small"
                @click="handleView(row)"
              >
                查看
              </base-button>
            </div>
          </template>
        </base-table>
      </div>
    </template>

    <!-- 查看貼文對話框 -->
    <base-modal
      v-model="showViewDialog"
      title="查看貼文"
      size="medium"
      :show-footer="true"
      :confirm-text="'儲存'"
      :cancel-text="'取消'"
      @close="showViewDialog = false"
      @confirm="handleSave"
    >
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
          <platform-icon :platform="currentPost.platform" />
        </div>
        
        <div class="form-group">
          <label>發文時間</label>
          <div class="text-content">{{ formatDateTime(currentPost.postTime) }}</div>
        </div>
        
        <div class="form-group">
          <label>審核人</label>
          <div class="text-content">{{ currentPost.reviewer?.name || '尚未審核' }}</div>
        </div>
        
        <div class="form-group">
          <base-select
            v-model="currentPost.status"
            :options="statusOptions"
            label="狀態"
          />
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
      </div>
    </base-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { postApi, type Post as ApiPost } from '@/services/api'
import PostCalendar from '@/components/calendar/PostCalendar.vue'
import PostCard from '@/components/post/PostCard.vue'
import BaseButton from '@/common/base/Button.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import PlatformIcon from '@/common/base/PlatformIcon.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseModal from '@/common/base/Modal.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import { message } from '@/plugins/message'

interface Post extends ApiPost {
  creator?: {
    id: number
    name: string
  }
  reviewer?: {
    id: number
    name: string
  }
}

export default defineComponent({
  name: 'Posts',
  components: {
    PostCalendar,
    PostCard,
    BaseButton,
    StatusBadge,
    PlatformIcon,
    BaseInput,
    BaseSelect,
    BaseModal,
    BaseTable,
    BaseCard
  },
  setup() {
    const showViewDialog = ref(false)
    const currentPost = ref<Post | null>(null)
    const isMobile = ref(false)
    const searchQuery = ref('')
    const posts = ref<Post[]>([])
    const loading = ref(false)
    const viewMode = ref<'list' | 'calendar'>('list')

    const statusOptions = [
      { label: '待審核', value: 'pending' },
      { label: '需修改', value: 'revision' },
      { label: '已通過', value: 'approved' }
    ]

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
        message.error('獲取貼文列表失敗')
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
        console.log('Opening modal for post:', id)
      } catch (error) {
        console.error('Error fetching post:', error)
        message.error('獲取貼文詳情失敗')
      }
    }

    // 保存貼文更新
    const handleSave = async () => {
      if (!currentPost.value) return
      
      try {
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : null
        
        await postApi.updatePost(currentPost.value.id, {
          status: currentPost.value.status,
          reviewComment: currentPost.value.reviewComment,
          reviewerId: user?.id
        })
        message.success('更新成功')
        showViewDialog.value = false
        fetchPosts() // 重新獲取貼文列表
      } catch (error) {
        console.error('Error updating post:', error)
        message.error('更新失敗')
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

    // 處理視圖切換
    const handleViewModeChange = (mode: 'list' | 'calendar') => {
      viewMode.value = mode
      console.log('View mode changed to:', mode)
    }

    // 監聽窗口大小變化
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      fetchPosts()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    const columns = [
      { key: 'title', title: '標題' },
      { key: 'platform', title: '發文管道' },
      { key: 'postTime', title: '發文時間', sortable: true },
      { key: 'creator', title: '發文人' },
      { key: 'status', title: '狀態' },
      { key: 'actions', title: '操作' }
    ]

    return {
      columns,
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
      viewMode,
      handleViewModeChange,
      statusOptions
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.posts {
  @include page-container;
}

// 頁面頂部
.header {
  @include page-header;
  
  .header-content {
    @include flex-row;
    justify-content: space-between;
    
    h1 {
      @include header-title;
    }
    
    @include mobile {
      flex-direction: column;
      gap: $spacing-lg;
    }
  }
  
  .header-filters {
    @include flex-row;
    
    @include mobile {
      flex-direction: column;
      width: 100%;
    }
  }
}

// 移動端搜索區域
.search-section {
  @include card;
  @include flex-row;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
}

// 視圖切換按鈕
.view-toggle {
  @include flex-row($spacing-sm);
  margin: 0 $spacing-lg;
  
  :deep(.base-button) {
    @include action-button;
    
    i {
      font-size: $font-size-base;
    }
  }
  
  @include mobile {
    :deep(.base-button) {
      padding: $spacing-sm;
      
      span {
        display: none;
      }
    }
  }
}

// 卡片視圖
.card-view {
  @include flex-col($spacing-lg);
  padding: $spacing-lg;
}

.no-data-card {
  text-align: center;
  color: $text-secondary;
  padding: $spacing-xl;
}

// 貼文詳情
.post-detail {
  .form-group {
    @include form-group;
    
    label {
      @include form-label;
    }
  }

  .text-content {
    @include form-content;
  }

  .media-content {
    @include media-container;
    
    .media-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: $radius-base;
      
      @include mobile {
        height: 120px;
      }
    }
  }

  .no-media {
    @include form-content;
    padding: $spacing-xl;
    text-align: center;
    color: $text-secondary;
  }

  .review-comment {
    @include form-input;
    resize: vertical;
    min-height: 100px;
  }
}

// 日曆容器
.calendar-container {
  @include card;
  padding: $spacing-xl;
  margin-top: $spacing-xl;
  min-height: 500px;
}

// 用戶信息
.creator-info {
  @include flex-row($spacing-xs);
  align-items: center;
  
  .avatar {
    @include avatar(24px);
  }
  
  span {
    color: $text-primary;
    font-size: $font-size-base;
  }
}
</style> 