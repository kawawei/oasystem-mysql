// 通話記錄模型定義 Contact record model definition
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ContactRecord extends Model {}

ContactRecord.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '通話記錄 ID'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '關聯的客戶 ID',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  call_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '通話時間',
    validate: {
      isDate: true
    }
  },
  result: {
    type: DataTypes.ENUM(
      'answered',     // 已接聽
      'no_answer',    // 未接聽
      'busy',         // 忙碌中
      'invalid',      // 空號
      'wrong_number'  // 號碼有誤
    ),
    allowNull: false,
    comment: '通話結果'
  },
  intention: {
    type: DataTypes.ENUM(
      'interested',     // 有意願
      'not_interested', // 無意願
      'considering',    // 考慮中
      'irrelevant'     // 不相關
    ),
    allowNull: true,
    comment: '意向程度（僅在已接聽時有效）',
    validate: {
      isValidIntention(value) {
        if (this.result === 'answered' && !value) {
          throw new Error('當通話結果為已接聽時，必須指定意向程度');
        }
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '備註',
    validate: {
      len: [0, 1000] // 限制備註長度不超過 1000 字
    }
  }
}, {
  sequelize,
  modelName: 'ContactRecord',
  tableName: 'contact_records',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 定義關聯關係 Define associations
ContactRecord.associate = (models) => {
  ContactRecord.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });
};

module.exports = ContactRecord; 