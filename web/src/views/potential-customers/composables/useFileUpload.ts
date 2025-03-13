import { ElMessageBox } from 'element-plus'

// 附件類型定義 / Attachment type definition
interface Attachment {
  filename: string
  url: string
  size: number
  mimeType: string
  isTemp: boolean
}

export function useFileUpload(form: any) {
  // 處理文件上傳 / Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const maxSize = 20 * 1024 * 1024 // 20MB
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 檢查文件大小 / Check file size
      if (file.size > maxSize) {
        ElMessageBox.alert(`文件 ${file.name} 超過大小限制 (20MB)`, '錯誤')
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        // 上傳到臨時目錄 / Upload to temporary directory
        const response = await fetch(`${baseUrl}/upload?temp=true&type=email`, {
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
        
        // 添加到附件列表 / Add to attachments list
        form.value.attachments.push({
          filename: file.name,
          url: data.data.url,
          size: file.size,
          mimeType: file.type, // 添加 MIME 類型 / Add MIME type
          isTemp: true // 標記為臨時文件 / Mark as temporary file
        })
      } catch (error) {
        console.error('Upload error:', error)
        ElMessageBox.alert(`文件 ${file.name} 上傳失敗`, '錯誤')
      }
    }
  }

  // 移除附件 / Remove attachment
  const removeAttachment = async (index: number) => {
    const attachment = form.value.attachments[index]
    
    // 如果是臨時文件，從服務器刪除 / If temporary file, delete from server
    if (attachment.isTemp) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const filePath = attachment.url.split('/uploads/')[1]
        
        const response = await fetch(`${baseUrl}/upload/${filePath}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('刪除文件失敗')
        }
      } catch (error) {
        console.error('Delete error:', error)
        ElMessageBox.alert(`文件 ${attachment.filename} 刪除失敗`, '錯誤')
        return
      }
    }

    // 從列表中移除 / Remove from list
    form.value.attachments.splice(index, 1)
  }

  // 格式化文件大小 / Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // 移動臨時文件到永久存儲 / Move temporary files to permanent storage
  const moveAttachmentsToPermanent = async () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const tempAttachments = form.value.attachments.filter((a: Attachment) => a.isTemp)
    
    for (const attachment of tempAttachments) {
      try {
        const sourceFile = attachment.url.split('/uploads/')[1]
        const targetDir = attachment.mimeType?.startsWith('image/') 
          ? 'emails/images' 
          : 'emails/files'

        const response = await fetch(`${baseUrl}/upload/move`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sourceFile,
            targetDir
          })
        })

        if (!response.ok) {
          throw new Error('移動文件失敗')
        }

        const data = await response.json()
        
        // 更新附件 URL / Update attachment URL
        attachment.url = data.data.url
        attachment.isTemp = false
      } catch (error) {
        console.error('Move error:', error)
        throw new Error(`文件 ${attachment.filename} 移動失敗`)
      }
    }
  }

  return {
    handleFileUpload,
    removeAttachment,
    formatFileSize,
    moveAttachmentsToPermanent
  }
} 