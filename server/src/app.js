require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const settingsRoutes = require('./routes/settings');
const permissionRoutes = require('./routes/permissions');
const postRoutes = require('./routes/posts');
const reimbursementRoutes = require('./routes/reimbursements');
const uploadRoutes = require('./routes/upload');
const accountRoutes = require('./routes/accounts');
const receiptRoutes = require('./routes/receipts');
const initDb = require('./config/initDb');
const initUploadDirs = require('./utils/initUploadDirs');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}));

app.use(express.json());

// 靜態文件服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);

// 先註冊賬戶路由
console.log('Registering account routes...');
app.use('/api/accounts', accountRoutes);
console.log('Account routes registered');

// 其他路由
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/receipts', receiptRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // 初始化上傳目錄
  await initUploadDirs();
  
  // 只在 INIT_DB=true 時初始化數據庫
  if (process.env.INIT_DB === 'true') {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialization completed');
  } else {
    console.log('Skipping database initialization');
    // 只同步表結構
    const { syncModels } = require('./models');
    await syncModels(false);  // 設置為 false，不強制更新
    console.log('Database structure synchronized');
  }
});

module.exports = app; 