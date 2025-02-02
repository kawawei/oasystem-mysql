const { Reimbursement, ReimbursementItem, User } = require('../models')
const { Op } = require('sequelize')
const sequelize = require('../config/database')

// 生成請款單號
const generateSerialNumber = async (type) => {
  const today = new Date()
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  // 獲取當天的序號
  const prefix = type === 'reimbursement' ? 'RB' : 'PB'
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))
  
  const count = await Reimbursement.count({
    where: {
      createdAt: {
        [Op.between]: [todayStart, todayEnd]
      },
      type
    }
  })
  
  const serialCount = String(count + 1).padStart(3, '0')
  return `${prefix}${dateStr}${serialCount}`
}

// 獲取請款列表
exports.getReimbursements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      search,
      startDate,
      endDate,
      submitterId,
      reviewerId,
      type
    } = req.query

    const where = {}
    
    // 根據狀態篩選
    if (status) {
      where.status = status
    }

    // 根據類型篩選
    if (type) {
      where.type = type
    }

    // 根據日期範圍篩選
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    }

    // 根據提交人篩選
    if (submitterId) {
      where.submitterId = submitterId
    }

    // 根據審核人篩選
    if (reviewerId) {
      where.reviewerId = reviewerId
    }

    // 搜尋標題或請款人
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { payee: { [Op.like]: `%${search}%` } }
      ]
    }

    const { count, rows } = await Reimbursement.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'username', 'department']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username']
        },
        {
          model: ReimbursementItem,
          as: 'items'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    })

    res.json({
      total: count,
      data: rows,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    })
  } catch (error) {
    console.error('Error getting reimbursements:', error)
    res.status(500).json({ 
      message: '獲取請款列表失敗',
      error: error.message 
    })
  }
}

// 獲取請款詳情
exports.getReimbursementById = async (req, res) => {
  try {
    const { id } = req.params

    const reimbursement = await Reimbursement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'username', 'department']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username']
        },
        {
          model: ReimbursementItem,
          as: 'items'
        }
      ]
    })

    if (!reimbursement) {
      return res.status(404).json({ message: '請款單不存在' })
    }

    res.json(reimbursement)
  } catch (error) {
    console.error('Error getting reimbursement:', error)
    res.status(500).json({ 
      message: '獲取請款詳情失敗',
      error: error.message 
    })
  }
}

// 創建請款單
exports.createReimbursement = async (req, res) => {
  const t = await sequelize.transaction()
  
  try {
    const { 
      type = 'reimbursement',
      title, 
      description, 
      department,
      payee,
      accountNumber,
      bankInfo,
      currency = 'TWD',
      paymentDate,
      items 
    } = req.body
    
    const submitterId = req.user.id

    // 生成請款單號
    const serialNumber = await generateSerialNumber(type)

    // 計算總金額（包含稅額和手續費）
    const totalAmount = items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      const tax = parseFloat(item.tax) || 0
      const fee = parseFloat(item.fee) || 0
      return sum + amount + tax + fee
    }, 0)

    // 創建請款單
    const reimbursement = await Reimbursement.create({
      serialNumber,
      type,
      title,
      description,
      department,
      payee,
      accountNumber,
      bankInfo,
      currency,
      paymentDate: type === 'payable' ? paymentDate : null,
      totalAmount,
      submitterId,
      status: 'pending'
    }, { transaction: t })

    // 創建請款明細
    const reimbursementItems = await Promise.all(
      items.map(item => {
        const amount = parseFloat(item.amount) || 0
        const tax = parseFloat(item.tax) || 0
        const fee = parseFloat(item.fee) || 0
        return ReimbursementItem.create({
          ...item,
          reimbursementId: reimbursement.id,
          total: amount + tax + fee
        }, { transaction: t })
      })
    )

    await t.commit()

    res.status(201).json({
      message: '請款單創建成功',
      data: {
        ...reimbursement.toJSON(),
        items: reimbursementItems
      }
    })
  } catch (error) {
    await t.rollback()
    console.error('Error creating reimbursement:', error)
    res.status(500).json({ 
      message: '創建請款單失敗',
      error: error.message 
    })
  }
}

// 更新請款單
exports.updateReimbursement = async (req, res) => {
  const t = await sequelize.transaction()
  
  try {
    const { id } = req.params
    const { 
      title, 
      description, 
      department,
      payee,
      accountNumber,
      bankInfo,
      currency,
      paymentDate,
      items,
      status 
    } = req.body

    const reimbursement = await Reimbursement.findByPk(id)
    if (!reimbursement) {
      return res.status(404).json({ message: '請款單不存在' })
    }

    // 檢查權限
    if (reimbursement.submitterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '無權修改此請款單' })
    }

    // 只有待審核狀態的請款單可以修改
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ message: '只能修改待審核的請款單' })
    }

    // 如果只是更新狀態
    if (status && !items) {
      await reimbursement.update({ status }, { transaction: t })
      await t.commit()
      return res.json({
        message: '請款單狀態更新成功',
        data: reimbursement
      })
    }

    // 計算總金額
    const totalAmount = items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      const tax = parseFloat(item.tax) || 0
      const fee = parseFloat(item.fee) || 0
      return sum + amount + tax + fee
    }, 0)

    // 更新請款單
    await reimbursement.update({
      title,
      description,
      department,
      payee,
      accountNumber,
      bankInfo,
      currency,
      paymentDate: reimbursement.type === 'payable' ? paymentDate : null,
      totalAmount
    }, { transaction: t })

    // 刪除原有的明細
    await ReimbursementItem.destroy({
      where: { reimbursementId: id },
      transaction: t
    })

    // 創建新的明細
    const reimbursementItems = await Promise.all(
      items.map(item => {
        const amount = parseFloat(item.amount) || 0
        const tax = parseFloat(item.tax) || 0
        const fee = parseFloat(item.fee) || 0
        return ReimbursementItem.create({
          ...item,
          reimbursementId: id,
          total: amount + tax + fee
        }, { transaction: t })
      })
    )

    await t.commit()

    res.json({
      message: '請款單更新成功',
      data: {
        ...reimbursement.toJSON(),
        items: reimbursementItems
      }
    })
  } catch (error) {
    await t.rollback()
    console.error('Error updating reimbursement:', error)
    res.status(500).json({ 
      message: '更新請款單失敗',
      error: error.message 
    })
  }
}

// 審核請款單
exports.reviewReimbursement = async (req, res) => {
  const t = await sequelize.transaction()
  
  try {
    const { id } = req.params
    const { status, reviewComment } = req.body
    const reviewerId = req.user.id

    const reimbursement = await Reimbursement.findByPk(id)
    if (!reimbursement) {
      return res.status(404).json({ message: '請款單不存在' })
    }

    // 如果是提交操作，檢查是否為提交人
    if (status === 'submitted' && reimbursement.submitterId !== req.user.id) {
      return res.status(403).json({ message: '只有提交人可以提交請款單' })
    }

    // 如果是審核操作，檢查是否為管理員
    if ((status === 'approved' || status === 'rejected') && req.user.role !== 'admin') {
      return res.status(403).json({ message: '無權審核請款單' })
    }

    // 更新請款單狀態
    await reimbursement.update({
      status,
      reviewComment,
      reviewerId: status === 'submitted' ? null : reviewerId,
      reviewedAt: status === 'submitted' ? null : new Date()
    }, { transaction: t })

    await t.commit()

    res.json({
      message: status === 'submitted' ? '請款單提交成功' : '請款單審核成功',
      data: reimbursement
    })
  } catch (error) {
    await t.rollback()
    console.error('Error reviewing reimbursement:', error)
    res.status(500).json({ 
      message: '操作失敗',
      error: error.message 
    })
  }
}

// 刪除請款單
exports.deleteReimbursement = async (req, res) => {
  const t = await sequelize.transaction()
  
  try {
    const { id } = req.params

    const reimbursement = await Reimbursement.findByPk(id)
    if (!reimbursement) {
      return res.status(404).json({ message: '請款單不存在' })
    }

    // 檢查權限
    if (reimbursement.submitterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '無權刪除此請款單' })
    }

    // 只有待審核狀態的請款單可以刪除
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ message: '只能刪除待審核的請款單' })
    }

    // 刪除請款單及其明細
    await ReimbursementItem.destroy({
      where: { reimbursementId: id },
      transaction: t
    })
    await reimbursement.destroy({ transaction: t })

    await t.commit()

    res.json({ message: '請款單刪除成功' })
  } catch (error) {
    await t.rollback()
    console.error('Error deleting reimbursement:', error)
    res.status(500).json({ 
      message: '刪除請款單失敗',
      error: error.message 
    })
  }
} 