// 補習班控制器 Tutorial center controller
const { TutorialCenter, Customer } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

// 獲取補習班列表 Get tutorial center list
exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, city, district, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 構建查詢條件 Build query conditions
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }
    if (city) where.city = city;
    if (district) where.district = district;
    if (status) where.status = status;

    // 查詢數據 Query data
    const { count, rows } = await TutorialCenter.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    res.json({
      total: count,
      data: rows,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error in listing tutorial centers:', error);
    res.status(500).json({ message: '獲取補習班列表失敗 / Failed to get tutorial center list' });
  }
};

// 同步客戶數據 Sync customer data
const syncCustomerData = async (tutorialCenter) => {
  try {
    // 查找或創建客戶記錄 Find or create customer record
    const [customer] = await Customer.findOrCreate({
      where: { tutorial_center_id: tutorialCenter.id },
      defaults: {
        status: 'new',
        last_contact_time: null
      }
    });

    return customer;
  } catch (error) {
    console.error('Error syncing customer data:', error);
    throw error;
  }
};

// 創建補習班 Create tutorial center
exports.create = async (req, res) => {
  try {
    const tutorialCenter = await TutorialCenter.create(req.body);
    
    // 同步創建客戶記錄 Sync create customer record
    await syncCustomerData(tutorialCenter);

    res.status(201).json({
      message: '補習中心創建成功 / Tutorial center created successfully',
      data: tutorialCenter
    });
  } catch (error) {
    console.error('Error creating tutorial center:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        message: '數據驗證失敗 / Data validation failed',
        errors: error.errors.map(err => err.message)
      });
    } else {
      res.status(500).json({ message: '創建補習中心失敗 / Failed to create tutorial center' });
    }
  }
};

// 更新補習班 Update tutorial center
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorialCenter = await TutorialCenter.findByPk(id);
    
    if (!tutorialCenter) {
      return res.status(404).json({ message: '補習中心不存在 / Tutorial center not found' });
    }

    await tutorialCenter.update(req.body);
    
    // 確保客戶記錄存在 Ensure customer record exists
    await syncCustomerData(tutorialCenter);

    res.json({
      message: '補習中心更新成功 / Tutorial center updated successfully',
      data: tutorialCenter
    });
  } catch (error) {
    console.error('Error updating tutorial center:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        message: '數據驗證失敗 / Data validation failed',
        errors: error.errors.map(err => err.message)
      });
    } else {
      res.status(500).json({ message: '更新補習中心失敗 / Failed to update tutorial center' });
    }
  }
};

// 刪除補習班 Delete tutorial center
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorialCenter = await TutorialCenter.findByPk(id);
    
    if (!tutorialCenter) {
      return res.status(404).json({ message: '補習班不存在 / Tutorial center not found' });
    }

    await tutorialCenter.destroy();
    res.json({ message: '刪除成功 / Successfully deleted' });
  } catch (error) {
    console.error('Error in deleting tutorial center:', error);
    res.status(500).json({ message: '刪除補習班失敗 / Failed to delete tutorial center' });
  }
};

// 導入補習班數據 Import tutorial center data
exports.import = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '請上傳檔案' });
    }

    // 讀取 Excel 檔案
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new Error('Excel 檔案中沒有資料');
    }

    // 驗證並轉換每一行數據
    const transformedData = data.map((row, index) => {
      // 從區域中提取縣市（如果可能）
      let city = row['縣市'] || ''; // 如果有縣市欄位就使用，否則為空
      let district = row['區域'] ? row['區域'].trim() : '';
      
      // 如果區域包含縣市資訊（例如：台北市大安區），則分割它
      if (district) {
        const areaMatch = district.match(/^(.+[市縣])(.+區)$/);
        if (areaMatch && !city) {
          city = areaMatch[1];
          district = areaMatch[2];
        }
      }

      // 安全地轉換字符串值 Safely convert string values
      const safeString = (value) => {
        return value != null ? String(value).trim() : null;
      };

      return {
        intention: safeString(row['意向']),
        name: safeString(row['補習班名稱']),
        address: safeString(row['地址']),
        phone: safeString(row['電話']),
        city: safeString(city),
        district: safeString(district),
        sendDate: safeString(row['寄送日期']),
        email: safeString(row['Email Address']),
        area: safeString(row['區域']),
        contact: safeString(row['窗口']),
        notes: safeString(row['備註']),
        status: 'active'
      };
    });

    // 批量創建記錄
    const result = await TutorialCenter.bulkCreate(transformedData, {
      validate: false,
      returning: true
    });

    // 為每個新創建的補習班同步創建客戶記錄
    await Promise.all(result.map(tutorialCenter => syncCustomerData(tutorialCenter)));

    // 刪除臨時文件
    await fs.unlink(req.file.path);

    res.json({ 
      success: true,
      message: '導入成功',
      count: result.length
    });
  } catch (error) {
    console.error('Error in importing tutorial centers:', error);
    
    // 清理臨時文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    
    // 根據錯誤類型返回適當的錯誤信息
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: '資料驗證失敗',
        errors: error.errors.map(err => err.message)
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || '導入補習班資料失敗'
    });
  }
};

// 下載範本 Download template
exports.downloadTemplate = async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../templates/補習班名單範本.xlsx');
    const filename = '補習班名單範本.xlsx';
    const encodedFilename = encodeURIComponent(filename);
    
    // 檢查文件是否存在 Check if file exists
    try {
      await fs.access(templatePath);
    } catch (error) {
      console.error('Template file not found:', error);
      return res.status(404).json({ message: '範本文件不存在 / Template file not found' });
    }

    // 設置響應頭 Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    
    // 發送文件 Send file
    res.download(templatePath, filename, (err) => {
      if (err) {
        console.error('Error sending template file:', err);
        // 只有在響應尚未發送時才發送錯誤響應
        if (!res.headersSent) {
          res.status(500).json({ message: '下載範本失敗 / Failed to download template' });
        }
      }
    });
  } catch (error) {
    console.error('Error in downloading template:', error);
    // 只有在響應尚未發送時才發送錯誤響應
    if (!res.headersSent) {
      res.status(500).json({ message: '下載範本失敗 / Failed to download template' });
    }
  }
};

// 獲取縣市和區域列表 Get cities and districts list
exports.getAreas = async (req, res) => {
  try {
    // 從數據庫中獲取所有不重複的縣市和區域
    const tutorialCenters = await TutorialCenter.findAll({
      attributes: ['city', 'district'],
      group: ['city', 'district'],
      where: {
        city: {
          [Op.not]: null
        },
        district: {
          [Op.not]: null
        }
      },
      raw: true
    });

    // 整理數據格式
    const cityMap = new Map();
    tutorialCenters.forEach(({ city, district }) => {
      if (!cityMap.has(city)) {
        cityMap.set(city, new Set());
      }
      cityMap.get(city).add(district);
    });

    // 轉換為前端需要的格式
    const cities = Array.from(cityMap.entries()).map(([city, districts]) => ({
      label: city,
      value: city,
      districts: Array.from(districts).map(district => ({
        label: district,
        value: district
      }))
    }));

    // 按縣市名稱排序
    cities.sort((a, b) => a.label.localeCompare(b.label));
    // 每個縣市的區域也要排序
    cities.forEach(city => {
      city.districts.sort((a, b) => a.label.localeCompare(b.label));
    });

    res.json({
      cities
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({ message: '獲取區域列表失敗 / Failed to get areas list' });
  }
}; 