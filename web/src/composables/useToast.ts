import { h, render } from 'vue'
import Toast from '../components/Toast.vue'

interface ToastOptions {
  message: string
  type: 'success' | 'error'
  duration?: number
}

export function useToast() {
  const show = (options: ToastOptions) => {
    const container = document.createElement('div')
    
    const vnode = h(Toast, {
      ...options,
      onDestroy: () => {
        render(null, container)
        document.body.removeChild(container)
      }
    })
    
    render(vnode, container)
    document.body.appendChild(container)
  }
  
  return {
    success: (message: string, duration?: number) => 
      show({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => 
      show({ message, type: 'error', duration })
  }
} 