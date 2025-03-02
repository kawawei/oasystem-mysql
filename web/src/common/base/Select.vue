<template>
  <div class="select-wrapper" :class="{ 'is-error': error }">
    <label v-if="label" class="select-label">{{ label }}</label>
    <div class="select-container">
      <select
        :value="modelValue"
        :disabled="disabled"
        :class="size"
        class="base-select"
        @change="handleChange"
        @blur="handleBlur"
      >
        <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <i class="fas fa-chevron-down select-arrow"></i>
    </div>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  error?: string
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>

<style scoped>
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.select-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.select-container {
  position: relative;
}

.base-select {
  width: 100%;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  color: #1d1d1f;
  background: white;
  appearance: none;
  padding-right: 32px;
}

.base-select:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.1);
}

.base-select:disabled {
  background-color: #f5f5f7;
  cursor: not-allowed;
}

.base-select.small {
  height: 32px;
  padding-left: 12px;
  font-size: 13px;
}

.base-select.medium {
  height: 40px;
  padding-left: 16px;
  font-size: 14px;
}

.base-select.large {
  height: 48px;
  padding-left: 20px;
  font-size: 15px;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #86868b;
  pointer-events: none;
}

.is-error .base-select {
  border-color: #ff3b30;
}

.is-error .base-select:focus {
  box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.1);
}

.error-message {
  font-size: 12px;
  color: #ff3b30;
}

@media (max-width: 768px) {
  .base-select {
    font-size: 16px;
  }
}
</style> 