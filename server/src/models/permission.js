const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Permission = sequelize.define('Permission', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  permissionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'permission_id'
  },
  granted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'Permissions',
  timestamps: true,
  underscored: true
})

// 定義關聯
Permission.associate = function(models) {
  Permission.belongsTo(models.User, {
    foreignKey: {
      name: 'userId',
      field: 'user_id'
    },
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
}

module.exports = Permission 