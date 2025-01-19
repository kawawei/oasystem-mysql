const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middleware/authMiddleware');

// 所有路由都需要管理員權限
router.use(requireAdmin);

// 獲取所有用戶
router.get('/', userController.getUsers);

// 獲取部門列表
router.get('/departments', userController.getDepartments);

// 獲取單個用戶
router.get('/:id', userController.getUser);

// 創建新用戶
router.post('/', userController.createUser);

// 更新用戶
router.put('/:id', userController.updateUser);

// 刪除用戶
router.delete('/:id', userController.deleteUser);

// 永久刪除用戶
router.delete('/:id/remove', userController.removeUser);

module.exports = router; 