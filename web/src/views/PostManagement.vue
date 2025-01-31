<template>
  <div class="post-management">
    <div class="header-section">
      <div class="header-left">
        <h1 class="page-title">貼文管理</h1>
        <el-button 
          type="primary" 
          class="create-button" 
          @click="showCreateForm = true"
        >
          <el-icon class="el-icon--left"><Plus /></el-icon>
          新增貼文
        </el-button>
      </div>
    </div>

    <!-- 貼文列表視圖 -->
    <div class="content-section">
      <el-table 
        :data="posts" 
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column prop="title" label="標題" min-width="200">
          <template #default="{ row }">
            <div class="post-title">
              <span class="title-text">{{ row.title }}</span>
              <span class="post-date">{{ formatDate(row.createdAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="發文管道" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getPlatformType(row.platform)"
              class="platform-tag"
            >
              {{ row.platform }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="postTime" label="預計發文時間" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.postTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="120">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status">
              {{ getStatusText(row.status) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reviewer" label="審核人" width="120">
          <template #default="{ row }">
            <div class="reviewer-info" v-if="row.reviewer">
              <el-avatar :size="24" class="reviewer-avatar">
                {{ row.reviewer.name.charAt(0) }}
              </el-avatar>
              <span>{{ row.reviewer.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                class="action-button btn-view"
                type="primary"
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-button 
                class="action-button btn-delete"
                type="danger"
                @click="handleDelete(row)"
              >
                刪除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增貼文對話框 -->
    <el-dialog
      v-model="showCreateForm"
      title="新增貼文"
      width="70%"
      class="custom-dialog"
      :before-close="handleCloseDialog"
    >
      <post-form
        ref="postFormRef"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </el-dialog>

    <!-- 查看貼文對話框 -->
    <el-dialog
      v-model="showViewDialog"
      title="查看貼文"
      width="70%"
      class="custom-dialog"
    >
      <el-form 
        ref="viewFormRef"
        :model="currentPost"
        label-position="top"
        class="custom-form"
        v-if="currentPost"
      >
        <el-form-item label="標題">
          <el-input v-model="currentPost.title" />
        </el-form-item>
        
        <el-form-item label="內容">
          <el-input 
            v-model="currentPost.content" 
            type="textarea" 
            rows="4"
          />
        </el-form-item>
        
        <el-form-item label="媒體內容">
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
        </el-form-item>
        
        <el-form-item label="發文管道">
          <el-select v-model="currentPost.platform">
            <el-option label="Facebook" value="facebook" />
            <el-option label="Instagram" value="instagram" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="預計發文時間">
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
        </el-form-item>
        
        <el-form-item label="狀態">
          <el-select v-model="currentPost.status">
            <el-option label="待審核" value="pending" />
            <el-option label="需修改" value="revision" />
            <el-option label="已通過" value="approved" />
            <el-option label="已發布" value="published" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="審核意見" v-if="currentPost.status === 'revision'">
          <el-input 
            v-model="currentPost.reviewComment" 
            type="textarea" 
            rows="4"
            placeholder="請輸入審核意見"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showViewDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateStatus">確認</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import PostForm from '@/components/post/PostForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { postApi, type Post } from '@/services/api'
import dayjs from 'dayjs'

const showCreateForm = ref(false)
const loading = ref(false)
const postFormRef = ref()
const posts = ref<Post[]>([])
const showViewDialog = ref(false)
const currentPost = ref<Post | null>(null)
const postDate = ref('')
const postTime = ref('')

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

// 獲取平台對應的類型
const getPlatformType = (platform: string) => {
  const platformMap: Record<string, string> = {
    facebook: '',
    instagram: 'info'
  }
  return platformMap[platform] || 'info'
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
const handleView = async (row: Post) => {
  try {
    const response = await postApi.getPost(row.id)
    currentPost.value = response.data
    showViewDialog.value = true
  } catch (error) {
    console.error('Error fetching post:', error)
    ElMessage.error('獲取貼文詳情失敗')
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
const handleUpdateStatus = async () => {
  if (!currentPost.value) return
  
  try {
    await postApi.updatePost(currentPost.value.id, {
      title: currentPost.value.title,
      content: currentPost.value.content,
      platform: currentPost.value.platform,
      postDate: postDate.value,
      postTime: postTime.value,
      reviewerId: currentPost.value.reviewerId,
      mediaFiles: currentPost.value.mediaFiles,
      status: currentPost.value.status,
      reviewComment: currentPost.value.reviewComment
    })
    
    ElMessage.success('貼文更新成功')
    showViewDialog.value = false
    fetchPosts()
  } catch (error) {
    console.error('Error updating post:', error)
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

// 在組件掛載時獲取貼文列表
onMounted(() => {
  fetchPosts()
  if (currentPost.value?.postTime) {
    const dt = dayjs(currentPost.value.postTime)
    postDate.value = dt.format('YYYY-MM-DD')
    postTime.value = dt.format('HH:mm')
  }
})

// 監聽當前貼文的變化
watch(() => currentPost.value?.postTime, (newPostTime) => {
  if (newPostTime) {
    const dt = dayjs(newPostTime)
    postDate.value = dt.format('YYYY-MM-DD')
    postTime.value = dt.format('HH:mm')
  }
})
</script>

<style scoped>
.post-management {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-table {
  --el-table-border-color: #e5e5e5;
  --el-table-header-bg-color: #f5f5f7;
  --el-table-row-hover-bg-color: #f9f9f9;
}

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

.platform-tag {
  text-transform: capitalize;
}

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

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-avatar {
  background-color: #1677ff;
  color: #ffffff;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
}

.custom-dialog {
  :deep(.el-dialog__body) {
    padding: 24px;
  }
}

.custom-form {
  --el-text-color-regular: #1d1d1f;
}

.time-inputs {
  display: flex;
  gap: 16px;
}

.custom-date-picker,
.custom-time-picker {
  width: 100%;
}

.upload-media {
  :deep(.el-upload--picture-card) {
    width: 148px;
    height: 148px;
    margin: 0 8px 8px 0;
  }
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

:deep(.el-upload__tip) {
  color: #8e8e93;
}
</style> 