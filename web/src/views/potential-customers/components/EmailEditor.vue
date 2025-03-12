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
            style="height: 300px"
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
import { ElMessageBox } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import { useEmailForm } from '../composables/useEmailForm'
import { useEmailEditor } from '../composables/useEmailEditor'
import { useFileUpload } from '../composables/useFileUpload'

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

// 使用表單相關邏輯
const {
  form,
  dialogVisible,
  handleClose,
  validateForm,
  handleSave
} = useEmailForm(props, emit)

// 使用文件上傳相關邏輯
const {
  handleFileUpload,
  removeAttachment,
  formatFileSize
} = useFileUpload(form)

// 使用編輯器相關邏輯
const {
  toolbar,
  editorOptions,
  onEditorReady,
  onTextChange,
  onSelectionChange
} = useEmailEditor(handleFileUpload)

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
@import '../styles/email-editor.scss';
</style> 