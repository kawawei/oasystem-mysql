const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Settings = sequelize.define('Settings', {
  systemName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'OA System'
  },
  systemDescription: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '企業辦公自動化系統'
  },
  workStartTime: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '09:00'
  },
  workEndTime: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '18:00'
  },
  lateGracePeriod: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15
  },
  emailNotification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true
})

module.exports = Settings 