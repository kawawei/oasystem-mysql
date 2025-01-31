const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'instagram'),
    allowNull: false
  },
  postTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'revision', 'approved', 'published'),
    defaultValue: 'pending'
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mediaFiles: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'posts',
  timestamps: true
});

module.exports = Post; 