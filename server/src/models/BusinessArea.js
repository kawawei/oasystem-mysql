const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 業務人員負責區域模型
// Business user area model
const BusinessArea = sequelize.define('business_areas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'business_areas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'city', 'district']
    }
  ]
});

// 定義關聯方法
// Define association method
BusinessArea.associate = function(models) {
  BusinessArea.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
    targetKey: 'id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
};

module.exports = BusinessArea;