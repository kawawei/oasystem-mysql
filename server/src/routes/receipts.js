const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

// 路由定義 Route definitions

// 創建收款記錄 Create receipt record
router.post('/',
    authenticate,
    checkPermission('finance.receipts.create'),
    receiptController.create
);

// 獲取所有收款記錄 Get all receipt records
router.get('/',
    authenticate,
    checkPermission('finance.receipts.view'),
    receiptController.getAll
);

// 獲取單個收款記錄 Get single receipt record
router.get('/:id',
    authenticate,
    checkPermission('finance.receipts.view'),
    receiptController.getOne
);

// 更新收款記錄 Update receipt record
router.put('/:id',
    authenticate,
    checkPermission('finance.receipts.edit'),
    receiptController.update
);

// 刪除收款記錄 Delete receipt record
router.delete('/:id',
    authenticate,
    checkPermission('finance.receipts.delete'),
    receiptController.delete
);

// 更新收款狀態 Update receipt status
router.patch('/:id/status',
    authenticate,
    checkPermission('finance.receipts.edit'),
    receiptController.updateStatus
);

module.exports = router; 