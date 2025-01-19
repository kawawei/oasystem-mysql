<template>
  <Transition name="toast">
    <div v-if="isVisible" class="toast" :class="type">
      <div class="toast-content">
        <span class="icon">
          <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </span>
        <span class="message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type: 'success' | 'error'
  duration?: number
}>()

const isVisible = ref(false)
let timer: number | null = null

onMounted(() => {
  isVisible.value = true
  timer = window.setTimeout(() => {
    isVisible.value = false
  }, props.duration || 3000)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 12px 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &.success {
    background: rgba(52, 199, 89, 0.9);
  }
  
  &.error {
    background: rgba(255, 59, 48, 0.9);
  }
  
  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .icon {
      display: flex;
      align-items: center;
      
      svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
      }
    }
    
    .message {
      letter-spacing: -0.2px;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style> 