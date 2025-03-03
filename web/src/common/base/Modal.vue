<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal" @click.self="handleOverlayClick">
        <div 
          class="modal-content" 
          :class="[size, contentClass]" 
          :style="{ width: width ? (typeof width === 'number' ? width + 'px' : width) : '90%' }"
        >
          <!-- 標題區域 -->
          <div class="modal-header">
            <slot name="header">
              <h2 class="modal-title">{{ title }}</h2>
              <button v-if="showClose" class="close-btn" @click="handleClose">
                <i class="fas fa-times"></i>
              </button>
            </slot>
          </div>

          <!-- 內容區域 -->
          <div class="modal-body">
            <slot></slot>
          </div>

          <!-- 底部按鈕區域 -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
          <div v-else-if="showFooter" class="modal-footer">
            <base-button
              type="secondary"
              @click="handleClose"
            >
              {{ cancelText }}
            </base-button>
            <base-button
              type="primary"
              :loading="confirmLoading"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </base-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import BaseButton from './Button.vue'

interface Props {
  modelValue: boolean
  title?: string
  showClose?: boolean
  showFooter?: boolean
  closeOnClickOverlay?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  size?: 'small' | 'medium' | 'large'
  width?: string | number
  contentClass?: string
  confirmLoading?: boolean
  cancelText?: string
  confirmText?: string
  beforeClose?: (done: () => void) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showClose: true,
  showFooter: true,
  closeOnClickOverlay: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  size: 'medium',
  confirmLoading: false,
  cancelText: '取消',
  confirmText: '確認'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm'): void
}>()

// 處理關閉
const handleClose = () => {
  if (props.beforeClose) {
    props.beforeClose(() => {
      emit('update:modelValue', false)
      emit('close')
    })
  } else {
    emit('update:modelValue', false)
    emit('close')
  }
}

// 處理遮罩點擊
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay && props.closeOnClickModal) {
    handleClose()
  }
}

// 處理確認
const handleConfirm = () => {
  emit('confirm')
}

// 添加 ESC 按鍵監聽
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnPressEscape && props.modelValue) {
    handleClose()
  }
}

// 在組件掛載時添加事件監聽
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 在組件卸載時移除事件監聽
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 監聽 modelValue 變化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
}

.modal-content {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  width: v-bind('props.width ? (typeof props.width === "number" ? props.width + "px" : props.width) : "90%"');
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  
  &.small {
    max-width: 400px;
  }
  
  &.medium {
    max-width: 600px;
  }
  
  &.large {
    max-width: 800px;
  }

  // 確保自定義寬度優先級高於預設尺寸
  &[style*="width"] {
    max-width: none !important;
  }
}

.modal-header {
  padding: $spacing-xl;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
}

.close-btn {
  background: none;
  border: none;
  color: $text-secondary;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: $radius-base;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: $background-light;
    color: $text-primary;
  }
}

.modal-body {
  padding: $spacing-xl;
  overflow-y: auto;
  flex: 1;
  @include custom-scrollbar;
}

.modal-footer {
  padding: $spacing-lg $spacing-xl;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
  gap: $spacing-xl;
}

// 過渡動畫
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from {
  opacity: 0;
  
  .modal-content {
    transform: translateY(-20px);
  }
}

.modal-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: translateY(20px);
  }
}

@include mobile {
  .modal-content {
    width: 95%;
    margin: $spacing-md;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: $spacing-lg;
  }
}
</style> 