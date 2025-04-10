// 客戶控制器 Customer controller
const { Customer, TutorialCenter, ContactRecord, BusinessArea } = require('../models');
const { Op } = require('sequelize');

// 獲取客戶列表 Get customer list
exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status, city, district } = req.query;
    
    // 獲取當前用戶的負責區域
    const userAreas = await BusinessArea.findAll({
      where: { userId: req.user.id },
      attributes: ['city', 'district']
    });

    // 如果用戶不是管理員且沒有被指派區域，返回空列表
    if (req.user.role !== 'admin' && userAreas.length === 0) {
      return res.json({
        total: 0,
        data: [],
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    }
    
    // 構建查詢條件
    const where = {};
    const tutorialCenterWhere = {};
    
    // 如果不是管理員，只能查看被指派區域的客戶
    if (req.user.role !== 'admin') {
      tutorialCenterWhere[Op.or] = userAreas.map(area => ({
        [Op.and]: {
          city: area.city,
          district: area.district
        }
      }));
    } else {
      // 管理員可以根據篩選條件查看所有區域
      if (city) {
        tutorialCenterWhere.city = city;
      }
      if (district) {
        tutorialCenterWhere.district = district;
      }
    }
    
    if (search) {
      tutorialCenterWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    // 查詢選項
    const queryOptions = {
      where,
      include: [
        {
          model: TutorialCenter,
          as: 'tutorialCenter',
          where: tutorialCenterWhere,
          required: true
        },
        {
          model: ContactRecord,
          as: 'contactRecords',
          order: [['call_time', 'DESC']],
          limit: 3,
          required: false
        }
      ],
      order: [['id', 'ASC']],
      distinct: true,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize)
    };

    // 執行查詢
    const { count, rows } = await Customer.findAndCountAll(queryOptions);

    // 格式化響應數據
    const customers = rows.map(customer => ({
      id: customer.id,
      status: customer.status,
      lastContactTime: customer.last_contact_time,
      tutorialCenter: {
        name: customer.tutorialCenter.name,
        phone: customer.tutorialCenter.phone,
        email: customer.tutorialCenter.email,
        city: customer.tutorialCenter.city,
        district: customer.tutorialCenter.district,
        contact: customer.tutorialCenter.contact,
        notes: customer.tutorialCenter.notes
      },
      contactHistory: customer.contactRecords.map(record => ({
        id: record.id,
        callTime: record.call_time,
        result: record.result,
        intention: record.intention,
        notes: record.notes
      }))
    }));

    res.json({
      total: count,
      data: customers,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error in customer list:', error);
    res.status(500).json({ message: '獲取客戶列表失敗' });
  }
};

// 更新客戶狀態 Update customer status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 查找客戶記錄，包含補習中心信息
    const customer = await Customer.findByPk(id, {
      include: [{
        model: TutorialCenter,
        as: 'tutorialCenter'
      }]
    });

    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    // 更新客戶狀態
    await customer.update({ status });

    // 同時更新補習中心的狀態
    if (customer.tutorialCenter) {
      // 如果客戶狀態為 interested、in_progress 或 visited，將補習中心狀態設為 active
      // 如果客戶狀態為 not_interested、invalid 或其他，將補習中心狀態設為 inactive
      const tutorialCenterStatus = ['interested', 'in_progress', 'visited'].includes(status) ? 'active' : 'inactive';
      await customer.tutorialCenter.update({ status: tutorialCenterStatus });
    }

    res.json({ 
      message: '狀態更新成功 / Status updated successfully',
      data: {
        id: customer.id,
        status: status,
        tutorialCenter: customer.tutorialCenter
      }
    });
  } catch (error) {
    console.error('Error in updating customer status:', error);
    res.status(500).json({ message: '更新客戶狀態失敗 / Failed to update customer status' });
  }
};

// 獲取客戶詳情 Get customer details
exports.getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: TutorialCenter,
          as: 'tutorialCenter'
        },
        {
          model: ContactRecord,
          as: 'contactRecords',
          order: [['call_time', 'DESC']]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    // 格式化響應數據 Format response data
    const response = {
      id: customer.id,
      status: customer.status,
      lastContactTime: customer.last_contact_time,
      tutorialCenter: {
        id: customer.tutorialCenter.id,
        name: customer.tutorialCenter.name,
        phone: customer.tutorialCenter.phone,
        email: customer.tutorialCenter.email,
        city: customer.tutorialCenter.city,
        district: customer.tutorialCenter.district,
        address: customer.tutorialCenter.address,
        contact: customer.tutorialCenter.contact,
        notes: customer.tutorialCenter.notes
      },
      contactRecords: customer.contactRecords.map(record => ({
        id: record.id,
        callTime: record.call_time,
        result: record.result,
        intention: record.intention,
        notes: record.notes
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getting customer details:', error);
    res.status(500).json({ message: '獲取客戶詳情失敗 / Failed to get customer details' });
  }
};

// 添加通話記錄 Add contact record
exports.addContactRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { callTime, result, intention, notes } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    // 創建通話記錄 Create contact record
    const contactRecord = await ContactRecord.create({
      customer_id: id,
      call_time: callTime,
      result,
      intention: result === 'answered' ? intention : null,  // 只在已接聽時設置意向
      notes
    });

    // 更新客戶狀態和最後聯繫時間 Update customer status and last contact time
    const intentionToStatusMap = {
      interested: 'interested',
      considering: 'in_progress',
      not_interested: 'not_interested',
      call_back: 'call_back',
      visited: 'visited'  // 添加已約訪狀態
    };

    // 根據通話結果和意向更新客戶狀態
    let newStatus;
    if (result === 'answered') {
      // 如果已接聽，根據意向更新狀態
      newStatus = intention ? intentionToStatusMap[intention] : customer.status;
    } else {
      // 如果未接聽，查找最近一次有效的意向記錄
      const latestIntentionRecord = await ContactRecord.findOne({
        where: {
          customer_id: id,
          result: 'answered',
          intention: {
            [Op.in]: ['interested', 'considering', 'visited']
          }
        },
        order: [['call_time', 'DESC']]
      });

      if (latestIntentionRecord) {
        // 如果有之前的意向記錄，保持該狀態
        newStatus = intentionToStatusMap[latestIntentionRecord.intention];
      } else {
        // 如果沒有之前的意向記錄，根據通話結果設置狀態
        const resultToStatusMap = {
          no_answer: 'no_answer',
          busy: 'busy',
          invalid: 'invalid'
        };
        newStatus = resultToStatusMap[result] || customer.status;
      }
    }

    // 更新客戶狀態和最後聯繫時間
    await customer.update({
      status: newStatus,
      last_contact_time: callTime
    });

    // 同時更新補習中心的狀態
    const tutorialCenter = await TutorialCenter.findByPk(customer.tutorial_center_id);
    if (tutorialCenter) {
      // 如果客戶狀態為 interested、in_progress 或 visited，將補習中心狀態設為 active
      // 如果客戶狀態為 not_interested、invalid 或其他，將補習中心狀態設為 inactive
      const tutorialCenterStatus = ['interested', 'in_progress', 'visited'].includes(newStatus) ? 'active' : 'inactive';
      await tutorialCenter.update({ status: tutorialCenterStatus });
    }

    res.status(201).json({
      message: '通話記錄添加成功 / Contact record added successfully',
      data: {
        id: contactRecord.id,
        callTime: contactRecord.call_time,
        result: contactRecord.result,
        intention: contactRecord.intention,
        notes: contactRecord.notes
      }
    });
  } catch (error) {
    console.error('Error in adding contact record:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ 
        message: '數據驗證失敗 / Data validation failed',
        errors: error.errors.map(err => err.message)
      });
    } else {
      res.status(500).json({ message: '添加通話記錄失敗 / Failed to add contact record' });
    }
  }
};

// 獲取通話記錄列表 Get contact records list
exports.getContactRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    const { count, rows } = await ContactRecord.findAndCountAll({
      where: { customer_id: id },
      offset,
      limit: parseInt(pageSize),
      order: [['call_time', 'DESC']]
    });

    const contactRecords = rows.map(record => ({
      id: record.id,
      callTime: record.call_time,
      result: record.result,
      intention: record.intention,
      notes: record.notes
    }));

    res.json({
      total: count,
      data: contactRecords,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error in getting contact records:', error);
    res.status(500).json({ message: '獲取通話記錄失敗 / Failed to get contact records' });
  }
};

// 更新補習班資料 Update tutorial center information
exports.updateTutorialCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 查找客戶記錄
    const customer = await Customer.findByPk(id, {
      include: [{
        model: TutorialCenter,
        as: 'tutorialCenter'
      }]
    });

    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    if (!customer.tutorialCenter) {
      return res.status(404).json({ message: '補習中心不存在 / Tutorial center not found' });
    }

    // 更新補習班資料
    const tutorialCenter = await customer.tutorialCenter.update(updateData, {
      silent: true  // 不觸發更新時間戳 Do not trigger timestamp updates
    });

    // 查找並更新所有關聯到這個補習中心的客戶記錄
    const relatedCustomers = await Customer.findAll({
      where: { tutorial_center_id: customer.tutorial_center_id },
      include: [{
        model: TutorialCenter,
        as: 'tutorialCenter'
      }]
    });

    // 返回更新後的資料
    res.json({
      message: '補習中心資料更新成功 / Tutorial center information updated successfully',
      data: {
        tutorialCenter,
        relatedCustomers: relatedCustomers.map(customer => ({
          id: customer.id,
          status: customer.status,
          lastContactTime: customer.last_contact_time,
          tutorialCenter: customer.tutorialCenter
        }))
      }
    });
  } catch (error) {
    console.error('Error updating tutorial center information:', error);
    res.status(500).json({ message: '更新補習中心資料失敗 / Failed to update tutorial center information' });
  }
};

// 從意向列表中移除客戶 Remove customer from interested list
exports.removeFromInterested = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找客戶記錄 Find customer record
    const customer = await Customer.findByPk(id, {
      include: [{
        model: TutorialCenter,
        as: 'tutorialCenter'
      }]
    });

    if (!customer) {
      return res.status(404).json({ message: '客戶不存在 / Customer not found' });
    }

    // 更新客戶狀態為 'not_interested'
    // Update customer status to 'not_interested'
    await customer.update({
      status: 'not_interested',
      last_contact_time: new Date()
    });

    // 同時更新補習中心的狀態為 inactive
    // Update tutorial center status to inactive
    if (customer.tutorialCenter) {
      await customer.tutorialCenter.update({ status: 'inactive' });
    }

    res.json({ 
      message: '已從意向列表中移除 / Removed from interested list',
      data: {
        id: customer.id,
        status: 'not_interested',
        lastContactTime: customer.last_contact_time,
        tutorialCenter: customer.tutorialCenter
      }
    });
  } catch (error) {
    console.error('Error removing customer from interested list:', error);
    res.status(500).json({ message: '從意向列表移除失敗 / Failed to remove from interested list' });
  }
};

module.exports = exports; 