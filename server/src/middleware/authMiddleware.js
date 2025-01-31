const jwt = require('jsonwebtoken')
const User = require('../models/user')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: '未提供認證令牌' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '無效的認證令牌格式' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id)
    
    if (!user) {
      return res.status(401).json({ message: '用戶不存在' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ message: '認證失敗' })
  }
}

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: '未提供認證令牌' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '無效的認證令牌格式' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id)
    
    if (!user) {
      return res.status(401).json({ message: '用戶不存在' })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理員權限' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    return res.status(403).json({ message: '權限驗證失敗' })
  }
}

module.exports = {
  authMiddleware,
  requireAdmin
} 