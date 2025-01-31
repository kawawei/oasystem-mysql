const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../controllers/permissionController');

// 所有路由都需要身份驗證
router.use(authenticate);

// 權限中間件
const requirePermission = (permissionId) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await checkPermission(req.user.id, permissionId);
      if (hasPermission) {
        next();
      } else {
        res.status(403).json({ message: '無權訪問此資源' });
      }
    } catch (error) {
      res.status(500).json({ message: '權限檢查失敗' });
    }
  };
};

// 檢查是否可以編輯用戶的中間件
const canEditUser = async (req, res, next) => {
  try {
    // 獲取目標用戶信息
    const targetUser = await userController.getUserById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 檢查是否有 user_setting 權限
    const hasPermission = await checkPermission(req.user.id, 'user_setting');
    
    // 如果目標用戶是管理員，只有管理員可以編輯
    if (targetUser.role === 'admin' && !hasPermission) {
      return res.status(403).json({ message: '無權編輯管理員用戶' });
    }

    // 允許有權限的用戶或非管理員用戶編輯
    if (hasPermission || targetUser.role !== 'admin') {
      next();
    } else {
      res.status(403).json({ message: '無權編輯此用戶' });
    }
  } catch (error) {
    res.status(500).json({ message: '權限檢查失敗' });
  }
};

// 獲取所有用戶 - 需要 user_setting 權限或是獲取自己的信息
router.get('/', async (req, res, next) => {
  const { self } = req.query;
  if (self === 'true') {
    // 如果是獲取自己的信息，直接通過
    req.query.search = req.user.username;
    next();
  } else {
    // 允許所有已認證的用戶獲取用戶列表
    next();
  }
}, userController.getUsers);

// 獲取部門列表 - 允許所有已認證的用戶訪問
router.get('/departments', userController.getDepartments);

// 獲取單個用戶 - 允許所有已認證的用戶訪問
router.get('/:id', userController.getUser);

// 創建新用戶 - 需要 user_setting 權限
router.post('/', requirePermission('user_setting'), userController.createUser);

// 更新用戶 - 需要權限檢查
router.put('/:id', canEditUser, userController.updateUser);

// 刪除用戶 - 需要 user_setting 權限
router.delete('/:id', requirePermission('user_setting'), userController.deleteUser);

// 永久刪除用戶 - 需要 user_setting 權限
router.delete('/:id/remove', requirePermission('user_setting'), userController.removeUser);

module.exports = router; 