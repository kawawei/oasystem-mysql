const sequelize = require('./database')
const { User, syncModels } = require('../models')

// 檢查表是否存在 / Check if table exists
const isTableExists = async (tableName) => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'oa_system_dev' 
      AND table_name = ?
    `
    const [result] = await sequelize.query(query, {
      replacements: [tableName],
      type: sequelize.QueryTypes.SELECT
    })
    return result.count > 0
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return false
  }
}

// 檢查是否有管理員用戶 / Check if admin user exists
const isAdminExists = async () => {
  try {
    const admin = await User.findOne({ where: { username: 'admin' } })
    return !!admin
  } catch (error) {
    console.error('Error checking admin user:', error)
    return false
  }
}

const initDb = async () => {
  try {
    // 檢查 Users 表是否存在 / Check if Users table exists
    const usersTableExists = await isTableExists('Users')
    
    if (!usersTableExists) {
      // 如果表不存在，執行同步（不強制） / If table doesn't exist, sync (not force)
      console.log('Initializing database tables...')
      await syncModels(false)
      console.log('Database tables created')
    } else {
      console.log('Tables already exist, skipping initialization')
    }

    // 檢查是否需要創建初始用戶 / Check if initial users need to be created
    const adminExists = await isAdminExists()
    
    if (!adminExists) {
      console.log('Creating initial users...')
      // 創建默認管理員用戶 / Create default admin user
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

      // 創建測試用戶 / Create test user
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
      console.log('Test user account created')
    } else {
      console.log('Initial users already exist, skipping user creation')
    }
    
    console.log('Database initialization completed')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

module.exports = initDb 