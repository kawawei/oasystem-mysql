const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Reimbursement = sequelize.define('Reimbursement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serialNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '請款單號'
  },
  type: {
    type: DataTypes.ENUM('reimbursement', 'payable'),
    allowNull: false,
    defaultValue: 'reimbursement',
    comment: '類型：請款/應付'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '請款標題'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '總金額'
  },
  currency: {
    type: DataTypes.ENUM('TWD', 'CNY'),
    allowNull: false,
    defaultValue: 'TWD',
    comment: '幣種'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '狀態：待審核、已通過、已拒絕'
  },
  submitterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: '提交人ID'
  },
  payee: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '請款人'
  },
  accountNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '付款帳號'
  },
  bankInfo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '支付帳號'
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '付款日期（僅應付類型需要）'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: '審核人ID'
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '審核意見'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '審核時間'
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '部門'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '說明'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'PDF 附件信息，包含文件名和 URL'
  }
}, {
  tableName: 'reimbursements',
  timestamps: true
})

module.exports = Reimbursement 