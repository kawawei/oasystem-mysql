// 補習班控制器 Tutorial center controller
const TutorialCenter = require('../models/TutorialCenter');
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

// 創建補習班 Create tutorial center
exports.create = async (req, res) => {
  try {
    const tutorialCenter = await TutorialCenter.create(req.body);
    res.status(201).json(tutorialCenter);
  } catch (error) {
    console.error('Error in creating tutorial center:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ message: '數據驗證失敗 / Data validation failed', errors: error.errors });
    } else {
      res.status(500).json({ message: '創建補習班失敗 / Failed to create tutorial center' });
    }
  }
};

// 更新補習班 Update tutorial center
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorialCenter = await TutorialCenter.findByPk(id);
    
    if (!tutorialCenter) {
      return res.status(404).json({ message: '補習班不存在 / Tutorial center not found' });
    }

    await tutorialCenter.update(req.body);
    res.json(tutorialCenter);
  } catch (error) {
    console.error('Error in updating tutorial center:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ message: '數據驗證失敗 / Data validation failed', errors: error.errors });
    } else {
      res.status(500).json({ message: '更新補習班失敗 / Failed to update tutorial center' });
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
      return res.status(400).json({ message: '請上傳文件 / Please upload a file' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // 驗證和轉換數據 Validate and transform data
    const tutorialCenters = data.map(row => ({
      name: row['補習班名稱'] || row['name'],
      phone: row['電話'] || row['phone'],
      city: row['縣市'] || row['city'],
      district: row['區域'] || row['district'],
      address: row['地址'] || row['address'],
      contact: row['聯繫人'] || row['contact'],
      email: row['Email'] || row['email'],
      notes: row['備註'] || row['notes']
    }));

    // 批量創建記錄 Bulk create records
    await TutorialCenter.bulkCreate(tutorialCenters, {
      validate: true
    });

    // 刪除臨時文件 Delete temporary file
    await fs.unlink(req.file.path);

    res.json({ 
      message: '導入成功 / Import successful',
      count: tutorialCenters.length 
    });
  } catch (error) {
    console.error('Error in importing tutorial centers:', error);
    // 清理臨時文件 Clean up temporary file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ 
        message: '數據驗證失敗 / Data validation failed',
        errors: error.errors 
      });
    } else {
      res.status(500).json({ 
        message: '導入補習班數據失敗 / Failed to import tutorial center data' 
      });
    }
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