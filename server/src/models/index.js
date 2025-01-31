const User = require('./user')
const Attendance = require('./attendance')
const Task = require('./task')
const Settings = require('./settings')
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

// Task associations
Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
})

Task.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
})

User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks'
})

User.hasMany(Task, {
  foreignKey: 'createdBy',
  as: 'createdTasks'
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
  Task,
  Settings,
  syncModels
} 