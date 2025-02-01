import { createVNode, render, type App } from 'vue'
import Message from '@/common/base/Message.vue'

export interface MessageInstance {
  show: (content: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => number
  close: (id: number) => void
}

let messageInstance: MessageInstance | null = null

const createMessage = (): MessageInstance => {
  // 創建容器
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // 創建 vnode
  const vnode = createVNode(Message)
  render(vnode, container)
  
  return vnode.component?.exposed as MessageInstance
}

const message = {
  show(content: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) {
    if (!messageInstance) {
      messageInstance = createMessage()
    }
    return messageInstance.show(content, type, duration)
  },
  
  success(content: string, duration?: number) {
    return this.show(content, 'success', duration)
  },
  
  error(content: string, duration?: number) {
    return this.show(content, 'error', duration)
  },
  
  warning(content: string, duration?: number) {
    return this.show(content, 'warning', duration)
  },
  
  info(content: string, duration?: number) {
    return this.show(content, 'info', duration)
  }
}

export default {
  install(app: App) {
    app.config.globalProperties.$message = message
  }
}

export { message } 