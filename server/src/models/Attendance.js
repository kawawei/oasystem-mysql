const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in', 'out', 'late', 'early', 'normal'),
    defaultValue: 'in'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  workHours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
    comment: '工作時數，以0.5小時為單位'
  }
})

module.exports = Attendance 