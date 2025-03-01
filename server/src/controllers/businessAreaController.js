const BusinessArea = require('../models/BusinessArea');
const User = require('../models/User');

// 獲取業務人員負責區域
// Get business user's areas
const getBusinessUserAreas = async (req, res) => {
  try {
    const { userId } = req.params;

    // 檢查用戶是否存在
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 獲取用戶的所有負責區域
    // Get all areas assigned to the user
    const areas = await BusinessArea.findAll({
      where: { userId },
      attributes: ['city', 'district'],
      order: [['city', 'ASC'], ['district', 'ASC']]
    });

    res.json(areas);
  } catch (error) {
    console.error('Error getting business user areas:', error);
    res.status(500).json({ message: '獲取業務人員負責區域失敗' });
  }
};

// 更新業務人員負責區域
// Update business user's areas
const updateBusinessUserAreas = async (req, res) => {
  try {
    const { userId } = req.params;
    const { areas } = req.body;

    // 檢查用戶是否存在
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 檢查用戶是否為業務部門
    // Check if user belongs to business department
    if (user.department !== '業務部') {
      return res.status(400).json({ message: '只能為業務部門人員設置負責區域' });
    }

    // 開始事務
    // Start transaction
    await BusinessArea.sequelize.transaction(async (t) => {
      // 刪除用戶現有的所有區域
      // Delete all existing areas for the user
      await BusinessArea.destroy({
        where: { userId },
        transaction: t
      });

      // 創建新的區域記錄
      // Create new area records
      if (areas && areas.length > 0) {
        await BusinessArea.bulkCreate(
          areas.map(area => ({
            userId,
            city: area.city,
            district: area.district
          })),
          { transaction: t }
        );
      }
    });

    // 獲取更新後的區域列表
    // Get updated areas list
    const updatedAreas = await BusinessArea.findAll({
      where: { userId },
      attributes: ['city', 'district'],
      order: [['city', 'ASC'], ['district', 'ASC']]
    });

    res.json(updatedAreas);
  } catch (error) {
    console.error('Error updating business user areas:', error);
    res.status(500).json({ message: '更新業務人員負責區域失敗' });
  }
};

module.exports = {
  getBusinessUserAreas,
  updateBusinessUserAreas
}; 