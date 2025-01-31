const express = require('express')
const router = express.Router()
const permissionController = require('../controllers/permissionController')
const { authenticate, authorize } = require('../middleware/auth')

// 獲取用戶權限 - 需要身份驗證，但不需要管理員權限
router.get('/:userId', authenticate, permissionController.getUserPermissions)

// 更新用戶權限 - 需要管理員權限
router.put('/:userId', authenticate, authorize('admin'), permissionController.updateUserPermissions)

module.exports = router 