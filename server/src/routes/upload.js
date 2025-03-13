const express = require('express')
const router = express.Router()
const { upload } = require('../middleware/upload')
const { uploadFile, deleteFile, moveFile } = require('../controllers/uploadController')
const { authenticate } = require('../middleware/auth')

// 上傳一般文件 / Upload general file
router.post('/', authenticate, upload.single('file'), uploadFile)

// 上傳發票圖片 / Upload invoice image
router.post('/invoice', authenticate, upload.single('file'), uploadFile)

// 移動文件 / Move file
router.post('/move', authenticate, moveFile)

// 刪除文件（支持子目錄）/ Delete file (supports subdirectories)
router.delete('/*', authenticate, deleteFile)

module.exports = router 