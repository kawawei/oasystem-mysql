// 客戶郵件路由 Customer email routes
const express = require('express');
const router = express.Router();
const { CustomerEmail, Customer } = require('../models');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要驗證 All routes require authentication
router.use(authenticate);

// 創建新郵件 Create new email
router.post('/', async (req, res) => {
    const { customer_id, to, subject, content, status, scheduled_time, attachments } = req.body;
    
    try {
        const email = await CustomerEmail.create({
            customer_id,
            to,
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
});

// 獲取郵件列表 Get email list
router.get('/', async (req, res) => {
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
});

// 獲取單個郵件詳情 Get single email details
router.get('/:id', async (req, res) => {
    try {
        const email = await CustomerEmail.findByPk(req.params.id, {
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
});

// 更新郵件 Update email
router.put('/:id', async (req, res) => {
    const { subject, content, status, scheduled_time, attachments } = req.body;
    
    try {
        const email = await CustomerEmail.findByPk(req.params.id);
        
        if (!email) {
            return res.status(404).json({ 
                success: false,
                message: '找不到指定的郵件 | Email not found'
            });
        }

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
});

// 刪除郵件 Delete email
router.delete('/:id', async (req, res) => {
    try {
        const email = await CustomerEmail.findByPk(req.params.id);
        
        if (!email) {
            return res.status(404).json({ 
                success: false,
                message: '找不到指定的郵件 | Email not found'
            });
        }

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
});

module.exports = router; 