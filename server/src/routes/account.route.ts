import express from 'express'
import { AccountController } from '../controllers/account.controller'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

// 所有帳戶相關的路由都需要驗證
router.use(authMiddleware)

// 創建帳戶
router.post('/', AccountController.create)

// 獲取帳戶列表
router.get('/', AccountController.getAll)

// 獲取特定帳戶
router.get('/:id', AccountController.getById)

// 更新帳戶餘額
router.patch('/:id/balance', AccountController.updateBalance)

// 刪除帳戶
router.delete('/:id', AccountController.delete)

export default router
