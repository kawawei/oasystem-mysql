const { Receipt, User, Account } = require('../models');
const { Op } = require('sequelize');

// 收款控制器 Receipt Controller
const receiptController = {
    // 創建新收款記錄 Create new receipt
    async create(req, res) {
        try {
            const {
                receiptDate,
                amount,
                paymentMethod,
                payer,
                description,
                notes,
                accountId,
                attachments
            } = req.body;

            // 創建新的收款記錄 Create new receipt record
            const receipt = await Receipt.create({
                receiptDate,
                amount,
                paymentMethod,
                payer,
                description,
                notes,
                accountId,
                attachments: attachments || [],
                receiverId: req.user.id // 使用當前登入用戶作為收款人 Use current logged-in user as receiver
            });

            // 獲取關聯的帳戶信息 Get associated account information
            const account = await Account.findByPk(accountId);
            
            // 將帳戶信息添加到響應中 Add account information to response
            const responseData = {
                ...receipt.toJSON(),
                accountName: account ? account.name : null,
                currency: account ? account.currency : null
            };

            res.status(201).json({
                success: true,
                message: '收款記錄創建成功 Receipt record created successfully',
                data: responseData
            });
        } catch (error) {
            console.error('Error creating receipt:', error);
            res.status(500).json({
                success: false,
                message: '創建收款記錄失敗 Failed to create receipt record',
                error: error.message
            });
        }
    },

    // 獲取所有收款記錄 Get all receipts
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                order = 'desc',
                status,
                startDate,
                endDate
            } = req.query;

            // 構建查詢條件 Build query conditions
            const where = {};
            if (status) where.status = status;
            if (startDate || endDate) {
                where.receiptDate = {};
                if (startDate) where.receiptDate[Op.gte] = new Date(startDate);
                if (endDate) where.receiptDate[Op.lte] = new Date(endDate);
            }

            // 計算分頁 Calculate pagination
            const offset = (page - 1) * limit;

            // 獲取收款記錄 Get receipt records
            const { rows: receipts, count: total } = await Receipt.findAndCountAll({
                where,
                order: [[sortBy, order.toUpperCase()]],
                offset,
                limit: parseInt(limit),
                include: [{
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name', 'email']
                }]
            });

            res.status(200).json({
                success: true,
                data: receipts,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '獲取收款記錄失敗 Failed to get receipt records',
                error: error.message
            });
        }
    },

    // 獲取單個收款記錄 Get single receipt
    async getOne(req, res) {
        try {
            const { id } = req.params;

            const receipt = await Receipt.findByPk(id, {
                include: [{
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name', 'email']
                }]
            });

            if (!receipt) {
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            res.status(200).json({
                success: true,
                data: receipt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '獲取收款記錄失敗 Failed to get receipt record',
                error: error.message
            });
        }
    },

    // 更新收款記錄 Update receipt
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // 確保不能更新收款編號 Ensure receipt number cannot be updated
            delete updateData.receiptNumber;

            const receipt = await Receipt.findByPk(id);

            if (!receipt) {
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            await receipt.update(updateData);

            const updatedReceipt = await Receipt.findByPk(id, {
                include: [{
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name', 'email']
                }]
            });

            res.status(200).json({
                success: true,
                message: '收款記錄更新成功 Receipt record updated successfully',
                data: updatedReceipt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新收款記錄失敗 Failed to update receipt record',
                error: error.message
            });
        }
    },

    // 刪除收款記錄 Delete receipt
    async delete(req, res) {
        try {
            const { id } = req.params;

            const deleted = await Receipt.destroy({
                where: { id }
            });

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            res.status(200).json({
                success: true,
                message: '收款記錄刪除成功 Receipt record deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '刪除收款記錄失敗 Failed to delete receipt record',
                error: error.message
            });
        }
    },

    // 更新收款狀態 Update receipt status
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '無效的狀態值 Invalid status value'
                });
            }

            const [updated] = await Receipt.update(
                { status },
                { where: { id } }
            );

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            const receipt = await Receipt.findByPk(id);

            res.status(200).json({
                success: true,
                message: '收款狀態更新成功 Receipt status updated successfully',
                data: receipt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新收款狀態失敗 Failed to update receipt status',
                error: error.message
            });
        }
    },

    // 獲取收款記錄列表 Get receipt list
    async getReceipts(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', status, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            // 構建查詢條件 Build query conditions
            const where = {};
            if (status) {
                where.status = status;
            }
            if (startDate && endDate) {
                where.receiptDate = {
                    [Op.between]: [startDate, endDate]
                };
            }

            // 獲取收款記錄列表 Get receipt records
            const { count, rows } = await Receipt.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'receiver',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Account,
                        as: 'account',
                        attributes: ['id', 'name', 'currency']
                    }
                ],
                order: [[sortBy, order.toUpperCase()]],
                limit: parseInt(limit),
                offset
            });

            // 格式化響應數據 Format response data
            const receipts = rows.map(receipt => {
                const data = receipt.toJSON();
                return {
                    ...data,
                    accountName: data.account?.name,
                    currency: data.account?.currency
                };
            });

            res.json({
                success: true,
                message: '獲取收款記錄成功 Get receipt records successfully',
                data: receipts,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Error getting receipts:', error);
            res.status(500).json({
                success: false,
                message: '獲取收款記錄失敗 Failed to get receipt records',
                error: error.message
            });
        }
    }
};

module.exports = receiptController; 