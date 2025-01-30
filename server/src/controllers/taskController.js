const { Task, User } = require('../models')
const { Op } = require('sequelize')

// 獲取任務列表
exports.getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      createdBy,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query

    const where = {}
    
    // 根據查詢參數構建查詢條件
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo
    if (createdBy) where.createdBy = createdBy
    
    // 日期範圍查詢
    if (startDate && endDate) {
      where.dueDate = {
        [Op.between]: [startDate, endDate]
      }
    }
    
    // 標題和描述的模糊搜索
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ],
      order: [[sortBy, sortOrder]],
      attributes: {
        exclude: ['updatedAt']
      }
    })

    res.json(tasks)
  } catch (error) {
    console.error('Error getting tasks:', error)
    res.status(500).json({ message: '獲取任務列表失敗' })
  }
}

// 獲取單個任務
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params
    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ]
    })

    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    res.json(task)
  } catch (error) {
    console.error('Error getting task:', error)
    res.status(500).json({ message: '獲取任務詳情失敗' })
  }
}

// 創建任務
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body

    if (!title) {
      return res.status(400).json({ message: '任務標題不能為空' })
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      createdBy: req.user.id
    })

    // 重新查詢任務以獲取關聯數據
    const newTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ]
    })

    res.status(201).json(newTask)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ message: '創建任務失敗' })
  }
}

// 更新任務
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate
    } = req.body

    const task = await Task.findByPk(id)
    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    // 如果狀態更改為已完成，設置完成時間
    const completedAt = status === 'completed' ? new Date() : null

    await task.update({
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      completedAt
    })

    // 重新查詢任務以獲取關聯數據
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ]
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ message: '更新任務失敗' })
  }
}

// 刪除任務
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params
    const task = await Task.findByPk(id)

    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    // 檢查權限：只有任務創建者或管理員可以刪除任務
    if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '沒有權限刪除此任務' })
    }

    await task.destroy()
    res.json({ message: '任務已刪除' })
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ message: '刪除任務失敗' })
  }
}

// 更新任務狀態
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: '狀態不能為空' })
    }

    const task = await Task.findByPk(id)
    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    // 如果狀態更改為已完成，設置完成時間
    const completedAt = status === 'completed' ? new Date() : null

    await task.update({ status, completedAt })

    // 重新查詢任務以獲取關聯數據
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ]
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    res.status(500).json({ message: '更新任務狀態失敗' })
  }
}

// 獲取任務統計
exports.getTaskStats = async (req, res) => {
  try {
    const stats = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    })

    const priorityStats = await Task.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority']
    })

    res.json({
      statusStats: stats,
      priorityStats
    })
  } catch (error) {
    console.error('Error getting task stats:', error)
    res.status(500).json({ message: '獲取任務統計失敗' })
  }
} 