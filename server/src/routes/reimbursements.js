const express = require('express')
const router = express.Router()
const reimbursementController = require('../controllers/reimbursementController')
const { authenticate } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')

// 獲取請款列表
router.get('/', 
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.getReimbursements
)

// 獲取請款詳情
router.get('/:id',
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.getReimbursementById
)

// 創建請款單
router.post('/',
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.createReimbursement
)

// 更新請款單
router.put('/:id',
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.updateReimbursement
)

// 審核請款單
router.post('/:id/review',
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.reviewReimbursement
)

// 刪除請款單
router.delete('/:id',
  authenticate,
  checkPermission('reimbursement'),
  reimbursementController.deleteReimbursement
)

module.exports = router 