<!-- 名單管理標籤頁 List Management Tab -->
<template>
  <div class="customer-list-management">
    <el-tabs v-model="currentTab">
      <el-tab-pane label="導入名單" name="import">
        <div class="upload-area">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :headers="headers"
            :before-upload="beforeUpload"
            :on-success="handleFileUploadSuccess"
            :with-credentials="true"
            accept=".xlsx,.xls"
          >
            <el-button type="primary">點擊上傳</el-button>
          </el-upload>
          <el-button @click="downloadTemplate">下載範本</el-button>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="名單管理" name="list">
        <div class="search-area">
          <el-input
            v-model="searchQuery"
            placeholder="搜索補習班名稱/電話/Email/聯絡人/備註"
            @input="handleSearch"
          />
          <el-select
            v-model="selectedArea"
            placeholder="選擇區域"
            @change="handleAreaChange"
          >
            <el-option
              v-for="option in districtOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button type="primary" @click="handleAdd">新增補習班</el-button>
        </div>

        <el-table
          v-loading="loading"
          :data="tutorialCenters"
          border
          style="width: 100%"
        >
          <el-table-column
            prop="index"
            label="序號"
            width="70"
          />
          <el-table-column
            prop="name"
            label="補習班名稱"
            min-width="150"
          />
          <el-table-column
            prop="phone"
            label="電話"
            min-width="120"
          />
          <el-table-column
            prop="city"
            label="縣市"
            width="100"
          />
          <el-table-column
            prop="district"
            label="區域"
            width="100"
          />
          <el-table-column
            prop="contact"
            label="聯絡人"
            width="100"
          />
          <el-table-column
            prop="email"
            label="Email"
            min-width="180"
          />
          <el-table-column
            prop="notes"
            label="備註"
            min-width="150"
          />
          <el-table-column
            label="操作"
            width="150"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >編輯</el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleTutorialCenterDelete(row)"
              >刪除</el-button>
            </template>
          </el-table-column>
        </el-table>

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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleFormSubmit">
            {{ isEdit ? '更新' : '新增' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits } from 'vue'
import useCustomerListManagement from '../scripts/CustomerListManagement'

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
  downloadTemplate
} = useCustomerListManagement(emit)

// 添加 headers 計算屬性 Add headers computed property
const headers = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))
</script>

<style lang="scss" scoped>
.customer-list-management {
  padding: 20px;

  .upload-area {
    margin: 20px 0;
    display: flex;
    gap: 20px;
    align-items: center;
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