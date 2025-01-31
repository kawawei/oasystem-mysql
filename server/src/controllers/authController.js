const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    // 檢查用戶是否存在，使用 withPassword 作用域
    const user = await User.scope('withPassword').findOne({ where: { username } });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: '用戶名或密碼錯誤' });
    }
    
    console.log('Found user:', {
      id: user.id,
      username: user.username,
      role: user.role,
      hashedPassword: user.password
    });
    
    // 檢查用戶狀態
    if (user.status === 'inactive') {
      console.log('Inactive user attempted to login:', username);
      return res.status(403).json({ message: '帳號已被停用' });
    }
    
    // 驗證密碼
    const isPasswordValid = await user.checkPassword(password);
    console.log('Password validation:', { username, isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ message: '用戶名或密碼錯誤' });
    }
    
    // 更新最後登錄時間
    await user.updateLastLogin();
    
    // 生成 JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful:', { username, role: user.role });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服務器錯誤' });
  }
}; 