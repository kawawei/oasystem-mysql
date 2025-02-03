const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { uploadFile, deleteFile } = require('../controllers/uploadController')
const { authenticate } = require('../middleware/auth')

// 上傳一般文件
router.post('/', authenticate, upload, uploadFile)

// 上傳發票圖片
router.post('/invoice', authenticate, upload, uploadFile)

// 刪除文件（支持子目錄）
router.delete('/*', authenticate, deleteFile)

module.exports = router 