const User = require('./User')
const Attendance = require('./Attendance')
const Task = require('./Task')
const Settings = require('./Settings')
const Post = require('./Post')
const Reimbursement = require('./Reimbursement')
const ReimbursementItem = require('./ReimbursementItem')
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

// Post associations
Post.belongsTo(User, {
  foreignKey: 'reviewerId',
  as: 'reviewer'
})

Post.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
})

User.hasMany(Post, {
  foreignKey: 'reviewerId',
  as: 'reviewingPosts'
})

User.hasMany(Post, {
  foreignKey: 'creatorId',
  as: 'createdPosts'
})

// Reimbursement associations
Reimbursement.belongsTo(User, {
  foreignKey: 'submitterId',
  as: 'submitter'
})

Reimbursement.belongsTo(User, {
  foreignKey: 'reviewerId',
  as: 'reviewer'
})

User.hasMany(Reimbursement, {
  foreignKey: 'submitterId',
  as: 'submittedReimbursements'
})

User.hasMany(Reimbursement, {
  foreignKey: 'reviewerId',
  as: 'reviewingReimbursements'
})

Reimbursement.hasMany(ReimbursementItem, {
  foreignKey: 'reimbursementId',
  as: 'items'
})

ReimbursementItem.belongsTo(Reimbursement, {
  foreignKey: 'reimbursementId',
  as: 'reimbursement'
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
  Post,
  Reimbursement,
  ReimbursementItem,
  syncModels
} 