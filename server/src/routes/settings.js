const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { authenticateToken, isAdmin } = require('../middleware/auth')

// 獲取系統設置
router.get('/', authenticateToken, isAdmin, settingsController.getSettings)

// 更新系統設置
router.post('/', authenticateToken, isAdmin, settingsController.updateSettings)

module.exports = router 