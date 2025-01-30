const express = require('express')
const router = express.Router()
const taskController = require('../controllers/taskController')
const { authMiddleware } = require('../middleware/authMiddleware')

// 所有路由都需要驗證
router.use(authMiddleware)

// 獲取任務列表
router.get('/', taskController.getTasks)

// 獲取任務統計
router.get('/stats', taskController.getTaskStats)

// 獲取單個任務
router.get('/:id', taskController.getTask)

// 創建任務
router.post('/', taskController.createTask)

// 更新任務
router.put('/:id', taskController.updateTask)

// 更新任務狀態
router.patch('/:id/status', taskController.updateTaskStatus)

// 刪除任務
router.delete('/:id', taskController.deleteTask)

module.exports = router 