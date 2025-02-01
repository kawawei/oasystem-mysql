<template>
  <div class="input-wrapper" :class="{ 'is-error': error }">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="input-container">
      <i v-if="prefixIcon" class="prefix-icon" :class="prefixIcon"></i>
      <template v-if="type === 'textarea'">
        <textarea
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :rows="rows"
          :class="[size, { 'has-prefix': prefixIcon, 'has-suffix': suffixIcon }]"
          class="base-input textarea"
          @input="handleInput"
          @blur="handleBlur"
        ></textarea>
      </template>
      <template v-else>
        <input
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="[size, { 'has-prefix': prefixIcon, 'has-suffix': suffixIcon }]"
          class="base-input"
          @input="handleInput"
          @blur="handleBlur"
        >
      </template>
      <i v-if="suffixIcon" class="suffix-icon" :class="suffixIcon"></i>
    </div>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'textarea'
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  error?: string
  prefixIcon?: string
  suffixIcon?: string
  rows?: number
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'medium',
  disabled: false,
  rows: 3
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input {
  width: 100%;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  color: #1d1d1f;
  background: white;
}

.base-input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.1);
}

.base-input:disabled {
  background-color: #f5f5f7;
  cursor: not-allowed;
}

.base-input.small {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.base-input.medium {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

.base-input.large {
  height: 48px;
  padding: 0 20px;
  font-size: 15px;
}

.base-input.has-prefix {
  padding-left: 40px;
}

.base-input.has-suffix {
  padding-right: 40px;
}

.prefix-icon,
.suffix-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #86868b;
}

.prefix-icon {
  left: 12px;
}

.suffix-icon {
  right: 12px;
}

.is-error .base-input {
  border-color: #ff3b30;
}

.is-error .base-input:focus {
  box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.1);
}

.error-message {
  font-size: 12px;
  color: #ff3b30;
}

@media (max-width: 768px) {
  .base-input {
    font-size: 16px; /* 防止 iOS 自動縮放 */
  }
}

.base-input.textarea {
  height: auto;
  min-height: 80px;
  padding: 12px 16px;
  resize: vertical;
}

.base-input.textarea.small {
  min-height: 60px;
  padding: 8px 12px;
}

.base-input.textarea.large {
  min-height: 100px;
  padding: 16px 20px;
}
</style> 