require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// 導入所有模型
// Import all models
require('./models');

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
const tutorialCenterRoutes = require('./routes/tutorialCenterRoutes');
const customerRoutes = require('./routes/customerRoutes');
const businessAreaRoutes = require('./routes/businessAreaRoutes');
const customerEmailRoutes = require('./routes/customerEmailRoutes');
const gmailAuthRoutes = require('./routes/gmailAuthRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://oasystem.lihengtech.com.tw'
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}));

// 添加安全標頭
app.use((req, res, next) => {
  // 允許跨源窗口交互
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // 允許跨源資源共享
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // 允許跨源隔離
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 靜態文件服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 註冊路由 / Register routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/tutorial-centers', tutorialCenterRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/business-areas/users', businessAreaRoutes);
app.use('/api/customer-emails', customerEmailRoutes);
app.use('/api/gmail', gmailAuthRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// 初始化數據庫和啟動服務器
const initializeApp = async () => {
  try {
    // 初始化上傳目錄
    await initUploadDirs();
    
    // 只在 INIT_DB 為 true 時初始化數據庫
    // Only initialize database when INIT_DB is true
    if (process.env.INIT_DB === 'true') {
      console.log('Initializing database...');
      await initDb();
      console.log('Database initialized');
    } else {
      console.log('Skipping database initialization...');
    }

    // 啟動服務器
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing app:', error);
    process.exit(1);
  }
};

// 啟動應用
initializeApp();

module.exports = app; 