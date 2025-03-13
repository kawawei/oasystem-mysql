// Quill 編輯器配置和處理
import { ElMessageBox } from 'element-plus'

export function useEmailEditor(handleFileUpload: (files: FileList) => void) {
  // Quill 編輯器配置
  const toolbar = {
    container: [
      ['bold', 'italic', 'underline', 'strike'],        // 文字樣式
      ['blockquote', 'code-block'],                     // 引用和代碼塊
      [{ 'header': 1 }, { 'header': 2 }],              // 標題
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],    // 列表
      [{ 'script': 'sub'}, { 'script': 'super' }],     // 上標/下標
      [{ 'indent': '-1'}, { 'indent': '+1' }],         // 縮進
      [{ 'direction': 'rtl' }],                         // 文字方向
      [{ 'size': ['small', false, 'large', 'huge'] }], // 字體大小
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],       // 標題大小
      [{ 'color': [] }, { 'background': [] }],         // 顏色選擇器
      [{ 'font': [] }],                                // 字體
      [{ 'align': [] }],                               // 對齊
      ['clean'],                                        // 清除格式
      ['link', 'image'],                               // 連結和圖片
      [{ 'attachment': 'attachment' }]                  // 附件按鈕（使用格式對象）
    ],
    handlers: {
      image: imageHandler,  // 自定義圖片處理器
      attachment: function() {
        // 創建文件輸入元素
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('multiple', 'multiple')
        input.setAttribute('accept', '*/*')  // 允許所有文件類型
        input.click()

        // 處理文件選擇
        input.onchange = () => {
          if (input.files) {
            handleFileUpload(input.files)
          }
        }
      }
    }
  }

  // 圖片處理器 - 使用 URL 而不是 base64
  async function imageHandler() {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0]
        
        // 檢查文件大小（20MB）
        if (file.size > 20 * 1024 * 1024) {
          ElMessageBox.alert('圖片大小不能超過 20MB', '錯誤')
          return
        }

        try {
          const formData = new FormData()
          formData.append('file', file)

          // 上傳到臨時目錄
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${baseUrl}/upload?temp=true&type=email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error('圖片上傳失敗')
          }

          const data = await response.json()
          
          // 根據環境使用不同的域名
          const domain = import.meta.env.PROD 
            ? 'https://oasystem.lihengtech.com.tw' 
            : window.location.origin;
          
          // 構建完整 URL
          const fullUrl = data.data.url.startsWith('http') 
            ? data.data.url 
            : `${domain}${data.data.url}`;
          
          // 獲取 Quill 實例和當前選擇範圍
          const quill = (toolbar as any).quill
          const range = quill.getSelection(true)

          // 在當前光標位置插入圖片
          quill.insertEmbed(range.index, 'image', fullUrl)
          // 移動光標到圖片後
          quill.setSelection(range.index + 1)
        } catch (error) {
          console.error('Upload error:', error)
          ElMessageBox.alert('圖片上傳失敗', '錯誤')
        }
      }
    }
  }

  const editorOptions = {
    placeholder: '請輸入郵件內容...',
    modules: {
      toolbar
    }
  }

  // 編輯器就緒時的處理
  const onEditorReady = (quill: any) => {
    console.log('Editor is ready!', quill)
    
    // 保存 quill 實例到 toolbar
    ;(toolbar as any).quill = quill
    
    // 註冊附件按鈕
    const toolbarModule = quill.getModule('toolbar')
    toolbarModule.addHandler('attachment', toolbar.handlers.attachment)
    toolbarModule.addHandler('image', imageHandler)
  }

  // 監聽內容變化
  const onTextChange = ({ delta, oldDelta, source }: any) => {
    console.log('Text change!', { delta, oldDelta, source })
  }

  // 監聽選擇範圍變化
  const onSelectionChange = (range: any, oldRange: any, source: any) => {
    console.log('Selection change!', { range, oldRange, source })
  }

  return {
    toolbar,
    editorOptions,
    onEditorReady,
    onTextChange,
    onSelectionChange
  }
} 