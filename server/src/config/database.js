const { Sequelize } = require('sequelize');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const bcryptjs = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'mysql-dev',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'oa_system_dev',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  retry: {
    max: 10,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    backoffBase: 1000,
    backoffExponent: 1.5,
  }
});

const initializeDatabase = async () => {
  try {
    // 嘗試連接數據庫
    let retries = 5;
    while (retries > 0) {
      try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`Failed to connect to database. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 禁用外鍵檢查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 刪除所有表
    await sequelize.query('DROP TABLE IF EXISTS `Attendances`');
    await sequelize.query('DROP TABLE IF EXISTS `Users`');
    console.log('Existing tables dropped');

    // 重新啟用外鍵檢查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // 創建表
    const User = require('../models/User');
    await User.sync({ force: false });
    console.log('User table created');

    const Attendance = require('../models/Attendance');
    await Attendance.sync({ force: false });
    console.log('All tables created successfully');
    
    // 檢查是否已經有管理員帳號
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    // 只有在沒有管理員帳號時才創建
    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash('123456', 10);
      await User.create({
        username: 'admin',
        name: '管理員',
        password: hashedPassword,
        role: 'admin',
        department: '管理部',
        position: '系統管理員',
        email: 'admin@example.com',
        phone: '0912345678',
        status: 'active'
      });
      console.log('Admin account created');

      // 創建測試用戶
      await User.create({
        username: 'user1',
        name: '一般用戶',
        password: hashedPassword,
        role: 'user',
        department: '業務部',
        position: '業務專員',
        email: 'user1@example.com',
        phone: '0923456789',
        status: 'active'
      });
      console.log('User account created');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

initializeDatabase();

module.exports = sequelize; 