const User = require('./User')
const Attendance = require('./Attendance')
const sequelize = require('../config/database')

// 建立關聯
User.hasMany(Attendance, {
  foreignKey: 'userId',
  as: 'attendances',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})

Attendance.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
})

// 同步模型
const syncModels = async (force = false) => {
  try {
    // 使用 sequelize.sync() 來同步所有模型
    await sequelize.sync({ force })
    console.log('Database synchronized successfully')
  } catch (error) {
    console.error('Error synchronizing database:', error)
    throw error
  }
}

module.exports = {
  User,
  Attendance,
  syncModels
} 