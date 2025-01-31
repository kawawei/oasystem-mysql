const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Permission = sequelize.define('Permission', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  granted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'permissionId']
    }
  ]
})

module.exports = Permission 