<template>
  <Teleport to="body">
    <TransitionGroup 
      name="message"
      tag="div"
      class="message-container"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :class="[msg.type]"
      >
        <i :class="getIcon(msg.type)"></i>
        <span class="message-content">{{ msg.content }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  id: number
  content: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const messages = ref<Message[]>([])
let messageId = 0

const getIcon = (type: Message['type']) => {
  const iconMap = {
    success: 'fas fa-check',
    error: 'fas fa-times',
    warning: 'fas fa-exclamation',
    info: 'fas fa-info'
  }
  return iconMap[type]
}

const show = (content: string, type: Message['type'] = 'info', duration = 3000) => {
  const id = messageId++
  const message: Message = {
    id,
    content,
    type,
    duration
  }
  
  messages.value.push(message)
  
  if (duration > 0) {
    setTimeout(() => {
      close(id)
    }, duration)
  }
  
  return id
}

const close = (id: number) => {
  const index = messages.value.findIndex(msg => msg.id === id)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

// 導出方法供其他組件使用
defineExpose({
  show,
  close
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.message-container {
  position: fixed;
  top: $spacing-xl;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-message;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  pointer-events: none;
}

.message {
  @include flex-row($spacing-xs);
  padding: $spacing-sm $spacing-xl;
  border-radius: $radius-base;
  font-size: $font-size-base;
  pointer-events: auto;
  min-width: 200px;
  max-width: 80vw;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-base;
  
  i {
    font-size: $font-size-base;
  }
  
  .message-content {
    font-weight: 500;
  }
  
  &.success {
    background: $success-color;
    color: white;
    
    i {
      color: white;
    }
  }
  
  &.error {
    background: $error-color;
    color: white;
    
    i {
      color: white;
    }
  }
  
  &.warning {
    background: $warning-color;
    color: white;
    
    i {
      color: white;
    }
  }
  
  &.info {
    background: $info-color;
    color: white;
    
    i {
      color: white;
    }
  }
}

// 過渡動畫
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@include mobile {
  .message {
    min-width: auto;
    width: calc(100vw - #{$spacing-xl * 2});
    margin: 0 $spacing-lg;
  }
}
</style> 