# 郵件列表頁面 - 用於管理和發送郵件
<template>
  <div class="email-list-page">
    <!-- 頁面標題區域 -->
    <div class="page-header">
      <h2>郵件管理</h2>
    </div>

    <!-- 標籤頁和搜索區域 -->
    <div class="page-content">
      <div class="tab-header">
        <div class="tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'list' }"
            @click="activeTab = 'list'"
          >
            郵件列表
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'templates' }"
            @click="activeTab = 'templates'"
          >
            模板管理
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            基礎設置
          </div>
        </div>
        
        <!-- 搜索和操作區域 -->
        <div v-if="activeTab === 'list'" class="action-area">
          <base-input
            v-model="searchQuery"
            placeholder="搜索郵件主旨"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <Search />
            </template>
            <template #append>
              <base-button @click="handleSearch">搜索</base-button>
            </template>
          </base-input>
          <base-button type="primary" @click="handleCreateEmail">
            新增郵件
          </base-button>
        </div>
      </div>

      <!-- 郵件列表標籤頁 -->
      <div v-if="activeTab === 'list'" class="content-section">
        <base-table
          :columns="columns"
          :data="emailData"
          :loading="loading"
        >
          <!-- 狀態列 Status column -->
          <template #status="{ row }">
            <status-badge :status="getStatusBadgeType(row.status)" :text="getStatusText(row.status)" />
          </template>

          <!-- 預定發送時間列 Scheduled time column -->
          <template #scheduled_time="{ row }">
            {{ row.scheduled_time ? dayjs(row.scheduled_time).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </template>

          <!-- 發送時間列 Sent time column -->
          <template #sent_time="{ row }">
            {{ row.sent_time ? dayjs(row.sent_time).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </template>

          <!-- 創建時間列 Created time column -->
          <template #created_at="{ row }">
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
          </template>

          <!-- 操作列 Actions column -->
          <template #actions="{ row }">
            <div class="actions">
              <base-button
                v-if="row.status === 'draft'"
                type="primary"
                size="small"
                @click="handleSend(row)"
              >
                <el-icon><component :is="Send" /></el-icon>
                發送
              </base-button>
              <base-button
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >
                <el-icon><component :is="Edit" /></el-icon>
                編輯
              </base-button>
              <base-button
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                <el-icon><component :is="Delete" /></el-icon>
                刪除
              </base-button>
            </div>
          </template>
        </base-table>

        <!-- 分頁 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 基礎設置標籤頁 -->
      <div v-if="activeTab === 'settings'" class="content-section">
        <gmail-settings />
      </div>

      <!-- 模板管理標籤頁 -->
      <div v-if="activeTab === 'templates'" class="content-section">
        <email-templates />
      </div>
    </div>

    <!-- 郵件編輯器 -->
    <email-editor
      v-model:visible="showEmailEditor"
      :is-edit="!!currentEmail?.id"
      :email-data="currentEmail"
      @save="handleEmailSave"
      @send="handleEmailSend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import dayjs from 'dayjs'
import type { EmailStatus } from './composables/useEmailList'
import { useEmailList } from './composables/useEmailList'
import BaseTable from '@/common/base/Table.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import StatusBadge from '@/common/base/StatusBadge.vue'
import EmailEditor from './components/EmailEditor.vue'
import GmailSettings from './components/GmailSettings.vue'
import EmailTemplates from './components/EmailTemplates.vue'
import { message } from '@/plugins/message'
import { useRoute } from 'vue-router'

const {
  activeTab,
  searchQuery,
  emailData,
  loading,
  pagination,
  columns,
  fetchEmailList,
  handleSearch,
  handlePageChange,
  handleSizeChange,
  handleDelete,
  Search,
  Delete,
  Edit,
  Send
} = useEmailList()

const route = useRoute()

// 郵件編輯器狀態
const showEmailEditor = ref(false)
const currentEmail = ref<{
  id?: number
  customer_id?: number
  to?: string
  subject?: string
  content?: string
  status?: string
  scheduled_time?: string
  attachments?: any[]
} | undefined>(undefined)

// 獲取狀態類型 Get status type
const getStatusBadgeType = (status: EmailStatus) => {
  const typeMap: Record<EmailStatus, 'info' | 'success' | 'danger' | 'warning'> = {
    draft: 'info',
    sent: 'success',
    failed: 'danger',
    scheduled: 'warning'
  }
  return typeMap[status]
}

// 獲取狀態文本 Get status text
const getStatusText = (status: EmailStatus) => {
  const textMap: Record<EmailStatus, string> = {
    draft: '草稿',
    sent: '已發送',
    failed: '發送失敗',
    scheduled: '預定發送'
  }
  return textMap[status]
}

// 創建新郵件
const handleCreateEmail = () => {
  currentEmail.value = {
    customer_id: route.params.id ? Number(route.params.id) : undefined,  // 如果有路由參數則使用，否則為 undefined
    to: '',
    subject: '',
    content: '',
    status: 'draft',
    scheduled_time: undefined,
    attachments: []
  }
  showEmailEditor.value = true
}

// 保存郵件
const handleEmailSave = async (form: any) => {
  try {
    const requestData = {
      customer_id: form.customer_id,  // 可以是 undefined
      to: form.to?.trim() || '',  // 如果沒有填寫，則使用空字符串
      subject: form.subject || '',
      content: form.content || '',
      status: 'draft',
      scheduled_time: form.scheduled_time,
      attachments: form.attachments || []
    }
    console.log('Saving email with data:', requestData)

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/customer-emails${currentEmail.value?.id ? `/${currentEmail.value.id}` : ''}`, {
      method: currentEmail.value?.id ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '保存郵件失敗')
    }

    message.success('郵件已保存為草稿')
    showEmailEditor.value = false
    fetchEmailList()
  } catch (error) {
    console.error('Error saving email:', error)
    message.error(error instanceof Error ? error.message : '保存郵件失敗')
  }
}

// 發送郵件
const handleEmailSend = async (form: any) => {
  try {
    if (!form.subject || !form.subject.trim()) {
      message.error('請輸入郵件主旨')
      return
    }

    if (!form.content || !form.content.trim()) {
      message.error('請輸入郵件內容')
      return
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    
    // 更新郵件狀態
    const requestData = {
      customer_id: form.customer_id,
      to: form.to?.trim() || '',
      subject: form.subject.trim(),
      content: form.content.trim(),
      status: 'sent',
      scheduled_time: form.scheduled_time,
      attachments: form.attachments || []
    }

    console.log('Updating email status:', requestData)
    const updateResponse = await fetch(`${baseUrl}/customer-emails${currentEmail.value?.id ? `/${currentEmail.value.id}` : ''}`, {
      method: currentEmail.value?.id ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!updateResponse.ok) {
      const updateErrorData = await updateResponse.json()
      throw new Error(updateErrorData.message || '更新郵件狀態失敗')
    }

    const updateResult = await updateResponse.json()
    console.log('Email status updated:', updateResult)

    message.success('郵件已發送')
    showEmailEditor.value = false
    fetchEmailList()
  } catch (error) {
    console.error('Error sending email:', error)
    message.error(error instanceof Error ? error.message : '發送郵件失敗')
  }
}

// 處理編輯郵件 / Handle edit email
const handleEdit = (row: any) => {
  currentEmail.value = {
    id: row.id,
    customer_id: row.customer_id,
    to: row.to,
    subject: row.subject,
    content: row.content,
    status: row.status,
    scheduled_time: row.scheduled_time,
    attachments: row.attachments || []
  }
  showEmailEditor.value = true
}

// 處理發送郵件 / Handle send email
const handleSend = (row: any) => {
  currentEmail.value = {
    id: row.id,
    customer_id: row.customer_id,
    to: row.to,
    subject: row.subject,
    content: row.content,
    status: row.status,
    scheduled_time: row.scheduled_time,
    attachments: row.attachments || []
  }
  showEmailEditor.value = true
}

// 在組件掛載時獲取郵件列表
onMounted(() => {
  fetchEmailList()
})
</script>

<style lang="scss" scoped>
@import './styles/email-list.scss';

.action-area {
  display: flex;
  align-items: center;
  gap: 16px;

  .search-input {
    width: 300px;
  }
}

.actions {
  display: flex;
  gap: 12px;  // 增加按鈕之間的間距
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 