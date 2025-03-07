// 意向客戶控制器 Interested Customer Controller
const { Customer, TutorialCenter, ContactRecord, BusinessArea } = require('../models');
const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// 獲取意向客戶列表
exports.list = async (req, res) => {
  try {
    const { search, city, district, page = 1, pageSize = 10 } = req.query;
    
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

    // 構建補習中心查詢條件
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

    // 使用子查詢獲取最新的通話記錄
    const latestContactRecordsQuery = `
      SELECT cr1.*
      FROM contact_records cr1
      INNER JOIN (
        SELECT customer_id, MAX(call_time) as latest_call_time
        FROM contact_records
        GROUP BY customer_id
      ) cr2 ON cr1.customer_id = cr2.customer_id AND cr1.call_time = cr2.latest_call_time
      WHERE cr1.result = 'answered' 
      AND cr1.intention IN ('interested', 'considering', 'visited')
    `;

    // 執行子查詢獲取有意向的客戶 ID
    const [interestedCustomers] = await sequelize.query(latestContactRecordsQuery);
    const customerIds = interestedCustomers.map(record => record.customer_id);

    // 如果沒有有意向的客戶，返回空列表
    if (customerIds.length === 0) {
      return res.json({
        total: 0,
        data: [],
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    }

    // 查詢這些有意向客戶的詳細信息
    const { count, rows } = await Customer.findAndCountAll({
      where: {
        id: {
          [Op.in]: customerIds
        }
      },
      include: [
        {
          model: TutorialCenter,
          as: 'tutorialCenter',
          where: tutorialCenterWhere,
          required: true
        }
      ],
      order: [['last_contact_time', 'DESC']],
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      distinct: true
    });

    // 格式化響應數據
    const customers = await Promise.all(rows.map(async customer => {
      // 獲取最近三次通話記錄
      const contactRecords = await ContactRecord.findAll({
        where: { customer_id: customer.id },
        order: [['call_time', 'DESC']],
        limit: 3
      });

      return {
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
        contactHistory: contactRecords.map(record => ({
          id: record.id,
          callTime: record.call_time,
          result: record.result,
          intention: record.intention,
          notes: record.notes
        }))
      };
    }));

    res.json({
      total: count,
      data: customers,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error in interested customer list:', error);
    res.status(500).json({ message: '獲取意向客戶列表失敗' });
  }
}; 