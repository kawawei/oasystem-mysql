const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  systemName: {
    type: String,
    required: true,
    default: 'OA System'
  },
  systemDescription: {
    type: String,
    required: true,
    default: '企業辦公自動化系統'
  },
  workStartTime: {
    type: String,
    required: true,
    default: '09:00'
  },
  workEndTime: {
    type: String,
    required: true,
    default: '18:00'
  },
  lateGracePeriod: {
    type: Number,
    required: true,
    default: 15
  },
  emailNotification: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Settings', settingsSchema) 