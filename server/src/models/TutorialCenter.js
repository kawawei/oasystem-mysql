// 補習班模型定義 Tutorial center model definition
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TutorialCenter extends Model {}

TutorialCenter.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '補習班 ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '補習班名稱'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '聯繫電話',
    validate: {
      is: /^[0-9-]+$/i // 只允許數字和連字符 Only allow numbers and hyphens
    }
  },
  city: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '縣市'
  },
  district: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '區域'
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '詳細地址'
  },
  contact: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '窗口聯繫人'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email',
    validate: {
      isEmail: true // Email 格式驗證 Email format validation
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '備註'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '狀態'
  }
}, {
  sequelize,
  modelName: 'TutorialCenter',
  tableName: 'tutorial_centers',
  underscored: true, // 使用下劃線命名 Use underscore naming
  timestamps: true, // 啟用時間戳 Enable timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TutorialCenter; 