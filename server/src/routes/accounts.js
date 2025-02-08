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

// 刪除賬戶
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
