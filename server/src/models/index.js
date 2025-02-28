const User = require('./User')
const Attendance = require('./Attendance')
const Task = require('./Task')
const Settings = require('./Settings')
const Post = require('./Post')
const Reimbursement = require('./Reimbursement')
const ReimbursementItem = require('./ReimbursementItem')
const Account = require('./Account')
const Receipt = require('./Receipt')
const sequelize = require('../config/database')
const TutorialCenter = require('./TutorialCenter')
const Customer = require('./Customer')
const ContactRecord = require('./ContactRecord')
const Permission = require('./Permission')

// 建立關聯 Create associations
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

Reimbursement.belongsTo(Account, {
  foreignKey: 'accountId',
  as: 'account'
})

User.hasMany(Reimbursement, {
  foreignKey: 'submitterId',
  as: 'submittedReimbursements'
})

User.hasMany(Reimbursement, {
  foreignKey: 'reviewerId',
  as: 'reviewingReimbursements'
})

Account.hasMany(Reimbursement, {
  foreignKey: 'accountId',
  as: 'reimbursements'
})

Reimbursement.hasMany(ReimbursementItem, {
  foreignKey: 'reimbursementId',
  as: 'items'
})

ReimbursementItem.belongsTo(Reimbursement, {
  foreignKey: 'reimbursementId',
  as: 'reimbursement'
})

// Receipt associations
Receipt.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver'
})

User.hasMany(Receipt, {
  foreignKey: 'receiverId',
  as: 'receipts'
})

// 添加 Receipt 和 Account 之間的關聯 Add association between Receipt and Account
Receipt.belongsTo(Account, {
  foreignKey: 'accountId',
  as: 'account'
})

Account.hasMany(Receipt, {
  foreignKey: 'accountId',
  as: 'receipts'
})

// 建立模型關聯 Create model associations
const models = {
  TutorialCenter,
  Customer,
  ContactRecord,
  User,
  Permission,
  Post,
  Task,
  Attendance,
  Settings,
  Reimbursement,
  ReimbursementItem,
  Account,
  Receipt
}

// 調用每個模型的 associate 方法來建立關聯
// Call associate method of each model to establish relationships
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models))

// 同步所有模型到數據庫 Sync all models to database
const syncModels = async (force = false) => {
  try {
    await Promise.all(Object.values(models).map(model => 
      model.sync({ force })
    ))
    console.log('Models synchronized successfully')
  } catch (error) {
    console.error('Error synchronizing models:', error)
    throw error
  }
}

module.exports = {
  ...models,
  syncModels
}