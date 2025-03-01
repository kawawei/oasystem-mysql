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
const BusinessArea = require('./BusinessArea')

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
  Receipt,
  BusinessArea
}

// 調用每個模型的 associate 方法來建立關聯
// Call associate method of each model to establish relationships
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models))

// 同步所有模型到數據庫 Sync all models to database
const syncModels = async (force = false) => {
  try {
    // 如果不是強制同步，則只進行普通同步
    // If not force sync, just do normal sync
    if (!force) {
      for (const { model } of createOrder) {
        await model.sync({ force: false });
        console.log(`Synced table: ${model.tableName}`);
      }
      console.log('All models synchronized successfully');
      return;
    }

    // 以下是強制同步的邏輯，只在 force = true 時執行
    // Following is force sync logic, only execute when force = true
    // 按照依賴關係順序同步模型（先刪除有外鍵約束的表）
    // Sync models in dependency order (drop tables with foreign key constraints first)
    const dropOrder = [
      'receipts',
      'reimbursement_items',
      'reimbursements',
      'Attendances',
      'Tasks',
      'posts',
      'business_areas',
      'contact_records',
      'customers',
      'tutorial_centers',
      'Permissions',
      'Settings',
      'account_transactions',
      'accounts',
      'Users'
    ]

    // 先刪除所有表
    // Drop all tables first
    for (const tableName of dropOrder) {
      await sequelize.query(`DROP TABLE IF EXISTS ${tableName}`)
      console.log(`Dropped table: ${tableName}`)
    }

    // 按照創建順序同步模型（先創建沒有外鍵依賴的表）
    // Sync models in creation order (create tables without foreign key dependencies first)
    const createOrder = [
      { model: User, force: true },
      { model: Account, force: false },
      { model: Settings, force: false },
      { model: Permission, force: false },
      { model: TutorialCenter, force: false },
      { model: Customer, force: false },
      { model: ContactRecord, force: false },
      { model: BusinessArea, force: false },
      { model: Task, force: false },
      { model: Post, force: false },
      { model: Attendance, force: false },
      { model: Reimbursement, force: false },
      { model: ReimbursementItem, force: false },
      { model: Receipt, force: false }
    ]

    // 創建所有表
    // Create all tables
    for (const { model, force: forceSync } of createOrder) {
      await model.sync({ force: forceSync })
      console.log(`Created table: ${model.tableName}`)
    }

    console.log('All models synchronized successfully')
  } catch (error) {
    console.error('Error synchronizing models:', error)
    throw error
  }
}

module.exports = {
  ...models,
  syncModels
}