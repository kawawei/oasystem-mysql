const sequelize = require('./database')
const { User, Attendance, syncModels } = require('../models')

const initDb = async () => {
  try {
    // 檢查 Users 表是否存在
    const [results] = await sequelize.query(
      "SHOW TABLES LIKE 'Users'"
    )
    
    const isFirstRun = results.length === 0
    
    if (isFirstRun) {
      // 第一次運行，同步所有表
      await syncModels(true)
      console.log('Database tables created')
      
      // 創建默認用戶，使用明文密碼，讓 User 模型的 beforeCreate hook 來處理密碼哈希
      await User.create({
        username: 'admin',
        name: '管理員',
        password: '123456',
        role: 'admin'
      })
      console.log('Admin account created')

      await User.create({
        username: 'user1',
        name: '測試用戶',
        password: '123456',
        role: 'user'
      })
      console.log('User account created')
    } else {
      // 非第一次運行，只同步表結構
      await syncModels(false)
      console.log('Database synchronized')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

module.exports = initDb 