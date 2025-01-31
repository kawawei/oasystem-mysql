const Settings = require('../models/settings')

// 獲取系統設置
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne()
    res.json(settings || {
      systemName: 'OA System',
      systemDescription: '企業辦公自動化系統',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateGracePeriod: 15,
      emailNotification: false
    })
  } catch (error) {
    res.status(500).json({ message: '獲取設置失敗', error: error.message })
  }
}

// 更新系統設置
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne()
    
    if (settings) {
      Object.assign(settings, req.body)
      await settings.save()
    } else {
      await Settings.create(req.body)
    }
    
    res.json({ message: '設置更新成功' })
  } catch (error) {
    res.status(500).json({ message: '更新設置失敗', error: error.message })
  }
} 