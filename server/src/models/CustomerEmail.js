// 客戶郵件模型定義 Customer email model definition
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const validator = require('validator');

class CustomerEmail extends Model {}

CustomerEmail.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '郵件 ID | Email ID'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: '關聯的客戶 ID（可選） | Associated customer ID (optional)',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  to: {
    type: DataTypes.STRING,
    allowNull: true,  // 允許為空
    comment: '收件人郵箱 | Recipient email',
    validate: {
      isEmailOrEmpty(value) {
        if (value && value.trim() && !value.includes('@')) {
          throw new Error('Invalid email format');
        }
      }
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '郵件主題 | Email subject'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '郵件內容 | Email content'
  },
  status: {
    type: DataTypes.ENUM(
      'draft',      // 草稿 | Draft
      'sent',       // 已發送 | Sent
      'failed',     // 發送失敗 | Failed
      'scheduled'   // 預定發送 | Scheduled
    ),
    defaultValue: 'draft',
    comment: '郵件狀態 | Email status'
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '預定發送時間 | Scheduled sending time'
  },
  sent_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '實際發送時間 | Actual sending time'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件列表 | List of attachments'
  }
}, {
  sequelize,
  modelName: 'CustomerEmail',
  tableName: 'customer_emails',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 定義關聯關係 Define associations
CustomerEmail.associate = (models) => {
  // 與客戶的關聯 Association with customer
  CustomerEmail.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });
};

module.exports = CustomerEmail; 