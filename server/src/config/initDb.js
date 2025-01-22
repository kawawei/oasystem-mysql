const sequelize = require('./database')
const { User, Attendance, syncModels } = require('../models')

const initDb = async () => {
  try {
    // 強制重建所有表
    await syncModels(true)
    console.log('Database tables created')
    
    // 創建默認用戶，使用明文密碼，讓 User 模型的 beforeCreate hook 來處理密碼哈希
    await User.create({
      username: 'admin',
      name: '管理員',
      password: '123456',
      role: 'admin',
      department: '管理部',
      position: '系統管理員',
      email: 'admin@example.com',
      phone: '0912345678',
      status: 'active'
    })
    console.log('Admin account created')

    await User.create({
      username: 'user1',
      name: '測試用戶',
      password: '123456',
      role: 'user',
      department: '業務部',
      position: '業務專員',
      email: 'user1@example.com',
      phone: '0923456789',
      status: 'active'
    })
    console.log('User account created')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

module.exports = initDb 