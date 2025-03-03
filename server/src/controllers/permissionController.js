const Permission = require('../models/Permission')
const User = require('../models/User')

// 定義所有可能的權限
const ALL_PERMISSIONS = {
  'attendance_record': true,  // 將考勤記錄設為默認 true
  'attendance_management': false,
  'tasks': true,             // 任務列表默認 true
  'task_management': false,
  'user_setting': false,
  'basic_settings': false,
  'post_management': false,  // 貼文管理權限默認 false
  'posts': true,            // 貼文列表默認 true
  'finance': false,         // 財務管理權限默認 false
  'reimbursement': false,   // 請款管理權限默認 false
  'manage_leads': false,    // 陌生客戶管理權限默認 false
  'manage_prospects': false, // 意向客戶管理權限默認 false
  'manage_customers': false, // 合作客戶管理權限默認 false
  'manage_business': false  // 業務管理權限默認 false
}

// 定義默認權限（不允許修改）
const DEFAULT_PERMISSIONS = [
  'tasks',             // 任務列表為默認權限
  'attendance_record'  // 考勤記錄為默認權限
]

// 定義管理員核心權限（不允許修改）
const ADMIN_CORE_PERMISSIONS = [
  'attendance_management',
  'task_management',
  'user_setting',
  'basic_settings'
]

// 定義管理員可修改的權限
const ADMIN_MODIFIABLE_PERMISSIONS = [
  'attendance_record',
  'tasks',
  'posts',
  'post_management',
  'finance',           // 將財務管理設為可修改權限
  'reimbursement',     // 將請款管理設為可修改權限
  'manage_leads',      // 添加陌生客戶管理權限
  'manage_prospects',  // 添加意向客戶管理權限
  'manage_customers',  // 添加合作客戶管理權限
  'manage_business',   // 添加業務管理權限
  'manage_call_records',          // 添加電訪管理權限
  'manage_prospect_follow_ups',   // 添加跟進記錄權限
  'manage_customer_contracts'     // 添加合約管理權限
]

// 獲取用戶權限
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Getting permissions for user:', userId)
    
    // 檢查用戶是否存在
    const user = await User.findByPk(userId)
    if (!user) {
      console.log('User not found:', userId)
      return res.status(404).json({ message: '用戶不存在' })
    }

    // 確保用戶只能獲取自己的權限，除非是管理員
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      console.log('Unauthorized access attempt:', req.user.id, 'tried to access', userId)
      return res.status(403).json({ message: '無權訪問此資源' })
    }

    // 獲取用戶的所有權限
    const permissions = await Permission.findAll({
      where: { userId },
      attributes: ['permissionId', 'granted']
    })

    console.log('Found permissions:', permissions)

    // 從默認權限開始
    const permissionMap = { ...ALL_PERMISSIONS }
    
    // 用數據庫中的實際權限覆蓋默認值
    permissions.forEach(permission => {
      permissionMap[permission.permissionId] = permission.granted
    })

    // 如果是管理員，確保核心權限為 true
    if (user.role === 'admin') {
      ADMIN_CORE_PERMISSIONS.forEach(permissionId => {
        permissionMap[permissionId] = true
      })
    } else {
      // 如果是普通用戶，確保默認權限為 true
      DEFAULT_PERMISSIONS.forEach(permissionId => {
        permissionMap[permissionId] = true
      })
    }

    console.log('Returning permissions:', permissionMap)
    res.json(permissionMap)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    res.status(500).json({ 
      message: '獲取用戶權限失敗',
      error: error.message 
    })
  }
}

// 更新用戶權限
exports.updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params
    const { permissions } = req.body

    console.log('Updating permissions for user:', userId, 'with:', permissions)

    // 檢查用戶是否存在
    const user = await User.findByPk(userId)
    if (!user) {
      console.log('User not found:', userId)
      return res.status(404).json({ message: '用戶不存在' })
    }

    // 如果是管理員用戶，只允許修改指定的權限
    if (user.role === 'admin') {
      console.log('Modifying admin permissions')
      const attemptingToModifyCore = Object.entries(permissions).some(([permissionId, granted]) => 
        !ADMIN_MODIFIABLE_PERMISSIONS.includes(permissionId) && 
        ADMIN_CORE_PERMISSIONS.includes(permissionId) && 
        !granted
      )

      if (attemptingToModifyCore) {
        console.log('Attempted to modify admin core permissions')
        return res.status(403).json({ message: '不能修改管理員的核心權限' })
      }

      // 只更新允許修改的權限
      const permissionUpdates = Object.entries(permissions)
        .filter(([permissionId]) => ADMIN_MODIFIABLE_PERMISSIONS.includes(permissionId))
        .map(([permissionId, granted]) => {
          return Permission.upsert({
            userId,
            permissionId,
            granted
          })
        })

      await Promise.all(permissionUpdates)
    } else {
      // 檢查是否嘗試修改默認權限
      const attemptingToModifyDefault = Object.entries(permissions).some(([permissionId, granted]) => 
        DEFAULT_PERMISSIONS.includes(permissionId) && !granted
      )

      if (attemptingToModifyDefault) {
        console.log('Attempted to modify default permissions')
        return res.status(403).json({ message: '不能修改默認權限' })
      }

      // 批量更新權限
      const permissionUpdates = Object.entries(permissions).map(([permissionId, granted]) => {
        // 如果是默認權限，確保它始終為 true
        if (DEFAULT_PERMISSIONS.includes(permissionId)) {
          granted = true
        }
        return Permission.upsert({
          userId,
          permissionId,
          granted
        })
      })

      await Promise.all(permissionUpdates)
    }

    console.log('Permissions updated successfully')

    // 獲取更新後的權限
    const updatedPermissions = await Permission.findAll({
      where: { userId },
      attributes: ['permissionId', 'granted']
    })

    // 從默認權限開始
    const permissionMap = { ...ALL_PERMISSIONS }
    
    // 用數據庫中的實際權限覆蓋默認值
    updatedPermissions.forEach(permission => {
      permissionMap[permission.permissionId] = permission.granted
    })

    // 確保默認權限始終為 true
    DEFAULT_PERMISSIONS.forEach(permissionId => {
      permissionMap[permissionId] = true
    })

    // 如果是管理員，確保核心權限始終為 true
    if (user.role === 'admin') {
      ADMIN_CORE_PERMISSIONS.forEach(permissionId => {
        permissionMap[permissionId] = true
      })
    }

    console.log('Returning updated permissions:', permissionMap)
    res.json({
      message: '權限更新成功',
      permissions: permissionMap
    })
  } catch (error) {
    console.error('Error updating user permissions:', error)
    res.status(500).json({ 
      message: '更新用戶權限失敗',
      error: error.message 
    })
  }
}

// 檢查用戶是否有特定權限
exports.checkPermission = async (userId, permissionId) => {
  try {
    console.log('Checking permission:', permissionId, 'for user:', userId)
    
    // 先檢查用戶是否是管理員
    const user = await User.findByPk(userId)
    if (!user) {
      return false
    }

    // 如果是默認權限，直接返回 true
    if (DEFAULT_PERMISSIONS.includes(permissionId)) {
      return true
    }

    if (user.role === 'admin') {
      console.log('User is admin, permission granted')
      return true // 管理員擁有所有權限
    }

    // 如果是管理員核心權限，檢查用戶是否為管理員
    if (ADMIN_CORE_PERMISSIONS.includes(permissionId)) {
      return user.role === 'admin'
    }

    // 查找特定權限
    const permission = await Permission.findOne({
      where: { userId, permissionId }
    })

    const hasPermission = permission ? permission.granted : false
    console.log('Permission check result:', hasPermission)
    return hasPermission
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
} 