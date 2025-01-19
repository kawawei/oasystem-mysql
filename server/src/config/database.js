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
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // 強制重建表結構
    await sequelize.sync({ force: true });
    console.log('Database synchronized');
    
    // 檢查是否已經有管理員帳號
    const User = require('../models/User');
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
  }
};

initializeDatabase();

module.exports = sequelize; 