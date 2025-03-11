# 郵件編輯器組件 - 類似 Gmail 的郵件編輯界面
<template>
  <base-modal
    v-model="dialogVisible"
    :title="isEdit ? '編輯郵件' : '新增郵件'"
    width="600px"
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
          <base-input
            v-model="form.content"
            type="textarea"
            :rows="12"
            placeholder="請輸入郵件內容"
            resize="none"
          />
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
    attachments?: any[]
  }
}>()

// 定義組件的 emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', form: any): void
  (e: 'send', form: any): void
}>()

// 表單數據
const form = ref<{
  customer_id?: number
  to: string
  subject: string
  content: string
  status?: string
  scheduled_time?: string
  attachments?: any[]
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
      
      :deep(.textarea-wrapper) {
        height: 100%;
        
        textarea {
          height: 100%;
          resize: none;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 