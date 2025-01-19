const User = require('./User')
const Attendance = require('./Attendance')
const sequelize = require('../config/database')

// 建立關聯
User.hasMany(Attendance, {
  foreignKey: 'userId',
  as: 'attendances',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})

Attendance.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
})

// 同步模型
const syncModels = async (force = false) => {
  try {
    // 先刪除所有表
    if (force) {
      await sequelize.query('DROP TABLE IF EXISTS `Attendances`;')
      await sequelize.query('DROP TABLE IF EXISTS `Users`;')
    }

    // 創建 Users 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER auto_increment,
        username VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        department VARCHAR(50),
        position VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        lastLoginAt DATETIME,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `)
    console.log('User table created')

    // 創建 Attendances 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Attendances (
        id INTEGER auto_increment,
        userId INTEGER NOT NULL,
        checkInTime DATETIME,
        checkOutTime DATETIME,
        status ENUM('in', 'out', 'late', 'early', 'normal') DEFAULT 'in',
        date DATE NOT NULL,
        workHours DECIMAL(4,1) COMMENT '工作時數，以0.5小時為單位',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `)
    console.log('All tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

module.exports = {
  User,
  Attendance,
  syncModels
} 