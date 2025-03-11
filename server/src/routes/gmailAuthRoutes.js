const express = require('express');
const router = express.Router();
const gmailController = require('../controllers/gmailController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要認證 / All routes require authentication
router.use(authenticate);

// 獲取Gmail授權URL / Get Gmail authorization URL
router.get('/auth-url', gmailController.getAuthorizationUrl);

// 處理Gmail OAuth回調 / Handle Gmail OAuth callback
router.get('/callback', gmailController.handleCallback);

// 發送郵件 / Send email
router.post('/send', gmailController.sendEmail);

// 檢查Gmail授權狀態 / Check Gmail authorization status
router.get('/status', gmailController.checkAuthStatus);

// 移除Gmail授權 / Remove Gmail authorization
router.delete('/auth', gmailController.removeAuth);

module.exports = router; 