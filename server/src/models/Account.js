const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('accounts', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  initial_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  current_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  deleted_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '刪除者ID / Account deleter ID'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '刪除時間 / Deletion time'
  },
  last_transaction_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最後交易時間 / Last transaction time'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'accounts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Account;

// 同步數據庫結構
Account.sync({ alter: true }).then(() => {
  console.log('Account model synced');
}).catch(error => {
  console.error('Error syncing Account model:', error);
});
