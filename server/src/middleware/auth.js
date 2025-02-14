const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  console.log('Authentication middleware triggered');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);

  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      });
    }
    
    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user id:', decoded.id);
    
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      console.log('User not found for id:', decoded.id);
      return res.status(401).json({
        success: false,
        message: '用戶不存在'
      });
    }
    
    console.log('User found:', user.username);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '無效的認證令牌' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '無權訪問此資源' });
    }
    next();
  };
}; 