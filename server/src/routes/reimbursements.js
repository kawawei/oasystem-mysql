const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')
const { uploadMultiple } = require('../middleware/upload')
const {
  getReimbursements,
  getReimbursementById,
  createReimbursement,
  updateReimbursement,
  deleteReimbursement,
  reviewReimbursement,
  getNextSerialNumber
} = require('../controllers/reimbursementController')

// 獲取請款列表
router.get('/', authenticate, getReimbursements)

// 獲取下一個序號
router.get('/next-serial-number', authenticate, getNextSerialNumber)

// 獲取請款詳情
router.get('/:id', authenticate, getReimbursementById)

// 創建請款單
router.post('/', authenticate, uploadMultiple, createReimbursement)

// 更新請款單
router.put('/:id', authenticate, updateReimbursement)

// 審核請款單
router.post('/:id/review',
  authenticate,
  checkPermission('reimbursement'),
  reviewReimbursement
)

// 刪除請款單
router.delete('/:id', authenticate, deleteReimbursement)

module.exports = router 