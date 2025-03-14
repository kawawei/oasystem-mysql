const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '模板名稱 | Template name'
  },
  type: {
    type: DataTypes.ENUM('first_contact', 'general', 'follow_up'),
    allowNull: false,
    defaultValue: 'general',
    comment: '模板類型：首次聯絡、一般模板、追蹤聯絡 | Template type: first contact, general, follow up'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '郵件主旨 | Email subject'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '郵件內容 | Email content'
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  underscored: true,
  comment: '郵件模板表 | Email templates table'
});

module.exports = EmailTemplate; 