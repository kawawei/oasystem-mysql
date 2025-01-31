const Permission = require('../models/permission')
const User = require('../models/user')

// 定義所有可能的權限
const ALL_PERMISSIONS = {
  'attendance_record': true,  // 將考勤記錄設為默認 true
  'attendance_management': false,
  'tasks': true,
  'task_management': false,
  'user_setting': false,
  'basic_settings': false
}

// 定義默認權限（不允許修改）
const DEFAULT_PERMISSIONS = [
  'tasks',  // 任務列表為默認權限（僅對普通用戶）
  'attendance_record'  // 考勤記錄為默認權限（僅對普通用戶）
]

// 定義管理員核心權限（不允許修改）
const ADMIN_CORE_PERMISSIONS = [
  'attendance_management',
  'task_management',
  'user_setting',
  'basic_settings'
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

    // 如果是管理員，返回權限設置
    if (user.role === 'admin') {
      console.log('Admin user, returning permissions')
      const adminPermissions = Object.keys(ALL_PERMISSIONS).reduce((acc, key) => {
        // 如果是核心權限，設為 true
        if (ADMIN_CORE_PERMISSIONS.includes(key)) {
          acc[key] = true
        } else {
          // 其他權限從數據庫獲取，如果沒有則使用默認值
          acc[key] = ALL_PERMISSIONS[key]
        }
        return acc
      }, {})

      // 獲取管理員的可修改權限
      const adminDbPermissions = await Permission.findAll({
        where: { userId },
        attributes: ['permissionId', 'granted']
      })

      // 更新可修改的權限
      adminDbPermissions.forEach(permission => {
        if (!ADMIN_CORE_PERMISSIONS.includes(permission.permissionId)) {
          adminPermissions[permission.permissionId] = permission.granted
        }
      })

      return res.json(adminPermissions)
    }

    // 獲取普通用戶的所有權限
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

    // 確保普通用戶的默認權限始終為 true
    DEFAULT_PERMISSIONS.forEach(permissionId => {
      permissionMap[permissionId] = true
    })

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

    if (user.role === 'admin') {
      // 管理員只能修改非核心權限
      const invalidUpdate = Object.entries(permissions).some(([permissionId]) => 
        ADMIN_CORE_PERMISSIONS.includes(permissionId)
      )

      if (invalidUpdate) {
        return res.status(403).json({ message: '不能修改管理員的核心權限' })
      }
    } else {
      // 普通用戶不能修改默認權限
      const attemptingToModifyDefault = Object.entries(permissions).some(([permissionId, granted]) => 
        DEFAULT_PERMISSIONS.includes(permissionId) && !granted
      )

      if (attemptingToModifyDefault) {
        return res.status(403).json({ message: '不能修改默認權限' })
      }
    }

    // 批量更新權限
    const permissionUpdates = Object.entries(permissions).map(([permissionId, granted]) => {
      // 如果是普通用戶的默認權限，確保它始終為 true
      if (!user.role === 'admin' && DEFAULT_PERMISSIONS.includes(permissionId)) {
        granted = true
      }
      return Permission.upsert({
        userId,
        permissionId,
        granted
      })
    })

    await Promise.all(permissionUpdates)
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

    // 如果是普通用戶，確保默認權限始終為 true
    if (user.role !== 'admin') {
      DEFAULT_PERMISSIONS.forEach(permissionId => {
        permissionMap[permissionId] = true
      })
    }

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

    if (user.role === 'admin') {
      // 如果是管理員核心權限，直接返回 true
      if (ADMIN_CORE_PERMISSIONS.includes(permissionId)) {
        return true
      }
      // 對於其他權限，檢查數據庫中的設置
      const permission = await Permission.findOne({
        where: { userId, permissionId }
      })
      return permission ? permission.granted : ALL_PERMISSIONS[permissionId]
    }

    // 如果是普通用戶的默認權限，直接返回 true
    if (DEFAULT_PERMISSIONS.includes(permissionId)) {
      return true
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