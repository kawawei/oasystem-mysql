const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ReimbursementItem = sequelize.define('ReimbursementItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reimbursementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reimbursements',
      key: 'id'
    },
    comment: '請款單ID'
  },
  accountCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '會計科目代碼'
  },
  accountName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '科目名稱'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '支出日期'
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '支出描述'
  },
  quantity: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1',
    comment: '數量/價格'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '金額'
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '稅額'
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '手續費'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '總額（含稅和手續費）'
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '發票號碼'
  },
  invoiceImage: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '發票圖片路徑'
  }
}, {
  tableName: 'reimbursement_items',
  timestamps: true
})

module.exports = ReimbursementItem 