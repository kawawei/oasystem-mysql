const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  }
}).single('file')

// 創建中間件函數
const uploadMiddleware = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小不能超過 5MB' })
      }
      return res.status(500).json({ error: '文件上傳失敗' })
    }

    try {
      // 確保有文件被上傳
      if (!req.file) {
        return res.status(400).json({ error: '未找到上傳的文件' })
      }

      // 驗證必要的字段
      const { serialNumber, index } = req.body
      if (!serialNumber) {
        return res.status(400).json({ error: '缺少請款單號' })
      }

      // 驗證單號格式
      if (!serialNumber.match(/^[AB]\d{8}\d{3}$/)) {
        return res.status(400).json({ error: '無效的請款單號格式' })
      }

      // 獲取當前日期
      const today = new Date()
      const year = today.getFullYear().toString()
      const month = String(today.getMonth() + 1).padStart(2, '0')

      // 構建目錄路徑
      const subDir = path.join(
        uploadDir,
        'invoices',
        year,
        month,
        serialNumber
      )

      // 創建目錄
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true })
      }

      // 生成文件名
      const fileIndex = index || '1'
      const fileExt = path.extname(req.file.originalname)
      const fileName = `invoice_${fileIndex}${fileExt}`
      const filePath = path.join(subDir, fileName)

      // 寫入文件
      fs.writeFileSync(filePath, req.file.buffer)

      // 將文件路徑添加到請求對象
      req.uploadedFile = {
        filename: fileName,
        path: filePath.replace(uploadDir, '').replace(/\\/g, '/') // 轉換為相對路徑
      }

      next()
    } catch (error) {
      console.error('文件處理失敗：', error)
      return res.status(500).json({ error: '文件處理失敗' })
    }
  })
}

module.exports = uploadMiddleware 