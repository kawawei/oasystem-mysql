<!-- 名單管理標籤頁 List Management Tab -->
<template>
  <div class="customer-list-management">
    <el-tabs v-model="currentTab">
      <el-tab-pane label="導入名單" name="import">
        <div class="upload-section">
          <div class="upload-container">
            <el-upload
              class="upload-area"
              :action="uploadUrl"
              :headers="headers"
              :before-upload="beforeUpload"
              :on-success="handleFileUploadSuccess"
              :with-credentials="true"
              accept=".xlsx,.xls"
              drag
            >
              <div class="upload-content">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <div class="upload-text">
                  <p>點擊或拖拽文件到此處上傳</p>
                  <p class="upload-tip">支持 .xlsx, .xls 格式的文件</p>
                </div>
              </div>
            </el-upload>
          </div>
          <div class="template-download">
            <base-button @click="downloadTemplate">
              <i class="fas fa-download"></i>
              下載匯入範本
            </base-button>
            <p class="template-tip">請先下載範本，依照範本格式填寫後再上傳</p>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="名單管理" name="list">
        <div class="search-area">
          <base-input
            v-model="searchQuery"
            placeholder="搜索補習班名稱/電話/Email/聯絡人/備註"
            @input="handleSearch"
          />
          <base-select
            v-model="selectedArea"
            placeholder="選擇區域"
            :options="districtOptions"
            @change="handleAreaChange"
          />
          <base-button type="primary" @click="handleAdd">新增補習班</base-button>
        </div>

        <base-table
          :loading="loading"
          :data="tutorialCenters"
          :columns="tableColumns"
          row-key="id"
        >
          <!-- 操作列 Actions Column -->
          <template #actions="{ row }">
            <div class="action-buttons">
              <base-button
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >編輯</base-button>
              <base-button
                type="danger"
                size="small"
                @click="handleTutorialCenterDelete(row)"
              >刪除</base-button>
            </div>
          </template>
        </base-table>

        <div class="pagination-area">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯補習班' : '新增補習班'"
      width="50%"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        @submit.prevent="handleFormSubmit"
      >
        <el-form-item label="補習班名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="電話" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="縣市" prop="city">
          <el-select
            v-model="form.city"
            placeholder="請選擇縣市"
            @change="handleCityChange"
          >
            <el-option
              v-for="option in cityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="區域" prop="district">
          <el-select
            v-model="form.district"
            placeholder="請選擇區域"
          >
            <el-option
              v-for="option in districtOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="聯絡人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="備註" prop="notes">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <base-button @click="dialogVisible = false">取消</base-button>
          <base-button type="primary" @click="handleFormSubmit">
            {{ isEdit ? '更新' : '新增' }}
          </base-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, onMounted } from 'vue'
import useCustomerListManagement from '../scripts/CustomerListManagement'
import BaseTable from '@/common/base/Table.vue'
import BaseButton from '@/common/base/Button.vue'
import BaseInput from '@/common/base/Input.vue'
import BaseSelect from '@/common/base/Select.vue'


// 定義 emit 事件 Define emit events
const emit = defineEmits<{
  (e: 'data-updated'): void
}>()

// 使用 composable 並傳入 emit Use composable and pass emit
const {
  currentTab,
  loading,
  searchQuery,
  selectedArea,
  currentPage,
  pageSize,
  total,
  tutorialCenters,
  form,
  formRef,
  rules,
  dialogVisible,
  isEdit,
  cityOptions,
  districtOptions,
  uploadUrl,
  handleSearch,
  handleAreaChange,
  handleSizeChange,
  handleCurrentChange,
  handleAdd,
  handleEdit,
  handleTutorialCenterDelete,
  handleFormSubmit,
  handleCityChange,
  beforeUpload,
  handleFileUploadSuccess,
  downloadTemplate,
  fetchTutorialCenters
} = useCustomerListManagement(emit)

// 添加 headers 計算屬性 Add headers computed property
const headers = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

// 定義表格列 Define table columns
const tableColumns = [
  {
    key: 'index',
    title: '序號'
  },
  {
    key: 'name',
    title: '補習班名稱'
  },
  {
    key: 'phone',
    title: '電話'
  },
  {
    key: 'city',
    title: '縣市'
  },
  {
    key: 'district',
    title: '區域'
  },
  {
    key: 'contact',
    title: '聯絡人'
  },
  {
    key: 'email',
    title: 'Email'
  },
  {
    key: 'notes',
    title: '備註'
  },
  {
    key: 'actions',
    title: '操作'
  }
]

// 在組件掛載時獲取數據
onMounted(() => {
  fetchTutorialCenters()
})
</script>

<style lang="scss" scoped>
.customer-list-management {
  padding: 20px;

  .upload-section {
    padding: 20px;
    
    .upload-container {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    }

    .upload-area {
      :deep(.el-upload-dragger) {
        width: 100%;
        height: 200px;
        border: 2px dashed var(--el-border-color);
        border-radius: 8px;
        background: #fafafa;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: var(--el-color-primary);
          background: #f5f7fa;
        }
      }
    }

    .upload-content {
      text-align: center;
      color: #606266;

      .upload-icon {
        font-size: 48px;
        color: #909399;
        margin-bottom: 16px;
      }

      .upload-text {
        p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;

          &.upload-tip {
            margin-top: 8px;
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }

    .template-download {
      margin-top: 20px;
      text-align: center;

      .template-tip {
        margin-top: 8px;
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .search-area {
    margin-bottom: 20px;
    display: flex;
    gap: 20px;
    align-items: center;

    .el-input {
      width: 300px;
    }

    .el-select {
      width: 200px;
    }
  }

  .pagination-area {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style> 