<template>
  <div class="post-management">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>貼文管理</h1>
        <div class="header-filters">
          <base-input 
            v-model="searchQuery"
            placeholder="搜尋貼文標題"
            prefixIcon="fas fa-search"
          />
          <div class="view-toggle">
            <base-button 
              :type="viewMode === 'list' ? 'primary' : 'secondary'"
              @click="viewMode = 'list'"
            >
              <i class="fas fa-list"></i>
              <span>列表</span>
            </base-button>
            <base-button 
              :type="viewMode === 'calendar' ? 'primary' : 'secondary'"
              @click="viewMode = 'calendar'"
            >
              <i class="fas fa-calendar-alt"></i>
              <span>行事曆</span>
            </base-button>
          </div>
          <base-button 
            type="primary"
            @click="showCreateForm = true"
          >
            <i class="fas fa-plus"></i>
            <span>新增貼文</span>
          </base-button>
        </div>
      </div>
    </header>

    <!-- 移動端頂部 -->
    <div class="search-section" v-show="isMobile">
      <base-input 
        v-model="searchQuery"
        placeholder="搜尋貼文標題"
        prefixIcon="fas fa-search"
      />
      <div class="view-toggle">
        <base-button 
          :type="viewMode === 'list' ? 'primary' : 'secondary'"
          @click="viewMode = 'list'"
        >
          <i class="fas fa-list"></i>
        </base-button>
        <base-button 
          :type="viewMode === 'calendar' ? 'primary' : 'secondary'"
          @click="viewMode = 'calendar'"
        >
          <i class="fas fa-calendar-alt"></i>
        </base-button>
      </div>
      <base-button 
        type="primary"
        @click="showCreateForm = true"
      >
        <i class="fas fa-plus"></i>
      </base-button>
    </div>

    <!-- 行事曆視圖 -->
    <div v-if="viewMode === 'calendar'">
      <post-calendar :posts="posts" @view="handleView" />
    </div>

    <!-- 列表視圖（原有的表格和卡片視圖） -->
    <template v-else>
      <!-- 移動端卡片視圖 -->
      <div class="card-view" v-show="isMobile">
        <post-card
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          @view="handleView"
        />
        <base-card v-if="filteredPosts.length === 0" class="no-data-card">
          暫無貼文
        </base-card>
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
              <span class="post-date">{{ formatDate(row.createdAt) }}</span>
            </div>
          </template>
          
          <template #platform="{ row }">
            <platform-icon :platform="row.platform" />
          </template>
          
          <template #postTime="{ row }">
            {{ formatDateTime(row.postTime) }}
          </template>
          
          <template #status="{ row }">
            <status-badge :status="row.status" />
          </template>
          
          <template #reviewer="{ row }">
            <div class="reviewer-info" v-if="row.reviewer">
              <el-avatar :size="24" class="reviewer-avatar">
                {{ row.reviewer.name.charAt(0) }}
              </el-avatar>
              <span>{{ row.reviewer.name }}</span>
            </div>
            <span v-else>-</span>
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
              <base-button 
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                刪除
              </base-button>
            </div>
          </template>
        </base-table>
      </div>
    </template>

    <!-- 新增貼文對話框 -->
    <base-modal
      v-model="showCreateForm"
      title="新增貼文"
      :show-footer="false"
    >
      <post-form
        ref="postFormRef"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </base-modal>

    <!-- 查看貼文對話框 -->
    <base-modal
      v-model="showViewDialog"
      title="查看貼文"
      :confirm-text="'儲存'"
      :cancel-text="'取消'"
      @confirm="handleUpdateStatus"
    >
      <form 
        class="custom-form"
        v-if="currentPost"
      >
        <div class="form-group">
          <base-input
            v-model="currentPost.title"
            label="標題"
          />
        </div>
        
        <div class="form-group">
          <label>內容</label>
          <textarea 
            v-model="currentPost.content" 
            rows="4"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>媒體內容</label>
          <el-upload
            class="upload-media"
            action="/api/posts/upload"
            :headers="uploadHeaders"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            multiple
            :limit="5"
            list-type="picture-card"
          >
            <div class="upload-trigger">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <span>上傳檔案</span>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支援 jpg/png 圖片檔案或 mp4 影片檔案，檔案大小不超過 10MB
              </div>
            </template>
          </el-upload>
        </div>
        
        <div class="form-group">
          <base-select
            v-model="currentPost.platform"
            label="發文管道"
            :options="[
              { label: 'Facebook', value: 'facebook' },
              { label: 'Instagram', value: 'instagram' },
              { label: 'LINE', value: 'line' }
            ]"
          />
        </div>
        
        <div class="form-group time-inputs">
          <el-date-picker
            v-model="postDate"
            type="date"
            placeholder="選擇發文日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="custom-date-picker"
          />
          <el-time-picker
            v-model="postTime"
            placeholder="選擇發文時間"
            format="HH:mm"
            value-format="HH:mm"
            class="custom-time-picker"
          />
        </div>
        
        <div class="form-group">
          <label>狀態</label>
          <div class="status-section">
            <status-badge :status="currentPost.status" />
            <div v-if="currentPost.status === 'approved' || currentPost.status === 'published'" class="publish-checkbox">
              <input 
                type="checkbox" 
                v-model="isPublished"
                id="publishCheckbox"
              >
              <label for="publishCheckbox">已發佈</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>審核意見</label>
          <div class="review-comment-readonly">
            {{ currentPost.reviewComment || '無審核意見' }}
          </div>
        </div>
      </form>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import PostForm from '@/components/post/PostForm.vue'
import PostCalendar from '@/components/calendar/PostCalendar.vue'
import { ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { postApi } from '@/services/api'
import type { Post } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import isoWeek from 'dayjs/plugin/isoWeek'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseTable from '@/common/base/Table.vue'
import BaseCard from '@/common/base/Card.vue'
import PostCard from '@/components/post/PostCard.vue'
import PlatformIcon from '@/common/base/PlatformIcon.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import { message } from '@/plugins/message'
import BaseModal from '@/common/base/Modal.vue'
import BaseSelect from '@/common/base/Select.vue'

dayjs.extend(isoWeek)
dayjs.locale('zh-tw')

const showCreateForm = ref(false)
const loading = ref(false)
const postFormRef = ref()
const posts = ref<Post[]>([])
const showViewDialog = ref(false)
const currentPost = ref<Post | null>(null)
const postDate = ref('')
const postTime = ref('')
const isMobile = ref(false)
const searchQuery = ref('')
const viewMode = ref('list')

// 上傳文件的請求頭
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${window.localStorage.getItem('token')}`
}))

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化日期時間
const formatDateTime = (datetime: string) => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

// 獲取貼文列表
const fetchPosts = async () => {
  try {
    loading.value = true
    const response = await postApi.getPosts()
    posts.value = response.data
  } catch (error) {
    console.error('Error fetching posts:', error)
    message.error('獲取貼文列表失敗')
  } finally {
    loading.value = false
  }
}

// 處理表單提交
const handleSubmit = async (formData: any) => {
  loading.value = true
  try {
    await postApi.createPost(formData)
    message.success('貼文創建成功')
    showCreateForm.value = false
    fetchPosts()
  } catch (error) {
    console.error('Error creating post:', error)
    message.error('貼文創建失敗')
  } finally {
    loading.value = false
  }
}

// 處理取消
const handleCancel = () => {
  showCreateForm.value = false
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
    message.error('獲取貼文詳情失敗')
  }
}

// 處理刪除貼文
const handleDelete = async (post: Post) => {
  try {
    await ElMessageBox.confirm('確定要刪除這篇貼文嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await postApi.deletePost(post.id)
    message.success('貼文刪除成功')
    fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting post:', error)
      message.error('貼文刪除失敗')
    }
  }
}

// 處理更新貼文狀態
const handleUpdateStatus = async () => {
  if (!currentPost.value) {
    message.warning('無效的貼文數據')
    return
  }
  
  try {
    if (!postDate.value || !postTime.value) {
      message.warning('請選擇發文日期和時間')
      return
    }

    // 驗證平台
    if (!validatePlatform(currentPost.value.platform)) {
      message.warning('無效的發文平台')
      return
    }
    
    // 合併日期和時間
    const localDateTime = `${postDate.value} ${postTime.value}`
    const dt = dayjs(localDateTime)
    
    // 準備更新的數據
    const updateData = {
      title: currentPost.value.title,
      content: currentPost.value.content,
      platform: currentPost.value.platform.toLowerCase(),
      status: currentPost.value.status,
      reviewComment: currentPost.value.reviewComment || '',
      postTime: dt.format('YYYY-MM-DD HH:mm:ss'),
      mediaFiles: currentPost.value.mediaFiles || []
    }

    await postApi.updatePost(currentPost.value.id, updateData)
    message.success('貼文更新成功')
    showViewDialog.value = false
    fetchPosts()
  } catch (error) {
    console.error('Error updating post:', error)
    message.error('更新失敗，請稍後重試')
  }
}

// 處理文件預覽
const handlePreview = (file: any) => {
  console.log(file)
}

// 處理文件移除
const handleRemove = async (file: any) => {
  try {
    if (file.response?.filename) {
      await postApi.deleteFile(file.response.filename)
      message.success('文件刪除成功')
    }
  } catch (error) {
    console.error('Error removing file:', error)
    message.error('文件刪除失敗')
  }
}

// 處理文件上傳成功
const handleUploadSuccess = (response: any) => {
  if (currentPost.value && response.filename) {
    currentPost.value.mediaFiles = [...(currentPost.value.mediaFiles || []), response.filename]
  }
}

// 處理文件上傳前的驗證
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type === 'video/mp4'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage && !isVideo) {
    message.error('只能上傳圖片或MP4影片檔案')
    return false
  }
  if (!isLt10M) {
    message.error('檔案大小不能超過 10MB')
    return false
  }
  return true
}

// 檢查是否為移動端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
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
  if (currentPost.value?.postTime) {
    const dt = dayjs(currentPost.value.postTime)
    postDate.value = dt.format('YYYY-MM-DD')
    postTime.value = dt.format('HH:mm')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 監聽當前貼文的變化
watch(() => currentPost.value?.postTime, (newPostTime) => {
  if (newPostTime) {
    console.log('New Post Time:', newPostTime) // 添加日誌
    const dt = dayjs(newPostTime)
    postDate.value = dt.format('YYYY-MM-DD')
    postTime.value = dt.format('HH:mm')
    console.log('Set Date:', postDate.value) // 添加日誌
    console.log('Set Time:', postTime.value) // 添加日誌
  }
}, { immediate: true })

// 處理發佈狀態變更
const isPublished = computed({
  get: () => currentPost.value?.status === 'published',
  set: (value: boolean) => {
    if (currentPost.value) {
      currentPost.value.status = value ? 'published' : 'approved';
    }
  }
});

// 在 script setup 部分，添加平台驗證
const validatePlatform = (platform: string) => {
  const validPlatforms = ['facebook', 'instagram', 'line']
  return validPlatforms.includes(platform)
}

// 表格列定義
const columns = [
  { key: 'title', title: '標題' },
  { key: 'platform', title: '發文管道' },
  { key: 'postTime', title: '發文時間', sortable: true },
  { key: 'status', title: '狀態' },
  { key: 'reviewer', title: '審核人' },
  { key: 'actions', title: '操作' }
]
</script>

<style lang="scss" scoped>
@import '@/styles/views/post-management.scss';
</style> 