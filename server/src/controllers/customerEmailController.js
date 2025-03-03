// 客戶郵件控制器 Customer email controller
const { CustomerEmail, Customer } = require('../models');
const { Op } = require('sequelize');

// 創建新郵件 Create new email
exports.createEmail = async (req, res) => {
  try {
    const { customer_id, subject, content, status, scheduled_time, attachments } = req.body;
    
    // 檢查客戶是否存在 Check if customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的客戶 | Customer not found'
      });
    }

    const email = await CustomerEmail.create({
      customer_id,
      subject,
      content,
      status: status || 'draft',
      scheduled_time,
      attachments
    });

    res.status(201).json({
      success: true,
      data: email,
      message: '郵件創建成功 | Email created successfully'
    });
  } catch (error) {
    console.error('創建郵件時出錯 | Error creating email:', error);
    res.status(500).json({
      success: false,
      message: '創建郵件時發生錯誤 | Error occurred while creating email'
    });
  }
};

// 獲取郵件列表 Get email list
exports.getEmails = async (req, res) => {
  try {
    const { 
      customer_id,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (status) where.status = status;

    const emails = await CustomerEmail.findAndCountAll({
      where,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'status']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        emails: emails.rows,
        total: emails.count,
        page: parseInt(page),
        totalPages: Math.ceil(emails.count / parseInt(limit))
      },
      message: '獲取郵件列表成功 | Email list retrieved successfully'
    });
  } catch (error) {
    console.error('獲取郵件列表時出錯 | Error getting email list:', error);
    res.status(500).json({
      success: false,
      message: '獲取郵件列表時發生錯誤 | Error occurred while getting email list'
    });
  }
};

// 獲取單個郵件詳情 Get single email details
exports.getEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await CustomerEmail.findByPk(id, {
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'status']
      }]
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的郵件 | Email not found'
      });
    }

    res.json({
      success: true,
      data: email,
      message: '獲取郵件詳情成功 | Email details retrieved successfully'
    });
  } catch (error) {
    console.error('獲取郵件詳情時出錯 | Error getting email details:', error);
    res.status(500).json({
      success: false,
      message: '獲取郵件詳情時發生錯誤 | Error occurred while getting email details'
    });
  }
};

// 更新郵件 Update email
exports.updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content, status, scheduled_time, attachments } = req.body;

    const email = await CustomerEmail.findByPk(id);
    if (!email) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的郵件 | Email not found'
      });
    }

    // 如果郵件已發送，則不允許修改 If email is sent, modification is not allowed
    if (email.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: '已發送的郵件不能修改 | Sent email cannot be modified'
      });
    }

    await email.update({
      subject,
      content,
      status,
      scheduled_time,
      attachments
    });

    res.json({
      success: true,
      data: email,
      message: '郵件更新成功 | Email updated successfully'
    });
  } catch (error) {
    console.error('更新郵件時出錯 | Error updating email:', error);
    res.status(500).json({
      success: false,
      message: '更新郵件時發生錯誤 | Error occurred while updating email'
    });
  }
};

// 刪除郵件 Delete email
exports.deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await CustomerEmail.findByPk(id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的郵件 | Email not found'
      });
    }

    // 如果郵件已發送，則不允許刪除 If email is sent, deletion is not allowed
    if (email.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: '已發送的郵件不能刪除 | Sent email cannot be deleted'
      });
    }

    await email.destroy();

    res.json({
      success: true,
      message: '郵件刪除成功 | Email deleted successfully'
    });
  } catch (error) {
    console.error('刪除郵件時出錯 | Error deleting email:', error);
    res.status(500).json({
      success: false,
      message: '刪除郵件時發生錯誤 | Error occurred while deleting email'
    });
  }
}; 