const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要驗證
router.use(authenticate);

// 獲取所有賬戶
router.get('/', accountController.getAccounts);

// 創建新賬戶
router.post('/', accountController.createAccount);

// 獲取特定賬戶
router.get('/:id', accountController.getAccount);

// 更新賬戶餘額
router.patch('/:id/balance', accountController.updateBalance);

// 停用賬戶（軟刪除）
router.patch('/:id/disable', accountController.disableAccount);

// 啟用賬戶
router.patch('/:id/enable', accountController.enableAccount);

// 檢查賬戶交易記錄
router.get('/:id/transactions/check', accountController.checkAccountTransactions);

// 刪除賬戶
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
