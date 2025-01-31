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
              <span class="post-date">{{ row.createdAt }}</span>
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
        <el-table-column prop="postTime" label="預計發文時間" width="180" />
        <el-table-column prop="status" label="狀態" width="120">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status">
              {{ getStatusText(row.status) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reviewer" label="審核人" width="120">
          <template #default="{ row }">
            <div class="reviewer-info">
              <el-avatar :size="24" class="reviewer-avatar">
                {{ row.reviewer?.charAt(0) }}
              </el-avatar>
              <span>{{ row.reviewer }}</span>
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
            action="/api/upload"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
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
              v-model="currentPost.postDate"
              type="date"
              placeholder="選擇發文日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="custom-date-picker"
            />
            <el-time-picker
              v-model="currentPost.postTime"
              placeholder="選擇發文時間"
              format="HH:mm"
              value-format="HH:mm"
              class="custom-time-picker"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="狀態">
          <el-select v-model="currentPost.status" disabled>
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
import { ref, onMounted } from 'vue'
import PostForm from '@/components/post/PostForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

interface Post {
  id: number
  title: string
  content: string
  platform: string
  postDate: string
  postTime: string
  status: string
  reviewer: string
  createdAt: string
  reviewComment?: string
}

const showCreateForm = ref(false)
const loading = ref(false)
const postFormRef = ref()
const posts = ref<Post[]>([])
const showViewDialog = ref(false)
const currentPost = ref<Post | null>(null)

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

// 處理表單提交
const handleSubmit = async (formData: any) => {
  try {
    loading.value = true
    // TODO: 調用API保存貼文
    console.log('提交的表單數據：', formData)
    ElMessage.success('貼文創建成功')
    showCreateForm.value = false
    // TODO: 重新加載貼文列表
  } catch (error) {
    ElMessage.error('創建失敗，請稍後重試')
  } finally {
    loading.value = false
  }
}

// 處理取消
const handleCancel = () => {
  showCreateForm.value = false
}

// 處理關閉對話框
const handleCloseDialog = (done: () => void) => {
  ElMessageBox.confirm('確定要關閉嗎？未保存的內容將會丟失')
    .then(() => {
      done()
    })
    .catch(() => {})
}

// 處理查看
const handleView = (row: Post) => {
  currentPost.value = row
  showViewDialog.value = true
}

// 處理刪除
const handleDelete = (row: any) => {
  ElMessageBox.confirm('確定要刪除這篇貼文嗎？', '警告', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 調用API刪除貼文
      console.log('刪除貼文：', row.id)
      ElMessage.success('刪除成功')
      // TODO: 重新加載貼文列表
    } catch {
      ElMessage.error('刪除失敗，請稍後重試')
    }
  })
}

// 處理狀態更新
const handleUpdateStatus = async () => {
  try {
    if (!currentPost.value) return
    
    // 組合日期和時間
    const postDateTime = `${currentPost.value.postDate} ${currentPost.value.postTime}`
    
    // TODO: 調用API更新貼文狀態
    console.log('更新貼文：', {
      ...currentPost.value,
      postTime: postDateTime
    })
    
    ElMessage.success('更新成功')
    showViewDialog.value = false
    // TODO: 重新加載貼文列表
  } catch (error) {
    ElMessage.error('更新失敗，請稍後重試')
  }
}

// 處理文件預覽
const handlePreview = (file: any) => {
  console.log('預覽文件：', file)
}

// 處理文件移除
const handleRemove = (file: any) => {
  console.log('移除文件：', file)
}

// 上傳前檢查
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type === 'video/mp4'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage && !isVideo) {
    ElMessage.error('只能上傳圖片或MP4影片檔案！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('檔案大小不能超過 10MB！')
    return false
  }
  return true
}

// 初始化加載數據
onMounted(async () => {
  // 模擬數據
  posts.value = [
    {
      id: 1,
      title: '測試貼文 1',
      content: '這是一篇測試貼文',
      platform: 'facebook',
      postDate: '2024-03-15',
      postTime: '2024-03-15 10:00:00',
      status: 'pending',
      reviewer: '王小明',
      createdAt: '2024-03-14 15:30:00'
    },
    {
      id: 2,
      title: '測試貼文 2',
      content: '這是另一篇測試貼文',
      platform: 'instagram',
      postDate: '2024-03-16',
      postTime: '2024-03-16 14:30:00',
      status: 'approved',
      reviewer: '李小華',
      createdAt: '2024-03-14 16:45:00'
    }
  ]
})
</script>

<style scoped>
.post-management {
  padding: 16px 24px;
  background-color: #f5f5f7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f5f5f7;
  padding: 8px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  line-height: 1.2;
  display: block;
}

.content-section {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  padding: 24px;
  flex: 1;
  overflow: auto;
}

.create-button {
  background: #0071e3;
  border: none;
  border-radius: 980px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #0077ed;
    transform: scale(1.02);
  }
}

.post-title {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-weight: 500;
  color: #1d1d1f;
}

.post-date {
  font-size: 12px;
  color: #86868b;
  margin-top: 4px;
}

.platform-tag {
  border-radius: 980px;
  padding: 4px 12px;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 980px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff7e6;
  color: #d48806;
}

.status-badge.revision {
  background: #fff1f0;
  color: #cf1322;
}

.status-badge.approved {
  background: #f6ffed;
  color: #389e0d;
}

.status-badge.published {
  background: #f5f5f7;
  color: #1d1d1f;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-avatar {
  background: #0071e3;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  min-width: 140px;
}

.action-button {
  flex: 1;
  min-width: 60px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  &:hover {
    opacity: 0.8;
  }

  &.el-button--primary {
    background: var(--color-primary);
    color: white;
  }

  &.el-button--danger {
    background: #dc2626;
    color: white;
  }

  :deep(.el-icon) {
    margin-right: 0;
  }
}

.custom-dialog {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 24px;
  border-bottom: 1px solid #f5f5f7;
}

:deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 24px;
  border-top: 1px solid #f5f5f7;
}

.view-post-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    color: #86868b;
  }

  div {
    font-size: 16px;
    color: #1d1d1f;
  }
}

.custom-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 8px;
    font-weight: 500;
    color: #1d1d1f;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select) {
    box-shadow: none !important;
    background-color: #f5f5f7;
    border-radius: 8px;
  }

  :deep(.el-input__wrapper.is-disabled),
  :deep(.el-textarea__inner:disabled) {
    background-color: #f5f5f7;
    color: #1d1d1f;
  }

  :deep(.el-select .el-input__wrapper) {
    background-color: transparent;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid #f5f5f7;
}

.time-inputs {
  display: flex;
  gap: 16px;

  .custom-date-picker,
  .custom-time-picker {
    flex: 1;
  }
}

.upload-media {
  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    border: 1px dashed #d9d9d9;
    background: #fafafa;
  }

  :deep(.el-upload-list--picture-card) {
    --el-upload-list-picture-card-size: 120px;
    
    .el-upload-list__item {
      border-radius: 8px;
    }
  }
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #86868b;
  
  .upload-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  span {
    font-size: 12px;
  }
}

:deep(.el-upload__tip) {
  font-size: 12px;
  color: #86868b;
  margin-top: 8px;
}
</style> 