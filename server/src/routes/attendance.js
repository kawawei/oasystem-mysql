const express = require('express')
const router = express.Router()
const attendanceController = require('../controllers/attendanceController')
const { authMiddleware } = require('../middleware/authMiddleware')

// 所有路由都需要驗證
router.use(authMiddleware)

// 上班打卡
router.post('/check-in', attendanceController.checkIn)

// 下班打卡
router.post('/check-out', attendanceController.checkOut)

// 獲取個人打卡記錄
router.get('/records', attendanceController.getRecords)

// 管理員獲取所有打卡記錄
router.get('/all-records', attendanceController.getAllRecords)

// 管理員獲取月度統計
router.get('/monthly-stats', attendanceController.getMonthlyStats)

// 管理員操作路由
router.put('/records/:id', attendanceController.updateRecord)
router.delete('/records/:id', attendanceController.deleteRecord)

module.exports = router 