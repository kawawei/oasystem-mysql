const Settings = require('../models/settings')

const defaultSettings = {
  systemName: 'OA System',
  systemDescription: '企業辦公自動化系統',
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateGracePeriod: 15,
  emailNotification: false
}

// 獲取系統設置
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne()
    
    if (!settings) {
      settings = await Settings.create(defaultSettings)
    }
    
    res.json(settings)
  } catch (error) {
    res.status(500).json({ message: '獲取設置失敗', error: error.message })
  }
}

// 更新系統設置
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne()
    
    if (settings) {
      Object.assign(settings, req.body)
      settings = await settings.save()
    } else {
      settings = await Settings.create(req.body)
    }
    
    res.json({ 
      message: '設置更新成功',
      data: settings
    })
  } catch (error) {
    res.status(500).json({ message: '更新設置失敗', error: error.message })
  }
} 