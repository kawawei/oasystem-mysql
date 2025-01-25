require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const initDb = require('./config/initDb');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // 允許沒有 origin 的請求（例如本地請求）
    if (!origin) return callback(null, true);
    
    // 檢查 origin 是否在允許列表中
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['http://localhost:3000', 'http://13.250.109.239', 'https://oasystem.lihengtech.com.tw']
      : ['http://localhost:3000'];
      
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

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