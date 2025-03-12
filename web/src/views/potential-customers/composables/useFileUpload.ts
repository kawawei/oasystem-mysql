import { ElMessageBox } from 'element-plus'

export function useFileUpload(form: any) {
  // 處理文件上傳
  const handleFileUpload = async (files: FileList) => {
    const maxSize = 20 * 1024 * 1024 // 20MB
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 檢查文件大小
      if (file.size > maxSize) {
        ElMessageBox.alert(`文件 ${file.name} 超過大小限制 (20MB)`, '錯誤')
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${baseUrl}/upload?temp=true`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error('上傳失敗')
        }

        const data = await response.json()
        
        // 添加到附件列表
        form.value.attachments.push({
          filename: file.name,
          url: data.url,
          size: file.size
        })
      } catch (error) {
        console.error('Upload error:', error)
        ElMessageBox.alert(`文件 ${file.name} 上傳失敗`, '錯誤')
      }
    }
  }

  // 移除附件
  const removeAttachment = (index: number) => {
    form.value.attachments.splice(index, 1)
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return {
    handleFileUpload,
    removeAttachment,
    formatFileSize
  }
} 