// 客戶模型定義 Customer model definition
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Customer extends Model {}

Customer.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '客戶 ID'
  },
  tutorial_center_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '關聯的補習班 ID',
    references: {
      model: 'tutorial_centers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'new',           // 新名單
      'interested',    // 有意願
      'in_progress',   // 考慮中
      'not_interested',// 無意願
      'no_answer',     // 未接聽
      'busy',          // 忙碌中
      'invalid',       // 空號
      'call_back',     // 預約回撥
      'visited',       // 已拜訪
      'contracted'     // 已簽約
    ),
    defaultValue: 'new',
    comment: '客戶狀態'
  },
  last_contact_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最後聯繫時間'
  }
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 定義關聯關係 Define associations
Customer.associate = (models) => {
  // 與補習班的關聯 Association with tutorial center
  Customer.belongsTo(models.TutorialCenter, {
    foreignKey: 'tutorial_center_id',
    as: 'tutorialCenter'
  });

  // 與通話記錄的關聯 Association with contact records
  Customer.hasMany(models.ContactRecord, {
    foreignKey: 'customer_id',
    as: 'contactRecords'
  });
};

module.exports = Customer; 