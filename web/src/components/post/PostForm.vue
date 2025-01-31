<template>
  <div class="post-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
      class="custom-form"
    >
      <el-form-item label="標題" prop="title">
        <el-input 
          v-model="formData.title" 
          placeholder="請輸入貼文標題"
          class="custom-input"
        />
      </el-form-item>

      <el-form-item label="文案內容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="6"
          placeholder="請輸入貼文內容"
          class="custom-textarea"
        />
      </el-form-item>

      <el-form-item label="發文管道" prop="platform">
        <el-select 
          v-model="formData.platform" 
          placeholder="請選擇發文管道"
          class="custom-select"
        >
          <el-option label="Facebook" value="facebook" />
          <el-option label="Instagram" value="instagram" />
        </el-select>
      </el-form-item>

      <el-form-item label="發文時間" prop="postTime" class="post-time-group">
        <div class="time-inputs">
          <el-form-item prop="postDate" class="time-item">
            <el-date-picker
              v-model="formData.postDate"
              type="date"
              placeholder="選擇發文日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="custom-date-picker"
            />
          </el-form-item>
          <el-form-item prop="postTime" class="time-item">
            <el-time-picker
              v-model="formData.postTime"
              placeholder="選擇發文時間"
              format="HH:mm"
              value-format="HH:mm"
              class="custom-time-picker"
            />
          </el-form-item>
        </div>
      </el-form-item>

      <el-form-item label="審核人" prop="reviewerId">
        <el-select 
          v-model="formData.reviewerId" 
          placeholder="請選擇審核人"
          class="custom-select"
        >
          <el-option
            v-for="reviewer in reviewers"
            :key="reviewer.id"
            :label="reviewer.name"
            :value="reviewer.id"
          >
            <div class="reviewer-option">
              <el-avatar :size="24" class="reviewer-avatar">
                {{ reviewer.name.charAt(0) }}
              </el-avatar>
              <span>{{ reviewer.name }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="媒體檔案" class="media-upload-item">
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

      <el-form-item class="form-actions">
        <el-button 
          type="primary" 
          @click="submitForm" 
          :loading="loading"
          class="submit-button"
        >
          提交
        </el-button>
        <el-button 
          @click="$emit('cancel')"
          class="cancel-button"
        >
          取消
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi, type User } from '@/services/api'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref<FormInstance>()
const formData = reactive({
  title: '',
  content: '',
  platform: '',
  postDate: '',
  postTime: '',
  reviewerId: null as number | null,
  mediaFiles: [] as string[]
})

// 審核人列表
const reviewers = ref<User[]>([])

// 獲取審核人列表
const fetchReviewers = async () => {
  try {
    const response = await userApi.getUsers()
    reviewers.value = response.data
  } catch (error) {
    console.error('Error fetching reviewers:', error)
    ElMessage.error('獲取審核人列表失敗')
  }
}

const rules: FormRules = {
  title: [
    { required: true, message: '請輸入標題', trigger: 'blur' },
    { min: 2, max: 100, message: '長度在 2 到 100 個字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '請輸入文案內容', trigger: 'blur' }
  ],
  platform: [
    { required: true, message: '請選擇發文管道', trigger: 'change' }
  ],
  postDate: [
    { required: true, message: '請選擇發文日期', trigger: 'change' }
  ],
  postTime: [
    { required: true, message: '請選擇發文時間', trigger: 'change' }
  ],
  reviewerId: [
    { required: true, message: '請選擇審核人', trigger: 'change' }
  ]
}

// 提交表單
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', {
        title: formData.title,
        content: formData.content,
        platform: formData.platform,
        postDate: formData.postDate,
        postTime: formData.postTime,
        reviewerId: formData.reviewerId,
        mediaFiles: formData.mediaFiles
      })
    }
  })
}

// 處理文件預覽
const handlePreview = (file: any) => {
  console.log(file)
}

// 處理文件移除
const handleRemove = (file: any) => {
  const index = formData.mediaFiles.indexOf(file.url)
  if (index > -1) {
    formData.mediaFiles.splice(index, 1)
  }
}

// 上傳前檢查
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

// 在組件掛載時獲取審核人列表
onMounted(() => {
  fetchReviewers()
})
</script>

<style scoped>
.post-form {
  padding: 0;
}

.custom-form {
  --el-text-color-regular: #1d1d1f;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
  font-size: 14px;
}

.custom-input {
  :deep(.el-input__wrapper) {
    background-color: #f5f5f7;
    border: none;
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: none !important;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1d1d1f;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px #0071e3 !important;
  }
}

.custom-textarea {
  :deep(.el-textarea__inner) {
    background-color: #f5f5f7;
    border: none;
    border-radius: 12px;
    padding: 16px;
    font-size: 14px;
    color: #1d1d1f;
    resize: none;
    box-shadow: none !important;
  }

  :deep(.el-textarea__inner:focus) {
    box-shadow: 0 0 0 2px #0071e3 !important;
  }
}

.custom-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background-color: #f5f5f7;
    border: none;
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px #0071e3 !important;
  }
}

.custom-date-picker {
  width: 100%;

  :deep(.el-input__wrapper) {
    background-color: #f5f5f7;
    border: none;
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px #0071e3 !important;
  }
}

.reviewer-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.reviewer-avatar {
  background: #0071e3;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.media-upload-item {
  margin-bottom: 32px;
}

.upload-media {
  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    border: 2px dashed #d2d2d7;
    border-radius: 12px;
    background-color: #f5f5f7;
    transition: all 0.3s ease;
  }

  :deep(.el-upload--picture-card:hover) {
    border-color: #0071e3;
    background-color: #f5f5f7;
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    border-radius: 12px;
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
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
}

.el-upload__tip {
  font-size: 12px;
  color: #86868b;
  margin-top: 8px;
}

.form-actions {
  margin-top: 40px;
  margin-bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.submit-button {
  background: #0071e3;
  border: none;
  border-radius: 980px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.submit-button:hover {
  background: #0077ed;
  transform: scale(1.02);
}

.cancel-button {
  border: none;
  border-radius: 980px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  background: #f5f5f7;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: #e5e5e5;
  transform: scale(1.02);
}

.post-time-group {
  margin-bottom: 24px;
}

.time-inputs {
  display: flex;
  gap: 16px;
}

.time-item {
  flex: 1;
  margin-bottom: 0;
}

.time-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.custom-time-picker {
  width: 100%;

  :deep(.el-input__wrapper) {
    background-color: #f5f5f7;
    border: none;
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px #0071e3 !important;
  }
}
</style> 