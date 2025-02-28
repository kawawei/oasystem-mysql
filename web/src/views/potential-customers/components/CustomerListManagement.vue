<!-- 名單管理標籤頁 List Management Tab -->
<template>
  <div class="list-management">
    <!-- 內部標籤頁 Inner tabs -->
    <div class="inner-tabs">
      <div class="tabs-left">
        <div 
          class="tab-item" 
          :class="{ active: currentTab === 'import' }"
          @click="currentTab = 'import'"
        >
          導入名單
        </div>
        <div 
          class="tab-item" 
          :class="{ active: currentTab === 'manage' }"
          @click="currentTab = 'manage'"
        >
          名單管理
        </div>
      </div>
      <div class="tabs-right">
        <base-button v-if="currentTab === 'manage'" type="primary" @click="handleAdd">
          新增補習班
        </base-button>
      </div>
    </div>

    <!-- 導入名單標籤頁 Import list tab -->
    <div v-if="currentTab === 'import'" class="import-section">
      <div class="upload-area">
        <el-upload
          class="excel-uploader"
          :action="uploadUrl"
          :before-upload="beforeUpload"
          :on-success="handleFileUploadSuccess"
          :on-error="(err: UploadError) => message.error(err.message || '上傳失敗')"
          :headers="headers"
          :with-credentials="true"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            拖曳檔案至此處或 <em>點擊上傳</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上傳 xlsx/xls 檔案
            </div>
          </template>
        </el-upload>
      </div>
      
      <div class="template-download">
        <base-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下載 Excel 範本
        </base-button>
      </div>
    </div>

    <!-- 名單管理標籤頁 List management tab -->
    <div v-if="currentTab === 'manage'" class="manage-section">
      <!-- 數據表格 Data table -->
      <base-table
        :columns="tableColumns"
        :data="tutorialCenters"
        :loading="loading"
        row-key="id"
      >
        <template #actions="{ row }">
          <div class="action-buttons">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              編輯
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleTutorialCenterDelete(row)"
            >
              刪除
            </el-button>
          </div>
        </template>
      </base-table>

      <!-- 分頁 Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 編輯/新增表單彈窗 Edit/Add form dialog -->
    <base-modal
      v-model="dialogVisible"
      :title="isEdit ? '編輯補習班' : '新增補習班'"
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <div class="form-row">
          <el-form-item label="補習班名稱" prop="name" class="form-item">
            <base-input v-model="form.name" placeholder="請輸入補習班名稱" />
          </el-form-item>
          <el-form-item label="電話" prop="phone" class="form-item">
            <base-input v-model="form.phone" placeholder="請輸入電話" />
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="縣市" prop="city" class="form-item">
            <base-select
              v-model="form.city"
              :options="cityOptions"
              placeholder="請選擇縣市"
              @update:model-value="handleCityChange"
              clearable
            />
          </el-form-item>
          <el-form-item label="區域" prop="district" class="form-item">
            <base-select
              v-model="form.district"
              :options="districtOptions"
              placeholder="請選擇區域"
              :disabled="!form.city"
              clearable
            />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="詳細地址" prop="address" class="form-item-full">
            <base-input 
              v-model="form.address" 
              placeholder="請輸入詳細地址（選填）" 
            />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="窗口" prop="contact" class="form-item">
            <base-input v-model="form.contact" placeholder="請輸入窗口" />
          </el-form-item>
          <el-form-item label="Email" prop="email" class="form-item">
            <base-input v-model="form.email" placeholder="請輸入 Email" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="備註" prop="notes" class="form-item-full">
            <base-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
              placeholder="請輸入備註"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <base-button type="secondary" @click="dialogVisible = false">取消</base-button>
        <base-button type="primary" @click="handleFormSubmit" :loading="loading">確定</base-button>
      </template>
    </base-modal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import useCustomerListManagement from '../scripts/CustomerListManagement'
import { Upload, Download } from '@element-plus/icons-vue'
import { message } from '@/plugins/message'
import BaseModal from '@/common/base/Modal.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'
import BaseTable from '@/common/base/Table.vue'

interface UploadError {
  message?: string
  status?: number
  name?: string
}

const emit = defineEmits(['dataUpdated'])

// 添加 headers 計算屬性
const headers = computed(() => ({
  'Authorization': `Bearer ${globalThis.localStorage.getItem('token') || ''}`
}))

// Table columns configuration
const tableColumns = [
  { 
    key: 'index', 
    title: '序號', 
    width: 80,
    render: ({ $index }: { $index: number }) => $index + 1
  },
  { key: 'name', title: '補習班名稱', sortable: true },
  { key: 'phone', title: '電話', width: 120 },
  { key: 'city', title: '縣市', width: 100 },
  { key: 'district', title: '區域', width: 100 },
  { key: 'contact', title: '窗口', width: 100 },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'notes', title: '備註' },
  { key: 'actions', title: '操作', width: 150 }
]

const {
  currentTab,
  uploadUrl,
  loading,
  currentPage,
  pageSize,
  total,
  tutorialCenters,
  dialogVisible,
  isEdit,
  formRef,
  form,
  rules,
  beforeUpload,
  handleUploadSuccess,
  downloadTemplate,
  handleSizeChange,
  handleCurrentChange,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSubmit,
  cityOptions,
  districtOptions,
  handleCityChange
} = useCustomerListManagement()

// 重寫 handleSubmit 函數，在成功時發出事件
const handleFormSubmit = async () => {
  try {
    await handleSubmit()
    dialogVisible.value = false // 關閉對話框
    emit('dataUpdated') // 發出數據更新事件
    message.success('操作成功')
  } catch (error) {
    console.error('Error submitting form:', error)
    message.error('操作失敗')
  }
}

// 重寫 handleDelete 函數，在成功時發出事件
const handleTutorialCenterDelete = async (row: any) => {
  try {
    await handleDelete(row)
    emit('dataUpdated') // 發出數據更新事件
    message.success('刪除成功')
  } catch (error) {
    console.error('Error deleting tutorial center:', error)
    message.error('刪除失敗')
  }
}

// 重寫 handleUploadSuccess 函數，在成功時發出事件
const handleFileUploadSuccess = async (response: any) => {
  try {
    await handleUploadSuccess(response)
    emit('dataUpdated') // 發出數據更新事件
    message.success('上傳成功')
  } catch (error) {
    console.error('Error handling upload success:', error)
    message.error('上傳失敗')
  }
}
</script>

<style lang="scss" scoped>
.list-management {
  padding: 20px;
}

.inner-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.tabs-left {
  display: flex;
  gap: 20px;
}

.tabs-right {
  padding-right: 20px;
}

.tab-item {
  padding: 10px 20px;
  cursor: pointer;
  position: relative;
  
  &.active {
    color: #409eff;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #409eff;
    }
  }
}

.import-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.upload-area {
  width: 100%;
  max-width: 500px;
  
  :deep(.el-upload-dragger) {
    width: 100%;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .el-icon--upload {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 16px;
    }
    
    .el-upload__text {
      font-size: 16px;
      
      em {
        color: #409eff;
        font-style: normal;
      }
    }
  }
  
  .el-upload__tip {
    text-align: center;
    margin-top: 12px;
    color: #909399;
  }
}

.template-download {
  margin-top: 20px;
}

.manage-section {
  padding: 20px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  width: 100%;

  .form-item {
    flex: 1;
    margin-bottom: 0;
    min-width: 0;
  }

  .form-item-full {
    flex: 1;
    width: 100%;
    margin-bottom: 0;
    min-width: 0;
    
    :deep(.el-form-item__content) {
      width: 100%;
      display: block;
    }
    
    :deep(.el-input),
    :deep(.el-textarea) {
      width: 100%;
      display: block;
    }
    
    :deep(.el-input__wrapper),
    :deep(.el-textarea__wrapper) {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    
    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    
    :deep(.el-textarea__inner) {
      min-height: 120px;
      width: 100%;
      resize: vertical;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.el-dialog) {
  min-width: 800px;
  width: 800px !important;
  
  .el-dialog__body {
    padding: 20px 30px;
    width: 100%;
    box-sizing: border-box;
  }

  .el-form {
    width: 100%;
    
    :deep(.el-form-item__content) {
      flex: 1;
      width: 100%;
      min-width: 0;
    }
  }
}

:deep(.el-form-item__label) {
  flex-shrink: 0;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
</style> 