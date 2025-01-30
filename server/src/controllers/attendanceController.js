const Attendance = require('../models/Attendance')
const { Op } = require('sequelize')

// 格式化時間為24小時制
const formatTime = (date) => {
  if (!date) return null
  
  // 如果是字符串，先轉換為Date對象
  const dateObj = date instanceof Date ? date : new Date(date)
  
  // 檢查是否為有效日期
  if (isNaN(dateObj.getTime())) return null
  
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  
  // 格式化為兩位數
  const formattedHours = hours.toString().padStart(2, '0')
  const formattedMinutes = minutes.toString().padStart(2, '0')
  
  return `${formattedHours}:${formattedMinutes}`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return null
  
  // 如果是字符串，先轉換為Date對象
  const dateObj = date instanceof Date ? date : new Date(date)
  
  // 檢查是否為有效日期
  if (isNaN(dateObj.getTime())) return null
  
  return dateObj.toISOString().split('T')[0]
}

// 計算工作時數
const calculateWorkHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return null
  
  const diffMinutes = (checkOutTime - checkInTime) / (1000 * 60)
  
  // 如果工作時間少於15分鐘，返回0
  if (diffMinutes < 15) return 0
  
  // 將分鐘數轉換為小時
  const hours = diffMinutes / 60
  
  // 將小時數向上取整到最近的0.5
  return Math.ceil(hours * 2) / 2
}

const attendanceController = {
  // 上班打卡
  async checkIn(req, res) {
    try {
      const userId = req.user.id
      const now = new Date()
      // 設置為台灣時區
      const taiwanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      
      console.log('Check-in attempt:', {
        userId,
        currentTime: taiwanTime.toISOString(),
        formattedDate: formatDate(taiwanTime)
      })
      
      // 檢查今天是否已經打卡
      const today = formatDate(taiwanTime)
      
      const existingRecord = await Attendance.findOne({
        where: {
          userId,
          date: today
        }
      })

      if (existingRecord) {
        console.log('Found existing record:', {
          id: existingRecord.id,
          userId: existingRecord.userId,
          date: existingRecord.date,
          checkInTime: existingRecord.checkInTime,
          checkOutTime: existingRecord.checkOutTime,
          status: existingRecord.status,
          formattedCheckInTime: formatTime(existingRecord.checkInTime),
          formattedCheckOutTime: formatTime(existingRecord.checkOutTime)
        })
        return res.status(400).json({ 
          message: '今天已經打卡了',
          data: {
            checkInTime: formatTime(existingRecord.checkInTime),
            checkOutTime: formatTime(existingRecord.checkOutTime),
            status: existingRecord.status
          }
        })
      }

      console.log('No existing record found, creating new attendance record')

      // 創建打卡記錄，狀態設為 'in'
      const attendance = await Attendance.create({
        userId,
        checkInTime: taiwanTime,
        date: today,
        status: 'in'
      })

      console.log('Created new attendance record:', {
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
        formattedCheckInTime: formatTime(attendance.checkInTime)
      })
      
      res.json({ 
        message: '打卡成功', 
        data: {
          ...attendance.toJSON(),
          checkInTime: formatTime(attendance.checkInTime),
          checkOutTime: formatTime(attendance.checkOutTime)
        }
      })
    } catch (error) {
      console.error('Check-in error:', error)
      res.status(500).json({ message: '打卡失敗' })
    }
  },

  // 下班打卡
  async checkOut(req, res) {
    try {
      const userId = req.user.id
      const now = new Date()
      // 設置為台灣時區
      const taiwanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      
      // 查找今天的打卡記錄
      const today = formatDate(taiwanTime)
      console.log('Looking for record on date:', today)

      const record = await Attendance.findOne({
        where: {
          userId,
          date: today
        }
      })

      if (!record) {
        return res.status(400).json({ message: '今天還沒有打卡記錄' })
      }

      console.log('Found record for checkout:', record)

      if (record.checkOutTime) {
        return res.status(400).json({ message: '今天已經簽退了' })
      }

      // 更新簽退時間
      record.checkOutTime = taiwanTime
      // 計算工作時數
      const hours = (taiwanTime - record.checkInTime) / (1000 * 60 * 60)
      record.workHours = Number(hours.toFixed(1))
      // 更新狀態為 'out'
      record.status = 'out'
      await record.save()

      console.log('Updated record after checkout:', record)
      res.json({ 
        message: '簽退成功', 
        data: {
          ...record.toJSON(),
          checkInTime: formatTime(record.checkInTime),
          checkOutTime: formatTime(record.checkOutTime)
        }
      })
    } catch (error) {
      console.error('Check-out error:', error)
      res.status(500).json({ message: '簽退失敗' })
    }
  },

  // 獲取打卡記錄
  async getRecords(req, res) {
    try {
      const userId = req.user.id
      const { startDate, endDate } = req.query
      
      const where = { userId }
      
      if (startDate && endDate) {
        where.date = {
          [Op.between]: [startDate, endDate]
        }
      }

      const records = await Attendance.findAll({
        where,
        order: [['date', 'DESC']],
        include: [{
          model: require('../models/User'),
          as: 'user',
          attributes: ['username', 'name']
        }]
      })

      // 格式化時間
      const formattedRecords = records.map(record => {
        const plainRecord = record.toJSON()
        return {
          ...plainRecord,
          checkInTime: formatTime(record.checkInTime),
          checkOutTime: formatTime(record.checkOutTime),
          date: formatDate(record.date)
        }
      })

      res.json(formattedRecords)
    } catch (error) {
      console.error('Get records error:', error)
      res.status(500).json({ message: '獲取記錄失敗' })
    }
  },

  // 管理員獲取所有用戶的打卡記錄
  async getAllRecords(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '權限不足' })
      }

      const { startDate, endDate, userId } = req.query
      const where = {}
      
      if (startDate && endDate) {
        where.date = {
          [Op.between]: [startDate, endDate]
        }
      }

      if (userId) {
        where.userId = userId
      }

      const records = await Attendance.findAll({
        where,
        order: [['date', 'DESC']],
        include: [{
          model: require('../models/User'),
          as: 'user',
          attributes: ['username', 'name']
        }]
      })

      // 格式化時間
      const formattedRecords = records.map(record => {
        const plainRecord = record.toJSON()
        return {
          ...plainRecord,
          date: formatDate(record.date),
          checkInTime: record.checkInTime ? formatTime(record.checkInTime) : null,
          checkOutTime: record.checkOutTime ? formatTime(record.checkOutTime) : null
        }
      })

      res.json(formattedRecords)
    } catch (error) {
      console.error('Get all records error:', error)
      res.status(500).json({ message: '獲取記錄失敗' })
    }
  },

  // 更新打卡記錄
  async updateRecord(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '權限不足' })
      }

      const { id } = req.params
      const { date, checkInTime, checkOutTime } = req.body
      
      const record = await Attendance.findByPk(id)
      if (!record) {
        return res.status(404).json({ message: '找不到該記錄' })
      }

      // 更新記錄
      record.date = date
      record.checkInTime = checkInTime ? new Date(checkInTime) : null
      record.checkOutTime = checkOutTime ? new Date(checkOutTime) : null
      
      // 根據是否有下班時間來設置狀態
      record.status = record.checkOutTime ? 'out' : 'in'
      
      // 重新計算工作時數
      if (record.checkInTime && record.checkOutTime) {
        record.workHours = calculateWorkHours(record.checkInTime, record.checkOutTime)
      } else {
        record.workHours = null
      }
      
      await record.save()

      res.json({
        ...record.toJSON(),
        checkInTime: record.checkInTime ? formatTime(record.checkInTime) : null,
        checkOutTime: record.checkOutTime ? formatTime(record.checkOutTime) : null
      })
    } catch (error) {
      console.error('Update record error:', error)
      res.status(500).json({ message: '更新記錄失敗' })
    }
  },

  // 刪除打卡記錄
  async deleteRecord(req, res) {
    try {
      // 檢查是否為管理員
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '權限不足' })
      }

      const { id } = req.params
      
      const record = await Attendance.findByPk(id)
      if (!record) {
        return res.status(404).json({ message: '找不到該記錄' })
      }

      await record.destroy()
      res.json({ message: '記錄已刪除' })
    } catch (error) {
      console.error('Delete record error:', error)
      res.status(500).json({ message: '刪除記錄失敗' })
    }
  },

  // 獲取月度統計
  async getMonthlyStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '權限不足' });
      }

      const { startDate, endDate, userId } = req.query;
      
      // 驗證日期
      if (!startDate || !endDate) {
        return res.status(400).json({ message: '請提供開始和結束日期' });
      }

      // 構建查詢條件
      const where = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };

      // 如果提供了userId，添加到查詢條件
      if (userId) {
        where.userId = userId;
      }

      // 獲取所有用戶的考勤記錄
      const records = await Attendance.findAll({
        where,
        include: [{
          model: require('../models/User'),
          as: 'user',
          attributes: ['id', 'username', 'name', 'department']
        }]
      });

      // 按用戶分組統計
      const userStats = {};
      records.forEach(record => {
        const userId = record.user.id;
        if (!userStats[userId]) {
          userStats[userId] = {
            userId: record.user.id,
            username: record.user.username,
            name: record.user.name,
            department: record.user.department,
            totalWorkHours: 0,
            totalDays: 0,
            lateCount: 0,
            earlyCount: 0,
            records: []
          };
        }

        // 更新統計數據
        if (record.workHours) {
          userStats[userId].totalWorkHours += Number(record.workHours);
        }
        userStats[userId].totalDays += 1;
        if (record.status === 'late') userStats[userId].lateCount += 1;
        if (record.status === 'early') userStats[userId].earlyCount += 1;

        // 添加詳細記錄
        userStats[userId].records.push({
          date: formatDate(record.date),
          checkInTime: formatTime(record.checkInTime),
          checkOutTime: formatTime(record.checkOutTime),
          workHours: record.workHours,
          status: record.status
        });
      });

      res.json(Object.values(userStats));
    } catch (error) {
      console.error('Get monthly stats error:', error);
      res.status(500).json({ message: '獲取月度統計失敗' });
    }
  }
}

module.exports = attendanceController 