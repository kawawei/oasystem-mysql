// 意向客戶控制器 Interested Customer Controller
const { Customer, TutorialCenter, ContactRecord, BusinessArea } = require('../models');
const { Op } = require('sequelize');

// 獲取意向客戶列表
exports.list = async (req, res) => {
  try {
    const { search, city, district } = req.query;
    
    // 獲取當前用戶的負責區域
    const userAreas = await BusinessArea.findAll({
      where: { userId: req.user.id },
      attributes: ['city', 'district']
    });

    // 如果用戶不是管理員且沒有被指派區域，返回空列表
    if (req.user.role !== 'admin' && userAreas.length === 0) {
      return res.json({
        total: 0,
        data: []
      });
    }
    
    // 構建查詢條件
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

    // 查詢選項 - 只獲取有意向的客戶
    const queryOptions = {
      where: {
        // 排除 not_interested 狀態的客戶
        status: {
          [Op.notIn]: ['not_interested']
        }
      },
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
          required: false,
          order: [['call_time', 'DESC']],
          limit: 3,
          where: {
            [Op.or]: [
              {
                result: 'answered',
                intention: {
                  [Op.in]: ['interested', 'considering', 'visited']
                }
              },
              {
                result: 'removed_from_interested',
                [Op.not]: true
              }
            ]
          }
        }
      ],
      order: [['last_contact_time', 'DESC']],
      distinct: true
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
      data: customers
    });
  } catch (error) {
    console.error('Error in interested customer list:', error);
    res.status(500).json({ message: '獲取意向客戶列表失敗' });
  }
}; 