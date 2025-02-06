const { checkPermission: checkUserPermission } = require('../controllers/permissionController')

// 權限檢查中間件
exports.checkPermission = (permissionId) => {
  return async (req, res, next) => {
    try {
      // 如果用戶是管理員，直接通過
      if (req.user.role === 'admin') {
        return next()
      }

      // 檢查用戶是否有特定權限
      const hasPermission = await checkUserPermission(req.user.id, permissionId)
      
      if (!hasPermission) {
        return res.status(403).json({ message: '無權訪問此資源' })
      }
      
      next()
    } catch (error) {
      console.error('Error checking permission:', error)
      res.status(500).json({ 
        message: '權限檢查失敗',
        error: error.message 
      })
    }
  }
} 