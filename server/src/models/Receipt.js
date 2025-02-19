const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

// 收款記錄模型 Receipt Model
const Receipt = sequelize.define('Receipt', {
    // 收款編號 Receipt number
    receiptNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            notEmpty: { msg: '收款編號為必填項 Receipt number is required' }
        }
    },
    // 收款日期 Receipt date
    receiptDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款日期為必填項 Receipt date is required' }
        }
    },
    // 收款金額 Receipt amount
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款金額為必填項 Receipt amount is required' },
            min: { args: [0], msg: '收款金額不能為負數 Receipt amount cannot be negative' }
        }
    },
    // 收款方式 Payment method
    paymentMethod: {
        type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER'),
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款方式為必填項 Payment method is required' }
        }
    },
    // 付款人/公司 Payer/Company
    payer: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: '付款人/公司為必填項 Payer/Company is required' }
        }
    },
    // 收款人ID Receiver ID
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款人為必填項 Receiver is required' }
        }
    },
    // 收款帳戶ID Account ID
    accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款帳戶為必填項 Account is required' }
        }
    },
    // 收款項目描述 Receipt description
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: '收款項目描述為必填項 Receipt description is required' }
        }
    },
    // 相關文件 Related documents (JSON格式儲存)
    attachments: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    // 備註 Notes
    notes: {
        type: DataTypes.TEXT
    },
    // 狀態 Status
    status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING'
    }
}, {
    // 啟用時間戳記 Enable timestamps
    timestamps: true,
    // 自定義表名 Custom table name
    tableName: 'receipts',
    // 添加鉤子方法 Add hooks
    hooks: {
        beforeCreate: async (receipt) => {
            // 只有在沒有收款單號時才生成 Only generate receipt number if it doesn't exist
            if (!receipt.getDataValue('receiptNumber')) {
                // 生成收款編號 Generate receipt number (使用台灣時區 Use Taiwan timezone)
                const date = new Date();
                // 轉換為台灣時區 Convert to Taiwan timezone
                const taiwanDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
                const year = taiwanDate.getFullYear();
                const month = String(taiwanDate.getMonth() + 1).padStart(2, '0');
                const day = String(taiwanDate.getDate()).padStart(2, '0');
                const dateStr = `${year}${month}${day}`;
                
                // 查詢當天已確認的收款數量 Query confirmed receipt count for today
                const startOfDay = new Date(taiwanDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(taiwanDate.setHours(23, 59, 59, 999));
                
                const count = await Receipt.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                        // 移除 status 條件，計算所有狀態的收款 / Remove status condition to count all receipts
                    }
                });
                
                // 生成序號（3位數，從001開始）Generate sequence number (3 digits, starts from 001)
                const sequence = String(count + 1).padStart(3, '0');
                receipt.setDataValue('receiptNumber', `C${dateStr}${sequence}`);
            }
        }
    }
});

module.exports = Receipt; 