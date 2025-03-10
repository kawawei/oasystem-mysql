const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Gmail 認證模型 / Gmail Authentication Model
const GmailAuth = sequelize.define('GmailAuth', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id',
    comment: '用戶ID / User ID'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Gmail 郵箱地址 / Gmail Address'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'access_token',
    comment: '訪問令牌 / Access Token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'refresh_token',
    comment: '刷新令牌 / Refresh Token'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expiry_date',
    comment: '令牌過期時間 / Token Expiry Date'
  }
}, {
  tableName: 'gmail_auth',
  timestamps: true,
  underscored: true
});

// 定義關聯 / Define associations
GmailAuth.associate = function(models) {
  GmailAuth.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = GmailAuth; 