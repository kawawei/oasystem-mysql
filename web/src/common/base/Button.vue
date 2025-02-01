<template>
  <button
    :class="[
      'base-button',
      type,
      size,
      { 
        'is-plain': plain,
        'is-round': round,
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    <i v-if="icon && !loading" :class="icon"></i>
    <span v-if="$slots.default">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'secondary' | 'danger' | 'text'
  size?: 'small' | 'medium' | 'large'
  plain?: boolean
  round?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  plain: false,
  round: false,
  disabled: false,
  loading: false,
  icon: ''
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<style lang="scss" scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0 16px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.primary {
    background: #0071e3;
    color: white;
    
    &:hover {
      background: #0077ed;
    }
    
    &.is-plain {
      background: transparent;
      border: 1px solid #0071e3;
      color: #0071e3;
      
      &:hover {
        background: #f0f7ff;
      }
    }
  }
  
  &.secondary {
    background: #f5f5f7;
    color: #1d1d1f;
    
    &:hover {
      background: #e5e5ea;
    }
    
    &.is-plain {
      background: transparent;
      border: 1px solid #d1d1d6;
      
      &:hover {
        background: #f5f5f7;
      }
    }
  }
  
  &.danger {
    background: #ff3b30;
    color: white;
    
    &:hover {
      background: #ff453a;
    }
    
    &.is-plain {
      background: transparent;
      border: 1px solid #ff3b30;
      color: #ff3b30;
      
      &:hover {
        background: #fff1f0;
      }
    }
  }
  
  &.text {
    background: transparent;
    color: #0071e3;
    padding: 0;
    
    &:hover {
      color: #0077ed;
      transform: none;
      box-shadow: none;
    }
  }
  
  &.small {
    height: 32px;
    font-size: 14px;
  }
  
  &.medium {
    height: 40px;
    font-size: 15px;
  }
  
  &.large {
    height: 48px;
    font-size: 16px;
  }
  
  &.is-round {
    border-radius: 24px;
  }
  
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  &.is-loading {
    cursor: wait;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  i {
    font-size: 16px;
  }
}
</style> 