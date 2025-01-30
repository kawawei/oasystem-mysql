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

    // 構建查詢條件
    const where = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo
    if (createdBy) where.createdBy = createdBy
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    }
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
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
      order: [[sortBy, sortOrder]]
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
    const task = await Task.findByPk(req.params.id, {
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
    res.status(500).json({ message: '獲取任務失敗' })
  }
}

// 創建任務
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body
    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      createdBy: req.user.id
    })
    
    res.status(201).json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ message: '創建任務失敗' })
  }
}

// 更新任務
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id)
    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    // 檢查權限：只有管理員、任務創建者和任務負責人可以更新任務
    const isAdmin = req.user.role === 'admin'
    const isCreator = task.createdBy === req.user.id
    const isAssignee = task.assignedTo === req.user.id

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: '沒有權限更新此任務' })
    }

    const { title, description, status, priority, assignedTo, dueDate, report } = req.body
    
    // 如果是負責人，只能更新狀態和工作報告
    if (isAssignee && !isAdmin && !isCreator) {
      if (title || description || priority || assignedTo || dueDate) {
        return res.status(403).json({ message: '負責人只能更新任務狀態和工作報告' })
      }
      
      // 更新狀態和工作報告
      await task.update({
        status: status || task.status,
        report: report || task.report,
        completedAt: status === 'completed' ? new Date() : task.completedAt
      })
    } else {
      // 管理員或創建者可以更新所有字段
      await task.update({
        title: title || task.title,
        description: description || task.description,
        status: status || task.status,
        priority: priority || task.priority,
        assignedTo: assignedTo || task.assignedTo,
        dueDate: dueDate || task.dueDate,
        report: report || task.report,
        completedAt: status === 'completed' ? new Date() : task.completedAt
      })
    }

    res.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ message: '更新任務失敗' })
  }
}

// 刪除任務
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id)
    if (!task) {
      return res.status(404).json({ message: '任務不存在' })
    }

    // 只有管理員和任務創建者可以刪除任務
    if (req.user.role !== 'admin' && task.createdBy !== req.user.id) {
      return res.status(403).json({ message: '沒有權限刪除此任務' })
    }

    await task.destroy()
    res.json({ message: '任務已刪除' })
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ message: '刪除任務失敗' })
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
    
    res.json(stats)
  } catch (error) {
    console.error('Error getting task stats:', error)
    res.status(500).json({ message: '獲取任務統計失敗' })
  }
} 