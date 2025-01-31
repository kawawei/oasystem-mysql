require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const settingsRoutes = require('./routes/settings');
const permissionRoutes = require('./routes/permissions');
const initDb = require('./config/initDb');

const app = express();

// Middleware
app.use(cors({
  origin: true, // 允許所有來源，我們將在生產環境中通過 Nginx 來控制
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 預檢請求的結果可以被快取 24 小時
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/permissions', permissionRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // 只在 INIT_DB=true 時初始化數據庫
  if (process.env.INIT_DB === 'true') {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialization completed');
  } else {
    console.log('Skipping database initialization');
    // 只同步表結構
    const { syncModels } = require('./models');
    await syncModels(false);
    console.log('Database structure synchronized');
  }
});

module.exports = app; 