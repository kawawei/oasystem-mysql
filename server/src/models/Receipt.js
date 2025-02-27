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
    },
    // 確認時間 Confirmation time
    confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true
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
                
                // 查詢當天已存在的收款單號 Query existing receipt numbers for today
                const startOfDay = new Date(taiwanDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(taiwanDate.setHours(23, 59, 59, 999));
                
                const existingReceipts = await Receipt.findAll({
                    where: {
                        receiptNumber: {
                            [Op.like]: `C${dateStr}%`
                        }
                    },
                    order: [['receiptNumber', 'DESC']]
                });

                let nextSequence = 1;
                
                // 如果存在收款單，則從最大序號開始遞增
                if (existingReceipts.length > 0) {
                    // 從最新的收款單號中提取序號 Extract sequence from latest receipt number
                    const latestReceiptNumber = existingReceipts[0].receiptNumber;
                    const currentSequence = parseInt(latestReceiptNumber.slice(-3));
                    nextSequence = currentSequence + 1;
                }

                // 生成新的收款單號 Generate new receipt number
                const sequenceStr = String(nextSequence).padStart(3, '0');
                const receiptNumber = `C${dateStr}${sequenceStr}`;

                receipt.setDataValue('receiptNumber', receiptNumber);
            }
        }
    }
});

module.exports = Receipt; 