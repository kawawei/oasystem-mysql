const { Receipt, User, Account } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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
        let t; // 聲明事務變量 Declare transaction variable
        
        try {
            const { id } = req.params;

            // 開始事務 Start transaction
            t = await sequelize.transaction();

            // 先獲取收款記錄 Get receipt record first
            const receipt = await Receipt.findByPk(id, {
                transaction: t,
                lock: true // 添加行鎖定 Add row lock
            });

            if (!receipt) {
                await t.rollback();
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            // 如果是已確認的收款，需要恢復帳戶餘額 If receipt is confirmed, need to restore account balance
            if (receipt.status === 'CONFIRMED') {
                // 獲取關聯的帳戶 Get associated account
                const account = await Account.findByPk(receipt.accountId, {
                    transaction: t,
                    lock: true // 添加行鎖定 Add row lock
                });

                if (!account) {
                    await t.rollback();
                    return res.status(404).json({
                        success: false,
                        message: '收款帳戶不存在 Receipt account not found'
                    });
                }

                try {
                    // 計算新餘額（當前餘額減去收款金額）Calculate new balance (current balance minus receipt amount)
                    const currentBalance = parseFloat(account.current_balance || account.initial_balance);
                    const receiptAmount = parseFloat(receipt.amount);
                    const newBalance = currentBalance - receiptAmount;

                    console.log('Balance restoration calculation:', {
                        currentBalance,
                        receiptAmount,
                        newBalance,
                        accountId: account.id,
                        accountName: account.name
                    });

                    // 更新帳戶餘額 Update account balance
                    await account.update({
                        current_balance: newBalance,
                        last_transaction_date: new Date()
                    }, { transaction: t });

                    console.log(`帳戶 ${account.name} 餘額恢復：${currentBalance} -> ${newBalance}`);
                } catch (updateError) {
                    console.error('Error restoring account balance:', updateError);
                    await t.rollback();
                    throw updateError;
                }
            }

            // 刪除收款記錄 Delete receipt record
            await receipt.destroy({ transaction: t });

            // 提交事務 Commit transaction
            await t.commit();
            console.log('Transaction committed successfully');

            res.status(200).json({
                success: true,
                message: '收款記錄刪除成功 Receipt record deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting receipt:', error);
            
            // 確保事務在錯誤時回滾 Ensure transaction is rolled back on error
            if (t && !t.finished) {
                try {
                    await t.rollback();
                    console.log('Transaction rolled back due to error');
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }

            res.status(500).json({
                success: false,
                message: '刪除收款記錄失敗 Failed to delete receipt record',
                error: error.message
            });
        }
    },

    // 更新收款狀態 Update receipt status
    async updateStatus(req, res) {
        let t; // 聲明事務變量 Declare transaction variable
        
        try {
            t = await sequelize.transaction(); // 開始事務 Start transaction
            
            const { id } = req.params;
            const { status } = req.body;

            console.log('Updating receipt status:', { id, status });

            if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
                console.log('Invalid status value:', status);
                await t.rollback(); // 回滾事務 Rollback transaction
                return res.status(400).json({
                    success: false,
                    message: '無效的狀態值 Invalid status value'
                });
            }

            // 獲取收款記錄 Get receipt record
            const receipt = await Receipt.findByPk(id, { 
                transaction: t,
                lock: true // 添加行鎖定 Add row lock
            });
            
            console.log('Found receipt:', receipt ? receipt.toJSON() : null);

            if (!receipt) {
                console.log('Receipt not found:', id);
                await t.rollback(); // 回滾事務 Rollback transaction
                return res.status(404).json({
                    success: false,
                    message: '收款記錄不存在 Receipt record not found'
                });
            }

            // 如果是確認收款，需要更新帳戶餘額 If confirming receipt, need to update account balance
            if (status === 'CONFIRMED') {
                // 檢查當前狀態是否為待確認 Check if current status is pending
                console.log('Current receipt status:', receipt.status);
                if (receipt.status !== 'PENDING') {
                    console.log('Receipt is not in PENDING status');
                    await t.rollback(); // 回滾事務 Rollback transaction
                    return res.status(400).json({
                        success: false,
                        message: '只能確認待確認狀態的收款 Can only confirm pending receipts'
                    });
                }

                // 獲取關聯的帳戶 Get associated account
                const account = await Account.findByPk(receipt.accountId, { 
                    transaction: t,
                    lock: true // 添加行鎖定 Add row lock
                });
                
                console.log('Found account:', account ? account.toJSON() : null);

                if (!account) {
                    console.log('Account not found:', receipt.accountId);
                    await t.rollback(); // 回滾事務 Rollback transaction
                    return res.status(404).json({
                        success: false,
                        message: '收款帳戶不存在 Receipt account not found'
                    });
                }

                try {
                    // 計算新餘額 Calculate new balance
                    const currentBalance = parseFloat(account.current_balance || account.initial_balance);
                    const receiptAmount = parseFloat(receipt.amount);
                    const newBalance = currentBalance + receiptAmount;

                    console.log('Balance calculation:', {
                        currentBalance,
                        receiptAmount,
                        newBalance,
                        accountId: account.id,
                        accountName: account.name
                    });

                    // 更新帳戶餘額 Update account balance
                    await account.update({ 
                        current_balance: newBalance,
                        last_transaction_date: new Date()
                    }, { transaction: t });

                    console.log(`帳戶 ${account.name} 餘額更新：${currentBalance} -> ${newBalance}`);
                } catch (updateError) {
                    console.error('Error updating account balance:', updateError);
                    await t.rollback();
                    throw updateError;
                }
            }

            // 更新收款狀態 Update receipt status
            const updateData = {
                status,
                confirmedAt: status === 'CONFIRMED' ? new Date() : null
            };
            console.log('Updating receipt with data:', updateData);

            await receipt.update(updateData, { transaction: t });

            // 提交事務 Commit transaction
            await t.commit();
            console.log('Transaction committed successfully');

            // 獲取更新後的收款記錄 Get updated receipt record
            const updatedReceipt = await Receipt.findByPk(id, {
                include: [{
                    model: Account,
                    as: 'account',
                    attributes: ['id', 'name', 'currency', 'current_balance']
                }]
            });

            console.log('Updated receipt:', updatedReceipt ? updatedReceipt.toJSON() : null);

            return res.status(200).json({
                success: true,
                message: '收款狀態更新成功 Receipt status updated successfully',
                data: updatedReceipt
            });
        } catch (error) {
            console.error('Error updating receipt status:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            // 確保事務在錯誤時回滾 Ensure transaction is rolled back on error
            if (t && !t.finished) {
                try {
                    await t.rollback();
                    console.log('Transaction rolled back due to error');
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }

            return res.status(500).json({
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