# 郵件編輯器組件 - 類似 Gmail 的郵件編輯界面
<template>
  <base-modal
    v-model="dialogVisible"
    :title="isEdit ? '編輯郵件' : '新增郵件'"
    width="800px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <template #default>
      <!-- 郵件表單 -->
      <div class="email-form">
        <!-- 收件人 -->
        <div class="form-item">
          <label>收件人：</label>
          <base-input
            v-model="form.to"
            placeholder="請輸入收件人郵箱"
          />
        </div>

        <!-- 主旨 -->
        <div class="form-item">
          <label>主旨：</label>
          <base-input
            v-model="form.subject"
            placeholder="請輸入郵件主旨"
          />
        </div>

        <!-- 郵件內容 -->
        <div class="form-item content">
          <QuillEditor
            v-model:content="form.content"
            contentType="html"
            :options="editorOptions"
            :toolbar="toolbar"
            @ready="onEditorReady"
            @textChange="onTextChange"
            @selectionChange="onSelectionChange"
            theme="snow"
          />
        </div>

        <!-- 附件列表 -->
        <div v-if="form.attachments?.length" class="attachments">
          <div v-for="(file, index) in form.attachments" :key="index" class="attachment-item">
            <span class="filename">{{ file.filename }}</span>
            <span class="size">{{ formatFileSize(file.size) }}</span>
            <el-button type="text" @click="removeAttachment(index)">刪除</el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 底部按鈕 -->
    <template #footer>
      <div class="dialog-footer">
        <base-button @click="handleClose">關閉</base-button>
        <base-button type="secondary" @click="handleSave">存為草稿</base-button>
        <base-button type="primary" @click="handleSend">發送</base-button>
      </div>
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'

// 定義組件的 props
const props = defineProps<{
  visible: boolean
  isEdit: boolean
  emailData?: {
    id?: number
    customer_id?: number
    to?: string
    subject?: string
    content?: string
    status?: string
    scheduled_time?: string
    attachments?: Array<{
      filename: string
      url: string
      size: number
    }>
  }
}>()

// 定義組件的 emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', form: any): void
  (e: 'send', form: any): void
}>()

// Quill 編輯器配置
const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],        // 文字樣式
  ['blockquote', 'code-block'],                     // 引用和代碼塊
  [{ 'header': 1 }, { 'header': 2 }],              // 標題
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],    // 列表
  [{ 'script': 'sub'}, { 'script': 'super' }],     // 上標/下標
  [{ 'indent': '-1'}, { 'indent': '+1' }],         // 縮進
  [{ 'direction': 'rtl' }],                         // 文字方向
  [{ 'size': ['small', false, 'large', 'huge'] }], // 字體大小
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],       // 標題大小
  [{ 'color': [] }, { 'background': [] }],         // 顏色選擇器
  [{ 'font': [] }],                                // 字體
  [{ 'align': [] }],                               // 對齊
  ['clean'],                                        // 清除格式
  ['link', 'image', 'attachment']                  // 連結、圖片和附件
]

const editorOptions = {
  placeholder: '請輸入郵件內容...',
  modules: {
    toolbar: {
      container: toolbar,
      handlers: {
        attachment: function() {
          // 創建文件輸入元素
          const input = document.createElement('input')
          input.setAttribute('type', 'file')
          input.setAttribute('multiple', 'multiple')
          input.setAttribute('accept', '*/*')  // 允許所有文件類型
          input.click()

          // 處理文件選擇
          input.onchange = () => {
            if (input.files) {
              handleFileUpload(input.files)
            }
          }
        }
      }
    }
  }
}

// 表單數據
const form = ref<{
  customer_id?: number
  to: string
  subject: string
  content: string
  status?: string
  scheduled_time?: string
  attachments: Array<{
    filename: string
    url: string
    size: number
  }>
}>({
  customer_id: undefined,
  to: '',
  subject: '',
  content: '',
  status: 'draft',
  scheduled_time: undefined,
  attachments: []
})

// 對話框可見性
const dialogVisible = ref(props.visible)

// 監聽 visible prop 的變化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 監聽對話框可見性的變化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 監聽 emailData 的變化
watch(() => props.emailData, (newVal) => {
  if (newVal) {
    form.value = {
      customer_id: newVal.customer_id,
      to: newVal.to || '',
      subject: newVal.subject || '',
      content: newVal.content || '',
      status: newVal.status || 'draft',
      scheduled_time: newVal.scheduled_time,
      attachments: newVal.attachments || []
    }
  } else {
    form.value = {
      customer_id: undefined,
      to: '',
      subject: '',
      content: '',
      status: 'draft',
      scheduled_time: undefined,
      attachments: []
    }
  }
}, { immediate: true })

// 編輯器就緒時的處理
const onEditorReady = (quill: any) => {
  console.log('Editor is ready!', quill)
}

// 監聽內容變化
const onTextChange = ({ delta, oldDelta, source }: any) => {
  console.log('Text change!', { delta, oldDelta, source })
}

// 監聽選擇範圍變化
const onSelectionChange = (range: any, oldRange: any, source: any) => {
  console.log('Selection change!', { range, oldRange, source })
}

// 處理文件上傳
const handleFileUpload = async (files: FileList) => {
  const maxSize = 20 * 1024 * 1024 // 20MB
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // 檢查文件大小
    if (file.size > maxSize) {
      ElMessageBox.alert(`文件 ${file.name} 超過大小限制 (20MB)`, '錯誤')
      continue
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${baseUrl}/upload?temp=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('上傳失敗')
      }

      const data = await response.json()
      
      // 添加到附件列表
      form.value.attachments.push({
        filename: file.name,
        url: data.url,
        size: file.size
      })
    } catch (error) {
      console.error('Upload error:', error)
      ElMessageBox.alert(`文件 ${file.name} 上傳失敗`, '錯誤')
    }
  }
}

// 移除附件
const removeAttachment = (index: number) => {
  form.value.attachments.splice(index, 1)
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 檢查表單是否有變更
const hasChanges = () => {
  if (!props.emailData) {
    return Boolean(form.value.to || form.value.subject || form.value.content)
  }
  return (
    form.value.to !== props.emailData.to ||
    form.value.subject !== props.emailData.subject ||
    form.value.content !== props.emailData.content
  )
}

// 關閉對話框
const handleClose = async () => {
  if (hasChanges()) {
    try {
      await ElMessageBox.confirm(
        '您有未保存的更改，確定要關閉嗎？',
        '提示',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch (e) {
      return
    }
  }
  dialogVisible.value = false
}

// 驗證表單
const validateForm = () => {
  if (!form.value.subject || !form.value.subject.trim()) {
    ElMessageBox.alert('請輸入郵件主旨', '提示')
    return false
  }
  if (!form.value.content || !form.value.content.trim()) {
    ElMessageBox.alert('請輸入郵件內容', '提示')
    return false
  }
  return true
}

// 保存為草稿
const handleSave = () => {
  emit('save', {
    ...form.value,
    to: form.value.to?.trim() || '',
    subject: form.value.subject?.trim() || '',
    content: form.value.content?.trim() || ''
  })
}

// 發送郵件
const handleSend = async () => {
  if (!validateForm()) return

  try {
    // 檢查是否已授權 Gmail / Check if Gmail is authorized
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const authResponse = await fetch(`${baseUrl}/gmail/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const authData = await authResponse.json()
    
    if (!authData.data?.isAuthorized) {
      await ElMessageBox.alert('請先授權 Gmail 帳號才能發送郵件', '提示', {
        confirmButtonText: '確定'
      })
      return
    }

    // 確認發送 / Confirm sending
    await ElMessageBox.confirm(
      '確定要發送這封郵件嗎？',
      '提示',
      {
        confirmButtonText: '確定發送',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 發送郵件 / Send email
    console.log('Sending email to:', `${baseUrl}/gmail/send`)
    const sendResponse = await fetch(`${baseUrl}/gmail/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: form.value.to.trim(),
        subject: form.value.subject.trim(),
        content: form.value.content.trim()
      })
    })

    // 記錄原始響應 / Log raw response
    const responseText = await sendResponse.text()
    console.log('Raw response:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.error('Response is not JSON:', responseText)
      throw new Error('伺服器返回了無效的響應格式')
    }

    if (!sendResponse.ok) {
      throw new Error(responseData.message || '發送郵件失敗')
    }

    // 創建郵件記錄 / Create email record
    const createResponse = await fetch(`${baseUrl}/customer-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...form.value,
        to: form.value.to.trim(),
        subject: form.value.subject.trim(),
        content: form.value.content.trim(),
        status: 'sent',
        sent_time: new Date().toISOString()
      })
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(errorData.message || '保存郵件記錄失敗')
    }

    emit('send', {
      ...form.value,
      to: form.value.to.trim(),
      subject: form.value.subject.trim(),
      content: form.value.content.trim(),
      status: 'sent',
      sent_time: new Date().toISOString()
    })
  } catch (error) {
    if (error === 'cancel') return // 用戶取消操作
    console.error('Error in handleSend:', error)
    ElMessageBox.alert(error instanceof Error ? error.message : '發送郵件時發生錯誤', '錯誤')
  }
}
</script>

<style lang="scss">
// 使用全局樣式來設置模態框的位置和外觀
.base-modal {
  .modal-wrapper {
    position: fixed !important;
    right: 20px !important;
    bottom: 0 !important;
    margin: 0 !important;
    height: 600px !important;
    border-radius: 8px 8px 0 0 !important;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15) !important;
  }

  .modal-header {
    padding: 12px 20px !important;
    margin: 0 !important;
    border-bottom: 1px solid #dcdfe6 !important;

    .modal-title {
      font-size: 14px !important;
      font-weight: 500 !important;
    }

    .close-btn {
      top: 12px !important;
    }
  }

  .modal-body {
    padding: 16px !important;
    height: calc(100% - 120px) !important;
    overflow-y: auto !important;
  }

  .modal-footer {
    padding: 12px 20px !important;
    border-top: 1px solid #dcdfe6 !important;
  }
}
</style>

<style lang="scss" scoped>
.email-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .form-item {
    margin-bottom: 16px;
    
    label {
      display: inline-block;
      width: 70px;
      color: #606266;
    }

    &.content {
      flex: 1;
      margin-bottom: 0;
      
      :deep(.quill-editor) {
        height: 100%;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        
        .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid #dcdfe6;
          padding: 8px;
        }
        
        .ql-container {
          height: calc(100% - 42px);
          border: none;
        }

        .ql-editor {
          padding: 12px;
          min-height: 200px;
        }
      }
    }
  }
}

.attachments {
  margin-top: 16px;
  border-top: 1px solid #dcdfe6;
  padding-top: 12px;

  .attachment-item {
    display: flex;
    align-items: center;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .filename {
      flex: 1;
      margin-right: 12px;
      color: #606266;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .size {
      margin-right: 12px;
      color: #909399;
      font-size: 12px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.ql-snow .ql-toolbar) {
  padding: 8px;
}

:deep(.ql-container.ql-snow) {
  background-color: #fff;
}

:deep(.ql-editor) {
  padding: 12px;
  min-height: 200px;
}

// 自定義附件按鈕圖標
:deep(.ql-attachment) {
  &::after {
    content: '📎';
    font-size: 18px;
    line-height: 1;
  }
}
</style> 