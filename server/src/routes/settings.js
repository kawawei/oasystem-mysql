const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { authenticate, authorize } = require('../middleware/auth')

// 獲取系統設置
router.get('/', authenticate, authorize('admin'), settingsController.getSettings)

// 更新系統設置
router.post('/', authenticate, authorize('admin'), settingsController.updateSettings)

module.exports = router 