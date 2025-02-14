const { Reimbursement, ReimbursementItem, User, Account } = require('../models')
const { Op } = require('sequelize')
const sequelize = require('../config/database')
const path = require('path')
const fs = require('fs')

// 生成請款單號
const generateSerialNumber = async (type) => {
  // 使用 UTC+8 時間
  const today = new Date()
  today.setHours(today.getHours() + 8)
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  // 獲取當天的序號
  const prefix = type === 'reimbursement' ? 'A' : 'B'  // 請款用 A，應付用 B
  
  // 使用 UTC+8 的日期範圍
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  todayStart.setHours(todayStart.getHours() - 8) // 轉回 UTC 時間以配合數據庫查詢
  
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)
  todayEnd.setHours(todayEnd.getHours() - 8) // 轉回 UTC 時間以配合數據庫查詢
  
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
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'name', 'currency', 'current_balance']
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
      payee,
      paymentTarget,
      accountNumber,
      bankInfo,
      currency = 'TWD',
      paymentDate,
      items: itemsJson,
      attachments: attachmentsJson
    } = req.body

    const items = JSON.parse(itemsJson)
    const attachments = attachmentsJson ? JSON.parse(attachmentsJson) : []
    const files = req.files
    
    const submitterId = req.user.id

    // 生成請款單號
    const serialNumber = await generateSerialNumber(type)
    console.log('生成的請款單號:', serialNumber)

    // 從序號中提取年月信息
    const year = serialNumber.substring(1, 5)
    const month = serialNumber.substring(5, 7)
    console.log('年份:', year)
    console.log('月份:', month)

    // 確保上傳目錄存在
    const uploadDir = path.join('/app', 'uploads', 'invoices', year, month, serialNumber)
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true })
      console.log('創建目錄:', uploadDir)
    } catch (error) {
      console.error('創建目錄失敗:', error)
      throw new Error('創建上傳目錄失敗')
    }

    // 處理 PDF 附件
    console.log('開始處理 PDF 附件')
    console.log('attachments:', attachments)
    console.log('req.files:', req.files)
    console.log('req.body.attachmentUrls:', req.body.attachmentUrls)
    
    const processedAttachments = []
    const tempFiles = [] // 記錄需要清理的暫存文件

    // 處理已上傳的 PDF 文件
    if (attachments && attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i]
        
        // 如果有 URL，表示文件在暫存區
        if (attachment.url) {
          const urlParts = attachment.url.split('/uploads/')
          if (urlParts.length > 1) {
            const tempPath = path.join('/app/uploads', urlParts[1])
            tempFiles.push(tempPath)
            console.log('記錄暫存文件路徑:', tempPath)

            // 生成新的文件名（使用請款單號-編號的格式）
            const extension = path.extname(attachment.originalName)
            const newFilename = `${serialNumber}-${i + 1}${extension}`
            const newPath = path.join(uploadDir, newFilename)

            try {
              // 讀取暫存文件
              const fileContent = await fs.promises.readFile(tempPath)
              // 寫入到新位置
              await fs.promises.writeFile(newPath, fileContent)
              console.log('PDF 文件已移動到:', newPath)

              // 添加到處理後的附件列表
              processedAttachments.push({
                filename: newFilename,
                originalName: attachment.originalName,
                url: `/uploads/invoices/${year}/${month}/${serialNumber}/${newFilename}`
              })
            } catch (error) {
              console.error('移動 PDF 文件失敗:', error)
              throw new Error('移動 PDF 文件失敗')
            }
          }
        }
      }
    }

    // 處理文件上傳
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log('處理第', i, '個項目')
      console.log('可用的文件:', files ? Object.keys(files) : 'no files')
      
      if (item.hasNewFile && files) {
        // 嘗試不同的可能的鍵名格式
        const file = files[i] || files[`${i}`] || files[`files[${i}]`] || files[`file${i}`]
        if (file) {
          console.log('找到文件:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          })
          
          // 檢查文件類型
          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
          if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`不支持的文件類型: ${file.mimetype}，只支持 JPG、PNG 和 GIF 格式`)
          }

          // 生成安全的文件名
          const fileExt = path.extname(file.originalname).toLowerCase()
          const fileName = `invoice_${i + 1}_${Date.now()}${fileExt}`
          const filePath = path.join(uploadDir, fileName)

          try {
            // 寫入文件
            await fs.promises.writeFile(filePath, file.buffer)
            console.log('文件已保存到:', filePath)
            
            // 更新項目的圖片路徑（存儲相對路徑）
            item.invoiceImage = path.join('invoices', year, month, serialNumber, fileName)
            console.log('保存的圖片路徑:', item.invoiceImage)
          } catch (error) {
            console.error('保存文件時出錯:', error)
            throw new Error('保存發票圖片失敗')
          }
        } else {
          console.log('未找到對應的文件，可用的鍵名:', Object.keys(files))
        }
      }
      
      // 移除標記屬性
      delete item.hasNewFile
    }

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
      payee,
      paymentTarget,
      accountNumber,
      bankInfo,
      currency,
      paymentDate: type === 'payable' ? paymentDate : null,
      totalAmount,
      submitterId,
      status: 'pending',
      department: req.user.department,
      attachments: processedAttachments  // 添加處理後的附件信息
    }, { 
      transaction: t
    })

    // 創建請款項目
    const reimbursementItems = await Promise.all(
      items.map(item => ReimbursementItem.create({
        ...item,
        reimbursementId: reimbursement.id
      }, { transaction: t }))
    )

    await t.commit()

    // 清理暫存文件
    for (const tempFile of tempFiles) {
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile)
          console.log('已清理暫存文件:', tempFile)
        }
      } catch (error) {
        console.error('清理暫存文件失敗:', error)
        // 不中斷流程，繼續處理
      }
    }

    // 獲取完整的請款單信息
    const result = await Reimbursement.findByPk(reimbursement.id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'name', 'username', 'department']
        },
        {
          model: ReimbursementItem,
          as: 'items'
        }
      ]
    })

    res.status(201).json(result)
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
    const { status, reviewComment, bankInfo, accountId } = req.body
    const reviewerId = req.user.id

    const reimbursement = await Reimbursement.findByPk(id)
    if (!reimbursement) {
      return res.status(404).json({ message: '請款單不存在' })
    }

    // 如果是提交操作，檢查是否為提交人
    if (status === 'submitted' && reimbursement.submitterId !== req.user.id) {
      return res.status(403).json({ message: '只有提交人可以提交請款單' })
    }

    // 如果是審核或付款操作，檢查是否為管理員
    if ((status === 'approved' || status === 'rejected' || status === 'paid') && req.user.role !== 'admin') {
      return res.status(403).json({ message: '無權操作' })
    }

    // 如果是付款操作，檢查當前狀態是否為已通過
    if (status === 'paid' && reimbursement.status !== 'approved') {
      return res.status(400).json({ message: '只能對已通過的請款單進行付款' })
    }

    // 如果是付款操作，檢查是否有支付帳號
    if (status === 'paid' && (!bankInfo || !accountId)) {
      return res.status(400).json({ message: '請選擇支付帳號' })
    }

    // 更新請款單狀態和支付帳號
    const updateData = {
      status,
      reviewComment,
      reviewerId: status === 'submitted' ? null : reviewerId,
      reviewedAt: status === 'submitted' ? null : new Date()
    }

    // 如果提供了支付帳號，則更新支付帳號相關資訊
    if (bankInfo && accountId) {
      updateData.bankInfo = bankInfo
      updateData.accountId = accountId
    }

    // 如果是付款操作，更新付款日期
    if (status === 'paid') {
      updateData.paymentDate = new Date()
    }

    await reimbursement.update(updateData, { transaction: t })

    await t.commit()

    // 獲取更新後的請款單資訊
    const updatedReimbursement = await Reimbursement.findByPk(id, {
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
        },
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'name', 'currency', 'current_balance']
        }
      ]
    })

    res.json({
      message: status === 'submitted' ? '請款單提交成功' : '請款單審核成功',
      data: updatedReimbursement
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

// 獲取下一個序號
exports.getNextSerialNumber = async (req, res) => {
  try {
    const { type } = req.query
    
    if (!type || !['reimbursement', 'payable'].includes(type)) {
      return res.status(400).json({ error: '無效的請款單類型' })
    }

    const serialNumber = await generateSerialNumber(type)
    res.json({ serialNumber })
  } catch (error) {
    console.error('獲取序號失敗:', error)
    res.status(500).json({ error: '獲取序號失敗' })
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

    // 從序號中提取年月信息
    const serialNumber = reimbursement.serialNumber // 例如：A20250204001
    console.log('請款單序號:', serialNumber)
    const year = serialNumber.substring(1, 5)       // 2025
    const month = serialNumber.substring(5, 7)      // 02
    console.log('年份:', year)
    console.log('月份:', month)
    
    // 在 Docker 容器中，使用 /app 作為根目錄
    const uploadDir = path.join('/app', 'uploads', 'invoices', year, month, serialNumber)
    console.log('準備刪除目錄:', uploadDir)
    console.log('目錄是否存在:', fs.existsSync(uploadDir))

    // 檢查目錄內容
    if (fs.existsSync(uploadDir)) {
      console.log('目錄內容:', fs.readdirSync(uploadDir))
    }

    // 刪除請款單及其明細
    await ReimbursementItem.destroy({
      where: { reimbursementId: id },
      transaction: t
    })
    await reimbursement.destroy({ transaction: t })

    await t.commit()

    // 刪除圖片目錄（在事務提交後執行）
    if (fs.existsSync(uploadDir)) {
      console.log('開始刪除目錄')
      try {
        fs.rmSync(uploadDir, { recursive: true, force: true })
        console.log('目錄刪除成功')
      } catch (error) {
        console.error('刪除目錄時出錯:', error)
        // 即使刪除目錄失敗，我們也不想影響整個請款單的刪除操作
        console.log('繼續執行，不中斷操作')
      }
    } else {
      console.log('目錄不存在，無需刪除')
    }

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