<template>
  <div class="post-management">
    <!-- 桌面端頂部 -->
    <header class="header" v-show="!isMobile">
      <div class="header-content">
        <h1>貼文管理</h1>
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
          <button class="btn-add" @click="showCreateForm = true">
            + 新增貼文
          </button>
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
      <button class="btn-add" @click="showCreateForm = true">
        + 新增貼文
      </button>
    </div>

    <!-- 行事曆視圖 -->
    <div v-if="viewMode === 'calendar'">
      <calendar :posts="posts" @view="handleView" />
    </div>

    <!-- 列表視圖（原有的表格和卡片視圖） -->
    <template v-else>
      <!-- 移動端卡片視圖 -->
      <div class="card-view" v-show="isMobile">
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
              <span class="label">狀態：</span>
              <span class="value status-badge" :class="post.status">
                {{ getStatusText(post.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">審核人：</span>
              <span class="value reviewer-info" v-if="post.reviewer">
                <el-avatar :size="24" class="reviewer-avatar">
                  {{ post.reviewer.name.charAt(0) }}
                </el-avatar>
                <span>{{ post.reviewer.name }}</span>
              </span>
            </div>
          </div>
          <div class="card-actions">
            <button @click="handleView(post)" class="btn-edit">
              查看
            </button>
            <button @click="handleDelete(post)" class="btn-remove">
              刪除
            </button>
          </div>
        </div>
        <div v-if="filteredPosts.length === 0" class="no-data-card">
          暫無貼文
        </div>
      </div>

      <!-- 桌面端表格視圖 -->
      <div class="table-container" v-show="!isMobile">
        <table class="data-table">
          <thead>
            <tr>
              <th>標題</th>
              <th>發文管道</th>
              <th>發文時間</th>
              <th>狀態</th>
              <th>審核人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
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
              <td>
                <div class="status-badge" :class="post.status">
                  {{ getStatusText(post.status) }}
                </div>
              </td>
              <td>
                <div class="reviewer-info" v-if="post.reviewer">
                  <el-avatar :size="24" class="reviewer-avatar">
                    {{ post.reviewer.name.charAt(0) }}
                  </el-avatar>
                  <span>{{ post.reviewer.name }}</span>
                </div>
              </td>
              <td class="actions">
                <button @click="handleView(post)" class="btn-edit">
                  查看
                </button>
                <button @click="handleDelete(post)" class="btn-remove">
                  刪除
                </button>
              </td>
            </tr>
            <tr v-if="filteredPosts.length === 0">
              <td colspan="6" class="no-data">暫無貼文</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 新增貼文對話框 -->
    <div v-if="showCreateForm" class="modal" @click.self="handleCloseDialog">
      <div class="modal-content">
        <h2>新增貼文</h2>
        <post-form
          ref="postFormRef"
          :loading="loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <!-- 查看貼文對話框 -->
    <div v-if="showViewDialog" class="modal" @click.self="showViewDialog = false">
      <div class="modal-content">
        <h2>查看貼文</h2>
        <form 
          @submit.prevent="handleUpdateStatus"
          class="custom-form"
          v-if="currentPost"
        >
          <div class="form-group">
            <label>標題</label>
            <input type="text" v-model="currentPost.title" />
          </div>
          
          <div class="form-group">
            <label>內容</label>
            <textarea 
              v-model="currentPost.content" 
              rows="4"
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
            <label>發文管道</label>
            <select v-model="currentPost.platform">
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>預計發文時間</label>
            <div class="time-inputs">
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
          </div>
          
          <div class="form-group">
            <label>狀態</label>
            <div class="status-section">
              <div class="status-badge" :class="currentPost.status">
                {{ getStatusText(currentPost.status) }}
              </div>
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

          <div class="modal-actions">
            <button type="button" @click="showViewDialog = false" class="btn-cancel">
              取消
            </button>
            <button type="button" @click="handleUpdateStatus" class="btn-save">
              確認
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import PostForm from '@/components/post/PostForm.vue'
import Calendar from '@/components/calendar/Calendar.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { postApi } from '@/services/api'
import type { Post } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import isoWeek from 'dayjs/plugin/isoWeek'

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

// 獲取貼文列表
const fetchPosts = async () => {
  try {
    const response = await postApi.getPosts()
    posts.value = response.data
  } catch (error) {
    console.error('Error fetching posts:', error)
    ElMessage.error('獲取貼文列表失敗')
  }
}

// 處理表單提交
const handleSubmit = async (formData: any) => {
  loading.value = true
  try {
    await postApi.createPost(formData)
    ElMessage.success('貼文創建成功')
    showCreateForm.value = false
    fetchPosts()
  } catch (error) {
    console.error('Error creating post:', error)
    ElMessage.error('貼文創建失敗')
  } finally {
    loading.value = false
  }
}

// 處理取消
const handleCancel = () => {
  showCreateForm.value = false
}

// 處理關閉對話框
const handleCloseDialog = () => {
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

    const response = await postApi.getPost(id);
    currentPost.value = response.data;
    
    // 設置日期和時間
    if (response.data.postTime) {
      const dt = dayjs(response.data.postTime);
      postDate.value = dt.format('YYYY-MM-DD');
      postTime.value = dt.format('HH:mm');
    }
    
    showViewDialog.value = true;
  } catch (error) {
    console.error('Error fetching post:', error);
    ElMessage.error('獲取貼文詳情失敗');
  }
}

// 處理刪除貼文
const handleDelete = async (row: Post) => {
  try {
    await ElMessageBox.confirm('確定要刪除這篇貼文嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await postApi.deletePost(row.id)
    ElMessage.success('貼文刪除成功')
    fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting post:', error)
      ElMessage.error('貼文刪除失敗')
    }
  }
}

// 處理更新貼文狀態
const handleUpdateStatus = async (e?: Event) => {
  if (e) {
    e.preventDefault() // 防止表單默認提交
  }
  console.log('handleUpdateStatus called') // 添加日誌
  
  if (!currentPost.value) {
    console.error('No current post selected')
    return
  }
  
  try {
    if (!postDate.value || !postTime.value) {
      ElMessage.error('請選擇發文日期和時間')
      return
    }
    
    // 合併日期和時間，並調整時區
    const localDateTime = `${postDate.value} ${postTime.value}`
    console.log('Local DateTime:', localDateTime)
    const dt = dayjs(localDateTime).subtract(8, 'hour')
    const utcDate = dt.format('YYYY-MM-DD')
    const utcTime = dt.format('HH:mm:ss')
    console.log('UTC Date:', utcDate)
    console.log('UTC Time:', utcTime)
    
    const updateData = {
      title: currentPost.value.title,
      content: currentPost.value.content,
      platform: currentPost.value.platform,
      status: currentPost.value.status,
      reviewComment: currentPost.value.reviewComment || '',
      postDate: utcDate,
      postTime: utcTime
    }
    console.log('Update Data:', updateData)
    console.log('Post ID:', currentPost.value.id)
    
    try {
      console.log('Sending update request...') // 添加日誌
      const token = localStorage.getItem('token')
      console.log('Token:', token ? 'exists' : 'missing') // 檢查令牌
      const response = await postApi.updatePost(currentPost.value.id, updateData)
      console.log('Update Response:', response)
      ElMessage.success('貼文更新成功')
      showViewDialog.value = false
      fetchPosts()
    } catch (error: any) {
      console.error('API Error:', error)
      console.error('API Error Response:', error.response)
      console.error('API Error Stack:', error.stack)
      ElMessage.error(`貼文更新失敗: ${error.response?.data?.message || error.message}`)
    }
  } catch (error) {
    console.error('Error in handleUpdateStatus:', error)
    if (error instanceof Error) {
      console.error('Error Stack:', error.stack)
    }
    ElMessage.error('貼文更新失敗')
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
      ElMessage.success('文件刪除成功')
    }
  } catch (error) {
    console.error('Error removing file:', error)
    ElMessage.error('文件刪除失敗')
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
    ElMessage.error('只能上傳圖片或MP4影片檔案')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('檔案大小不能超過 10MB')
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
</script>

<style scoped>
.post-management {
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

.btn-add {
  background: #0071e3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add:hover {
  background: #0077ed;
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

.btn-edit,
.btn-remove {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  font-weight: 500;
  min-width: 80px;
}

.btn-edit {
  background: #0071e3;
  color: white;
}

.btn-edit:hover {
  background: #0077ed;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-remove {
  background: #ff3b30;
  color: white;
}

.btn-remove:hover {
  background: #ff453a;
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

/* 審核人信息樣式 */
.reviewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-avatar {
  background-color: #1677ff;
  color: #ffffff;
}

/* 平台標籤樣式 */
.platform-tag {
  text-transform: capitalize;
  font-size: 12px;
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

@media (max-width: 768px) {
  .post-management {
    padding: 16px;
  }

  .search-input {
    width: 100%;
  }

  .btn-add {
    white-space: nowrap;
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #0071e3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.1);
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f7;
}

.btn-cancel,
.btn-save,
.btn-confirm {
  padding: 8px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

.btn-cancel {
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
}

.btn-cancel:hover {
  background: #e5e5ea;
}

.btn-save,
.btn-confirm {
  background: #0071e3;
  color: white;
  border: none;
}

.btn-save:hover,
.btn-confirm:hover {
  background: #0077ed;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 上傳區域樣式 */
.upload-media {
  border: 2px dashed #d1d1d6;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
}

.upload-media:hover {
  border-color: #0071e3;
  background: rgba(0, 113, 227, 0.05);
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #86868b;
}

.upload-icon {
  font-size: 24px;
  color: #0071e3;
}

.el-upload__tip {
  margin-top: 8px;
  color: #86868b;
  font-size: 14px;
}

/* 時間選擇器樣式 */
.time-inputs {
  display: flex;
  gap: 16px;
}

.custom-date-picker,
.custom-time-picker {
  flex: 1;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn-cancel,
  .btn-save,
  .btn-confirm {
    width: 100%;
  }

  .time-inputs {
    flex-direction: column;
  }
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}

.publish-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.publish-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.publish-checkbox label {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  margin: 0;
}

.review-comment-readonly {
  width: 100%;
  padding: 12px 16px;
  background: #f5f5f7;
  border-radius: 8px;
  font-size: 14px;
  color: #1d1d1f;
  line-height: 1.5;
  min-height: 60px;
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

@media (max-width: 768px) {
  .toggle-btn {
    padding: 8px;
  }
  
  .toggle-btn span {
    display: none;
  }
}

.calendar-view {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  min-height: 500px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.calendar-nav-btn {
  background: none;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: #1d1d1f;
  transition: all 0.3s;
}

.calendar-nav-btn:hover {
  background: #f5f5f7;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #86868b;
  padding: 8px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #d1d1d6;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  overflow: hidden;
}

.day-cell {
  background: white;
  min-height: 100px;
  padding: 8px;
  position: relative;
}

.day-number {
  font-size: 14px;
  color: #1d1d1f;
}

.other-month {
  background: #f5f5f7;
  
  .day-number {
    color: #86868b;
  }
}

.today {
  .day-number {
    background: #0071e3;
    color: white;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
}

.has-posts {
  .post-indicator {
    width: 6px;
    height: 6px;
    background: #0071e3;
    border-radius: 50%;
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

.day-content {
  margin-top: 4px;
}

@media (max-width: 768px) {
  .day-cell {
    min-height: 60px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
  }
}
</style> 