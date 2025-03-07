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
    allowNull: true,
    comment: '補習班名稱',
    index: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '聯繫電話',
    index: true
  },
  city: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '縣市',
    index: true
  },
  district: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '區域',
    index: true
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '詳細地址'
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '窗口聯繫人',
    index: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Email',
    index: true
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
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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

// 定義關聯關係 Define associations
TutorialCenter.associate = (models) => {
  // 與客戶的關聯 Association with customers
  TutorialCenter.hasOne(models.Customer, {
    foreignKey: 'tutorial_center_id',
    as: 'customer'
  });
};

// 添加複合索引
const TutorialCenterIndexes = [
  {
    name: 'idx_city_district',
    fields: ['city', 'district']
  }
]

module.exports = TutorialCenter; 