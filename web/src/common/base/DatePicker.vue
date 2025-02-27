<!-- 日期選擇器組件 Date Picker Component -->
<template>
  <el-date-picker
    :model-value="modelValue"
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :format="format"
    :value-format="valueFormat"
    :disabled="disabled"
    :clearable="clearable"
    :style="{ width: width }"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  modelValue: {
    type: [String, Number, Date],
    default: ''
  },
  type: {
    type: String as PropType<'year' | 'month' | 'date' | 'datetime'>,
    default: 'date'
  },
  placeholder: {
    type: String,
    default: '請選擇日期'
  },
  format: {
    type: String,
    default: 'YYYY/MM/DD'
  },
  valueFormat: {
    type: String,
    default: 'YYYY-MM-DD'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  width: {
    type: String,
    default: '100%'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleChange = (value: string | number | Date) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style lang="scss" scoped>
:deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 1px 11px;
  width: 100%;
  height: 40px;
  
  &:hover {
    border-color: var(--el-border-color-hover);
  }
  
  &.is-focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-2);
  }
}

:deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
}

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  color: var(--el-text-color-placeholder);
  height: 40px;
}
</style> 