const User = require('../models/User');
const { Op } = require('sequelize');

// 獲取所有用戶
exports.getUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const where = {
      status: 'active' // 只返回活躍用戶
    };
    
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'name', 'role', 'department', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: '獲取用戶列表失敗' });
  }
};

// 獲取單個用戶
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    res.json(User.safeUserData(user));
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: '獲取用戶信息失敗' });
  }
};

// 創建新用戶
exports.createUser = async (req, res) => {
  try {
    const { username, name, password } = req.body;
    
    // 檢查必填字段
    if (!username || !name || !password) {
      return res.status(400).json({ 
        message: '缺少必要字段',
        required: ['username', 'name', 'password']
      });
    }

    // 檢查用戶名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用戶名已存在' });
    }
    
    const user = await User.create({
      username,
      name,
      password,
      role: req.body.role || 'user',
      department: req.body.department,
      status: 'active'
    });
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: '創建用戶失敗' });
  }
};

// 更新用戶
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { username, name, password, role, department } = req.body

    // 檢查用戶是否存在
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' })
    }

    // 如果是 admin 用戶，不允許修改
    if (user.role === 'admin' && user.username === 'admin') {
      return res.status(403).json({ message: '不能修改管理員帳號' })
    }

    // 更新用戶信息
    const updateData = {}
    if (username) updateData.username = username
    if (name) updateData.name = name
    if (password) updateData.password = password
    if (role) updateData.role = role
    if (department !== undefined) updateData.department = department

    await user.update(updateData)

    // 返回更新後的用戶信息（不包含密碼）
    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'username', 'name', 'role', 'department', 'createdAt']
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ message: '更新用戶失敗' })
  }
}

// 刪除用戶
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }
    
    // 不允許刪除管理員帳號
    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能刪除管理員帳號' });
    }
    
    // 軟刪除：將狀態設為 inactive
    await user.update({ status: 'inactive' });
    res.json({ message: '用戶已停用' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: '停用用戶失敗' });
  }
};

// 獲取部門列表
exports.getDepartments = async (req, res) => {
  try {
    const departments = await User.findAll({
      attributes: ['department'],
      where: {
        department: {
          [Op.not]: null
        }
      },
      group: ['department']
    });

    res.json(departments.map(d => d.department));
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ message: '獲取部門列表失敗' });
  }
};

// 永久刪除用戶
exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }
    
    // 不允許刪除管理員帳號
    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能刪除管理員帳號' });
    }
    
    // 永久刪除用戶
    await user.destroy();
    res.json({ message: '用戶已永久刪除' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ message: '刪除用戶失敗' });
  }
}; 