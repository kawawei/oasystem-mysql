// 客戶路由 Customer routes
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

// 獲取客戶列表 Get customer list
router.get('/', auth.authenticate, (req, res, next) => {
  customerController.list(req, res).catch(next);
});

// 更新客戶狀態 Update customer status
router.put('/:id/status', auth.authenticate, (req, res, next) => {
  customerController.updateStatus(req, res).catch(next);
});

// 獲取客戶詳情 Get customer details
router.get('/:id', auth.authenticate, (req, res, next) => {
  customerController.getDetails(req, res).catch(next);
});

// 通話記錄相關路由 Contact record routes
// 添加通話記錄 Add contact record
router.post('/:id/contact-records', auth.authenticate, (req, res, next) => {
  customerController.addContactRecord(req, res).catch(next);
});

// 獲取通話記錄列表 Get contact records list
router.get('/:id/contact-records', auth.authenticate, (req, res, next) => {
  customerController.getContactRecords(req, res).catch(next);
});

// 更新補習班資料 Update tutorial center information
router.put('/:id/tutorial-center', auth.authenticate, (req, res, next) => {
  customerController.updateTutorialCenter(req, res).catch(next);
});

// 從意向列表中移除客戶 Remove customer from interested list
router.put('/:id/remove-from-interested', auth.authenticate, (req, res, next) => {
  customerController.removeFromInterested(req, res).catch(next);
});

module.exports = router; 