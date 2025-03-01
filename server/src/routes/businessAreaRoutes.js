const express = require('express');
const router = express.Router();
const { getBusinessUserAreas, updateBusinessUserAreas } = require('../controllers/businessAreaController');
const { authenticateToken } = require('../middleware/auth');

// 獲取用戶的業務區域
// Get user's business areas
router.get('/:userId/areas', getBusinessUserAreas);

// 更新用戶的業務區域
// Update user's business areas
router.put('/:userId/areas', updateBusinessUserAreas);

module.exports = router; 