const express = require('express')
const router = express.Router()
const permissionController = require('../controllers/permissionController')
const { authenticate, authorize } = require('../middleware/auth')

// 所有路由都需要管理員權限
router.use(authenticate, authorize('admin'))

// 獲取用戶權限
router.get('/:userId', permissionController.getUserPermissions)

// 更新用戶權限
router.put('/:userId', permissionController.updateUserPermissions)

module.exports = router 