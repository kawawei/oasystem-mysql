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
        <!-- 選擇模板 -->
        <div class="form-item">
          <label>選擇模板</label>
          <base-select
            v-model="selectedTemplate"
            :options="templateOptions"
            placeholder="選擇郵件模板"
            clearable
            @update:modelValue="handleTemplateChange"
          />
        </div>
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
import { ElMessageBox, ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import BaseModal from '@/common/base/Modal.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseSelect from '@/common/base/Select.vue'
import { useEmailForm } from '../composables/useEmailForm'
import { useEmailEditor } from '../composables/useEmailEditor'
import { useFileUpload } from '../composables/useFileUpload'
import type { Attachment } from '../composables/useEmailForm'
import { ref, onMounted } from 'vue'

// 定義表單類型
interface EmailForm {
  customer_id: string | number
  to: string
  subject: string
  content: string
  status: string
    scheduled_time?: string
  attachments: Attachment[]
  sent_time?: string
}

// 定義 props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  emailData: {
    type: Object,
    default: () => ({})
  }
})

// 定義 emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', form: EmailForm): void
  (e: 'send', form: EmailForm): void
}>()

// 初始化表單數據
const form = ref<EmailForm>({
  customer_id: '',
  to: '',
  subject: '',
  content: '',
  status: 'draft',
  scheduled_time: undefined,
  attachments: []
})

// 使用表單相關邏輯
const {
  dialogVisible,
  handleClose,
  validateForm,
  handleSave
} = useEmailForm(props, emit)

// 使用文件上傳相關邏輯
const {
  handleFileUpload,
  removeAttachment,
  formatFileSize,
  moveAttachmentsToPermanent
} = useFileUpload(form)

// 使用編輯器相關邏輯
const {
  toolbar,
  editorOptions,
  onEditorReady,
  onTextChange,
  onSelectionChange
} = useEmailEditor(handleFileUpload)

// 定義模板相關的類型
interface Template {
  id: number
  name: string
  type: string
  subject: string
  content: string
  attachments?: Attachment[]
}

// 在 script setup 部分添加類型定義
interface TemplateOption {
  label: string
  value: string
  data: Template
}

const templateOptions = ref<TemplateOption[]>([])
const selectedTemplate = ref<string>('')

// 修改 fetchTemplates 函數
const fetchTemplates = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/email-templates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('獲取模板列表失敗')
    }

    const data = await response.json()
    console.log('Fetched templates:', data) // 添加日誌

    if (data.success && Array.isArray(data.data)) {
      templateOptions.value = data.data.map((template: Template) => ({
        label: template.name,
        value: String(template.id), // 確保 ID 是字符串類型
        data: template
      }))
      console.log('Processed template options:', templateOptions.value) // 添加日誌
    } else {
      console.error('Invalid template data format:', data)
      throw new Error('模板數據格式無效')
    }
  } catch (error) {
    console.error('Error fetching templates:', error)
    ElMessage.error(error instanceof Error ? error.message : '獲取模板列表失敗')
  }
}

// 修改 handleTemplateChange 函數
const handleTemplateChange = async (value: string | null) => {
  console.log('Template changed, value:', value) // 添加日誌，記錄選中值
  
  if (!value) {
    console.log('No template selected, resetting form') // 添加日誌
    form.value.subject = ''
    form.value.content = ''
    return
  }

  // 嘗試從本地選項中找到選中的模板
  const selectedTemplate = templateOptions.value.find(option => option.value === value)
  console.log('Found template:', selectedTemplate) // 添加日誌

  if (selectedTemplate?.data) {
    // 使用本地緩存的模板數據
    form.value = {
      ...form.value,
      subject: selectedTemplate.data.subject,
      content: selectedTemplate.data.content
    }
    console.log('Updated form with local data:', form.value) // 添加日誌
    return
  }

  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/email-templates/${value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('獲取模板詳情失敗')
    }

    const data = await response.json()
    console.log('Template details from API:', data) // 添加日誌

    if (data.success && data.data) {
      // 使用 API 返回的模板數據
      form.value = {
        ...form.value,
        subject: data.data.subject,
        content: data.data.content
      }
      console.log('Updated form with API data:', form.value) // 添加日誌
    } else {
      throw new Error('模板數據格式無效')
    }
  } catch (error) {
    console.error('Error loading template:', error)
    ElMessage.error(error instanceof Error ? error.message : '載入模板失敗')
  }
}

// 在組件掛載時獲取模板列表，並監聽 emailData 的變化
onMounted(() => {
  fetchTemplates()
  // 如果是編輯模式且有現有數據，則填充表單
  if (props.emailData) {
    form.value = {
      ...form.value,
      ...props.emailData
    }
  }
})

// 發送郵件
const handleSend = async () => {
  if (!validateForm()) return

  // 定義基礎 URL / Define base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  try {
    // 檢查是否已授權 Gmail / Check if Gmail is authorized
    const authResponse = await fetch(`${baseUrl}/gmail/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const authData = await authResponse.json()
    
    if (!authData.data?.isAuthorized) {
      // 獲取授權 URL / Get authorization URL
      const urlResponse = await fetch(`${baseUrl}/gmail/auth-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const urlData = await urlResponse.json()
      
      await ElMessageBox.confirm(
        '需要授權 Gmail 帳號才能發送郵件。是否現在進行授權？',
        '需要授權',
        {
          confirmButtonText: '前往授權',
          cancelButtonText: '取消',
          type: 'info'
        }
      )

      // 在新視窗中打開授權頁面 / Open authorization page in new window
      const authWindow = window.open(urlData.data.url, '_blank', 'width=600,height=800')
      if (!authWindow) {
        throw new Error('無法打開授權視窗')
      }
      
      // 監聽授權完成事件 / Listen for authorization completion
      const checkAuth = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/gmail/status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const statusData = await statusResponse.json()
          
          if (statusData.data?.isAuthorized) {
            clearInterval(checkAuth)
            if (!authWindow.closed) {
              authWindow.close()
            }
            // 重新嘗試發送郵件 / Retry sending email
            handleSend()
          }
        } catch (error) {
          console.error('檢查授權狀態失敗:', error)
        }
      }, 2000) // 每2秒檢查一次

      // 60秒後停止檢查 / Stop checking after 60 seconds
      setTimeout(() => {
        clearInterval(checkAuth)
      }, 60000)

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

    // 處理郵件內容中的圖片 / Process images in email content
    const content = form.value.content
    const imgRegex = /<img[^>]+src="([^">]+)"/g
    let match
    const imageAttachments = []
    let processedContent = content

    // 收集所有圖片 URL 並下載圖片
    while ((match = imgRegex.exec(content)) !== null) {
      const imageUrl = match[1]
      if (imageUrl.startsWith(baseUrl)) {
        try {
          // 下載圖片
          const imageResponse = await fetch(imageUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const blob = await imageResponse.blob()
          
          // 生成唯一的 Content-ID (確保符合 RFC 2392 規範)
          const contentId = `${Date.now()}.${Math.random().toString(36).substr(2, 9)}@liheng.com`
          
          // 添加到圖片附件列表
          const arrayBuffer = await blob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          imageAttachments.push({
            filename: `image_${contentId.split('@')[0]}.${blob.type.split('/')[1]}`,
            content: btoa(Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('')),
            contentType: blob.type,
            contentId: contentId,
            isInline: true
          })

          // 替換圖片 URL 為 CID 引用 (使用正確的 CID 引用格式)
          processedContent = processedContent.replace(
            imageUrl,
            `cid:${contentId}`
          )
        } catch (error) {
          console.error('Error processing image:', error)
          throw new Error('處理郵件中的圖片時發生錯誤')
        }
      }
    }

    // 處理附件 / Process attachments
    let attachmentsToSend = []
    
    // 處理內嵌圖片
    attachmentsToSend = [...imageAttachments]

    // 處理一般附件
    if (form.value.attachments?.length) {
      await moveAttachmentsToPermanent()
      for (const attachment of form.value.attachments as Attachment[]) {
        try {
          // 根據環境使用不同的域名
          const domain = import.meta.env.PROD 
            ? 'https://oasystem.lihengtech.com.tw' 
            : window.location.origin;
          
          // 構建完整 URL
          const fullUrl = attachment.url.startsWith('http') 
            ? attachment.url 
            : `${domain}${attachment.url}`;

          const response = await fetch(fullUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error(`處理附件 ${attachment.filename} 時發生錯誤`);
          }

          const blob = await response.blob();
          const reader = new FileReader();
          const content = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              if (reader.result && typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
              } else {
                reject(new Error(`處理附件 ${attachment.filename} 時發生錯誤`));
              }
            };
            reader.onerror = () => reject(new Error(`處理附件 ${attachment.filename} 時發生錯誤`));
            reader.readAsDataURL(blob);
          });

          attachmentsToSend.push({
            filename: attachment.filename,
            content,
            contentType: blob.type,
            contentId: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@liheng.com`,
            isInline: false
          });
        } catch (error) {
          console.error('Error processing attachment:', error);
          throw new Error(`處理附件 ${attachment.filename} 時發生錯誤`);
        }
      }
    }

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
        content: processedContent,
        attachments: attachmentsToSend
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

    emit('send', {
      ...form.value,
      to: form.value.to.trim(),
      subject: form.value.subject.trim(),
      content: processedContent,  // 使用處理後的內容
      status: 'sent',
      sent_time: new Date().toISOString()
    } as EmailForm)
  } catch (error: unknown) {
    if (error === 'cancel') return // 用戶取消操作
    
    // 處理特定的錯誤碼 / Handle specific error codes
    if (error instanceof Error && 'response' in error) {
      const response = (error as { response: Response }).response
      const responseData = await response.json()
      
      if (responseData.code === 'GMAIL_AUTH_REQUIRED' || responseData.code === 'TOKEN_REFRESH_FAILED') {
        // 清除現有授權並重新獲取授權 / Clear existing authorization and get new one
        await fetch(`${baseUrl}/gmail/remove-auth`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        // 重新嘗試發送（這將觸發重新授權流程）/ Retry sending (this will trigger reauthorization flow)
        handleSend()
        return
      }
    }
    
    console.error('Error in handleSend:', error)
    const errorMessage = error instanceof Error ? error.message : '發送郵件時發生錯誤'
    ElMessageBox.alert(errorMessage, '錯誤')
  }
}
</script>

<style lang="scss">
@import '../styles/email-editor.scss';
</style> 