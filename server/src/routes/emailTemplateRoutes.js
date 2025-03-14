const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const EmailTemplate = require('../models/EmailTemplate');

// 所有路由都需要驗證 / All routes require authentication
router.use(authenticate);

// 獲取模板列表 / Get template list
router.get('/', async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: templates,
      message: '獲取模板列表成功 | Successfully retrieved template list'
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: '獲取模板列表失敗 | Failed to get template list'
    });
  }
});

// 創建新模板 / Create new template
router.post('/', async (req, res) => {
  try {
    const { name, type, subject, content } = req.body;

    // 驗證必填字段 / Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入模板名稱 | Please enter template name'
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入郵件主旨 | Please enter email subject'
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入郵件內容 | Please enter email content'
      });
    }

    // 創建模板 / Create template
    const template = await EmailTemplate.create({
      name: name.trim(),
      type,
      subject: subject.trim(),
      content: content.trim()
    });

    res.status(201).json({
      success: true,
      data: template,
      message: '創建模板成功 | Successfully created template'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: '創建模板失敗 | Failed to create template'
    });
  }
});

// 更新模板 / Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, subject, content } = req.body;

    // 驗證必填字段 / Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入模板名稱 | Please enter template name'
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入郵件主旨 | Please enter email subject'
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入郵件內容 | Please enter email content'
      });
    }

    // 查找並更新模板 / Find and update template
    const template = await EmailTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的模板 | Template not found'
      });
    }

    await template.update({
      name: name.trim(),
      type,
      subject: subject.trim(),
      content: content.trim()
    });

    res.json({
      success: true,
      data: template,
      message: '更新模板成功 | Successfully updated template'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失敗 | Failed to update template'
    });
  }
});

// 刪除模板 / Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 查找並刪除模板 / Find and delete template
    const template = await EmailTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的模板 | Template not found'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: '刪除模板成功 | Successfully deleted template'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: '刪除模板失敗 | Failed to delete template'
    });
  }
});

// 獲取單個模板詳情 / Get single template details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching template details for ID:', id); // 添加日誌

    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      console.log('Template not found for ID:', id); // 添加日誌
      return res.status(404).json({
        success: false,
        message: '找不到指定的模板 | Template not found'
      });
    }

    console.log('Found template:', template); // 添加日誌
    
    res.json({
      success: true,
      data: template,
      message: '獲取模板詳情成功 | Successfully retrieved template details'
    });
  } catch (error) {
    console.error('Error getting template details:', error);
    res.status(500).json({
      success: false,
      message: '獲取模板詳情失敗 | Failed to get template details'
    });
  }
});

module.exports = router; 