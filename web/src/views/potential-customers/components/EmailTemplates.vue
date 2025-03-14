# 郵件模板管理組件
<template>
  <div class="email-templates">
    <!-- 模板列表和操作按鈕 -->
    <div class="templates-header">
      <h3>郵件模板管理</h3>
      <base-button type="primary" @click="handleCreateTemplate">
        新增模板
      </base-button>
    </div>

    <!-- 模板列表 -->
    <base-table
      :columns="columns"
      :data="templateData"
      :loading="loading"
    >
      <!-- 模板類型列 Template type column -->
      <template #type="{ row }">
        <el-tag :type="getTemplateTypeTag(row.type)">
          {{ getTemplateTypeText(row.type) }}
        </el-tag>
      </template>

      <!-- 更新時間列 Updated time column -->
      <template #updated_at="{ row }">
        {{ dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss') }}
      </template>

      <!-- 操作列 Actions column -->
      <template #actions="{ row }">
        <div class="actions">
          <base-button
            type="primary"
            size="small"
            @click="handleEditTemplate(row)"
          >
            編輯
          </base-button>
          <base-button
            type="danger"
            size="small"
            @click="handleDeleteTemplate(row)"
          >
            刪除
          </base-button>
        </div>
      </template>
    </base-table>

    <!-- 模板編輯對話框 -->
    <base-modal
      v-model="showTemplateEditor"
      :title="isEdit ? '編輯模板' : '新增模板'"
      width="800px"
      :before-close="handleClose"
    >
      <template #default>
        <!-- 模板表單 -->
        <div class="template-editor">
          <!-- 模板名稱 -->
          <div class="form-item">
            <label>模板名稱：</label>
            <base-input
              v-model="templateForm.name"
              placeholder="請輸入模板名稱"
            />
          </div>

          <!-- 模板類型 -->
          <div class="form-item">
            <label>模板類型：</label>
            <el-select v-model="templateForm.type">
              <el-option label="首次聯絡" value="first_contact" />
              <el-option label="一般模板" value="general" />
              <el-option label="追蹤聯絡" value="follow_up" />
            </el-select>
          </div>

          <!-- 郵件主旨 -->
          <div class="form-item">
            <label>郵件主旨：</label>
            <base-input
              v-model="templateForm.subject"
              placeholder="請輸入郵件主旨"
            />
          </div>

          <!-- 郵件內容 -->
          <div class="form-item content">
            <label>郵件內容：</label>
            <QuillEditor
              v-model:content="templateForm.content"
              contentType="html"
              :options="editorOptions"
              theme="snow"
              style="height: 300px"
            />
          </div>

          <!-- 附件列表 -->
          <div v-if="templateForm.attachments?.length" class="attachments">
            <div v-for="(file, index) in templateForm.attachments" :key="index" class="attachment-item">
              <span class="filename">{{ file.filename }}</span>
              <span class="size">{{ formatFileSize(file.size) }}</span>
              <el-button type="text" @click="removeAttachment(index)">刪除</el-button>
            </div>
          </div>

          <!-- 可用變數說明 -->
          <div class="variables-section">
            <h4>可用變數：</h4>
            <ul>
              <li><code>{客戶名稱}</code> - 客戶的名稱</li>
              <li><code>{聯絡人}</code> - 聯絡人姓名</li>
              <li><code>{公司名稱}</code> - 公司名稱</li>
              <li><code>{日期}</code> - 當前日期</li>
            </ul>
          </div>
        </div>
      </template>

      <!-- 底部按鈕 -->
      <template #footer>
        <div class="dialog-footer">
          <base-button @click="showTemplateEditor = false">取消</base-button>
          <base-button type="primary" @click="handleSave">保存</base-button>
        </div>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import BaseTable from '@/common/base/Table.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseModal from '@/common/base/Modal.vue'
import { message } from '@/plugins/message'
import { ElMessageBox } from 'element-plus'
import { useFileUpload } from '../composables/useFileUpload'

// 定義模板表單數據類型
interface TemplateFormData {
  id?: number
  name: string
  type: 'first_contact' | 'general' | 'follow_up'
  subject: string
  content: string
  attachments: Array<{ filename: string; size: number; url: string }>
}

// 定義模板數據類型
interface Template extends TemplateFormData {
  created_at: string
  updated_at: string
}

// 定義列配置 / Define column configuration
const columns = ref([
  {
    key: 'name',
    title: '模板名稱',
    label: '模板名稱',
    prop: 'name'
  },
  {
    key: 'type',
    title: '類型',
    label: '類型',
    prop: 'type',
    slot: 'type'
  },
  {
    key: 'subject',
    title: '郵件主旨',
    label: '郵件主旨',
    prop: 'subject'
  },
  {
    key: 'updated_at',
    title: '更新時間',
    label: '更新時間',
    prop: 'updated_at',
    slot: 'updated_at',
    width: '180px'
  },
  {
    key: 'actions',
    title: '操作',
    label: '操作',
    prop: 'actions',
    slot: 'actions',
    width: '150px'
  }
])

// 數據狀態
const loading = ref(false)
const templateData = ref<Template[]>([])
const showTemplateEditor = ref(false)
const isEdit = ref(false)
const templateForm = ref<TemplateFormData>({
  name: '',
  type: 'general',
  subject: '',
  content: '',
  attachments: []
})

// 使用文件上傳相關邏輯
const { handleFileUpload, removeAttachment, formatFileSize } = useFileUpload(templateForm)

// Quill 編輯器配置
const editorOptions = {
  placeholder: '請輸入郵件內容...',
  modules: {
    toolbar: {
      container: [
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
        ['link', 'image'],                               // 連結和圖片
        [{ 'attachment': 'attachment' }]                  // 附件按鈕
      ],
      handlers: {
        image: function(this: any) {
          const input = document.createElement('input')
          input.setAttribute('type', 'file')
          input.setAttribute('accept', 'image/*')
          input.click()

          input.onchange = async () => {
            if (input.files && input.files[0]) {
              const file = input.files[0]
              
              // 檢查文件大小（20MB）
              if (file.size > 20 * 1024 * 1024) {
                ElMessageBox.alert('圖片大小不能超過 20MB', '錯誤')
                return
              }

              try {
                const formData = new FormData()
                formData.append('file', file)

                // 上傳到臨時目錄
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
                const response = await fetch(`${baseUrl}/upload?temp=true&type=email`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: formData
                })

                if (!response.ok) {
                  throw new Error('圖片上傳失敗')
                }

                const data = await response.json()
                
                // 根據環境使用不同的域名
                const domain = import.meta.env.PROD 
                  ? 'https://oasystem.lihengtech.com.tw' 
                  : window.location.origin
                
                // 構建完整 URL
                const fullUrl = data.data.url.startsWith('http') 
                  ? data.data.url 
                  : `${domain}${data.data.url}`
                
                // 獲取 Quill 實例和當前選擇範圍
                const quill = (this.quill as any)
                const range = quill.getSelection(true)

                // 在當前光標位置插入圖片
                quill.insertEmbed(range.index, 'image', fullUrl)
                // 移動光標到圖片後
                quill.setSelection(range.index + 1)
              } catch (error) {
                console.error('Upload error:', error)
                ElMessageBox.alert('圖片上傳失敗', '錯誤')
              }
            }
          }
        },
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

// 獲取模板類型標籤樣式
const getTemplateTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    first_contact: 'success',
    general: 'info',
    follow_up: 'warning'
  }
  return typeMap[type] || 'info'
}

// 獲取模板類型文字
const getTemplateTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    first_contact: '首次聯絡',
    general: '一般模板',
    follow_up: '追蹤聯絡'
  }
  return typeMap[type] || type
}

// 獲取模板列表
const fetchTemplates = async () => {
  loading.value = true
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
    templateData.value = data.data
  } catch (error) {
    console.error('Error fetching templates:', error)
    message.error(error instanceof Error ? error.message : '獲取模板列表失敗')
  } finally {
    loading.value = false
  }
}

// 重置表單
const resetForm = () => {
  templateForm.value = {
    name: '',
    type: 'general',
    subject: '',
    content: '',
    attachments: []
  }
}

// 創建新模板
const handleCreateTemplate = () => {
  resetForm()
  isEdit.value = false
  showTemplateEditor.value = true
}

// 編輯模板
const handleEditTemplate = (template: Template) => {
  templateForm.value = {
    id: template.id,
    name: template.name,
    type: template.type,
    subject: template.subject,
    content: template.content,
    attachments: template.attachments || []
  }
  isEdit.value = true
  showTemplateEditor.value = true
}

// 刪除模板
const handleDeleteTemplate = async (template: Template) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/email-templates/${template.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('刪除模板失敗')
    }

    message.success('刪除成功')
  } catch (error) {
    console.error('Error deleting template:', error)
    message.error(error instanceof Error ? error.message : '刪除模板失敗')
  }
}

// 保存模板
const handleSave = async () => {
  try {
    if (!templateForm.value.name.trim()) {
      message.error('請輸入模板名稱')
      return
    }

    if (!templateForm.value.subject.trim()) {
      message.error('請輸入郵件主旨')
      return
    }

    if (!templateForm.value.content.trim()) {
      message.error('請輸入郵件內容')
      return
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const url = templateForm.value.id 
      ? `${baseUrl}/email-templates/${templateForm.value.id}`
      : `${baseUrl}/email-templates`

    const response = await fetch(url, {
      method: templateForm.value.id ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateForm.value)
    })

    if (!response.ok) {
      throw new Error('保存模板失敗')
    }

    message.success('保存成功')
    showTemplateEditor.value = false
    fetchTemplates()
  } catch (error) {
    console.error('Error saving template:', error)
    message.error(error instanceof Error ? error.message : '保存模板失敗')
  }
}

// 關閉模板編輯器
const handleClose = async () => {
  try {
    // 檢查是否有未保存的更改
    if (
      templateForm.value.name.trim() ||
      templateForm.value.subject.trim() ||
      templateForm.value.content.trim() ||
      templateForm.value.attachments.length > 0
    ) {
      await ElMessageBox.confirm(
        '您有未保存的更改，確定要關閉嗎？',
        '提示',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    showTemplateEditor.value = false
    resetForm()
  } catch (error) {
    if (error === 'cancel') return
    console.error('Error closing template editor:', error)
  }
}

// 在組件掛載時獲取模板列表
onMounted(() => {
  fetchTemplates()
})
</script>

<style lang="scss" scoped>
@import '../styles/email-templates.scss';

.email-templates {
  padding: 20px;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
  }
}

// 可用變數區域樣式
.variables-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;

  h4 {
    margin: 0 0 12px 0;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      margin-bottom: 8px;
      color: #606266;
      font-size: 14px;
      line-height: 1.4;
      display: flex;
      align-items: center;

      &:last-child {
        margin-bottom: 0;
      }

      code {
        background-color: #e6e8eb;
        padding: 2px 6px;
        border-radius: 3px;
        margin-right: 8px;
        font-family: monospace;
        color: #409eff;
        font-size: 13px;
      }
    }
  }
}

// 表單項樣式
.form-item {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    color: #606266;
    font-weight: 500;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

// 底部按鈕樣式
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}
</style>