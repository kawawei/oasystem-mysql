const User = require('../models/User');
const { Op } = require('sequelize');
const Permission = require('../models/Permission');
const bcrypt = require('bcryptjs');

// 獲取單個用戶
exports.getUserById = async (id) => {
  try {
    return await User.findByPk(id);
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
};

// 獲取所有用戶
exports.getUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'name', 'role', 'department', 'createdAt', 'status'],
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
    const { username, name, password, role, department, status } = req.body

    // 檢查用戶是否存在
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' })
    }

    // 如果是 admin 用戶，只允許修改部分信息
    if (user.role === 'admin' && user.username === 'admin') {
      // 只允許更新部門和名稱
      const allowedUpdates = {}
      if (name) allowedUpdates.name = name
      if (department !== undefined) allowedUpdates.department = department || null

      // 使用 update 方法
      const [updatedCount] = await User.update(allowedUpdates, {
        where: { id }
      })

      if (updatedCount === 0) {
        return res.status(404).json({ message: '更新失敗，用戶不存在' })
      }

      // 返回更新後的用戶信息
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'username', 'name', 'role', 'department', 'createdAt', 'status']
      })

      return res.json(updatedUser)
    }

    // 驗證狀態值
    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: '無效的狀態值' })
    }

    // 驗證角色
    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: '無效的角色值' })
    }

    // 更新用戶信息
    const updateData = {}
    if (username) {
      // 檢查用戶名是否已存在
      const existingUser = await User.findOne({ where: { username, id: { [Op.ne]: id } } })
      if (existingUser) {
        return res.status(400).json({ message: '用戶名已存在' })
      }
      updateData.username = username
    }
    if (name) updateData.name = name
    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }
    if (role) updateData.role = role
    if (department !== undefined) updateData.department = department || null
    if (status !== undefined) updateData.status = status

    // 使用 update 方法
    const [updatedCount] = await User.update(updateData, {
      where: { id }
    })

    if (updatedCount === 0) {
      return res.status(404).json({ message: '更新失敗，用戶不存在' })
    }

    // 返回更新後的用戶信息（不包含密碼）
    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'username', 'name', 'role', 'department', 'createdAt', 'status']
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
    
    // 先刪除用戶的權限記錄
    await Permission.destroy({
      where: { userId: id }
    });
    
    // 再刪除用戶記錄
    await user.destroy();
    res.json({ message: '用戶已永久刪除' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ message: '刪除用戶失敗' });
  }
}; 