import { message } from '@/plugins/message'

type MessageType = 'success' | 'error' | 'warning' | 'info'

export function useMessage() {
  const showMessage = (content: string, type: MessageType = 'info') => {
    switch (type) {
      case 'success':
        message.success(content)
        break
      case 'error':
        message.error(content)
        break
      case 'warning':
        message.warning(content)
        break
      case 'info':
        message.info(content)
        break
    }
  }

  return {
    showMessage
  }
} 