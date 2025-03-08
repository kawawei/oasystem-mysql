const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Permission = sequelize.define('Permission', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
  tableName: 'permissions',
  timestamps: true,
  underscored: true
})

module.exports = Permission 