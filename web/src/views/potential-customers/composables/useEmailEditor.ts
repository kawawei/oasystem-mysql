// Quill 編輯器配置和處理
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

  const editorOptions = {
    placeholder: '請輸入郵件內容...',
    modules: {
      toolbar
    }
  }

  // 編輯器就緒時的處理
  const onEditorReady = (quill: any) => {
    console.log('Editor is ready!', quill)
    
    // 註冊附件按鈕
    const toolbar = quill.getModule('toolbar')
    toolbar.addHandler('attachment', () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('multiple', 'multiple')
      input.setAttribute('accept', '*/*')
      input.click()

      input.onchange = () => {
        if (input.files) {
          handleFileUpload(input.files)
        }
      }
    })
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