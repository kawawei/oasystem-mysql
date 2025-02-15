const Account = require('../models/Account');
const sequelize = require('../config/database');
const Reimbursement = require('../models/Reimbursement');

const accountController = {
  // 獲取所有賬戶
  async getAccounts(req, res) {
    console.log('GET /api/accounts request received');
    try {
      // 檢查數據庫連接
      try {
        await sequelize.authenticate();
        console.log('Database connection is OK');
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database connection error',
          error: dbError.message
        });
      }

      console.log('Request headers:', req.headers);
      console.log('Fetching accounts...');
      
      // 檢查表是否存在
      try {
        await Account.sync({ alter: false });
        console.log('Account table exists');
      } catch (syncError) {
        console.error('Table sync error:', syncError);
        return res.status(500).json({
          success: false,
          message: 'Table sync error',
          error: syncError.message
        });
      }

      try {
        console.log('Executing findAll query...');
        const accounts = await Account.findAll({
          order: [['created_at', 'DESC']],
          raw: true
        });
        
        console.log('Raw accounts data:', JSON.stringify(accounts, null, 2));
        
        // 如果沒有找到任何賬戶，返回空數組
        if (!accounts || accounts.length === 0) {
          console.log('No accounts found, returning empty array');
          return res.json({
            success: true,
            data: []
          });
        }
        
        const mappedAccounts = accounts.map(account => {
          console.log('Mapping account:', account);
          return {
            id: account.id,
            name: account.name,
            currency: account.currency,
            initialBalance: parseFloat(account.initial_balance),
            currentBalance: parseFloat(account.current_balance),
            createdAt: account.created_at,
            updatedAt: account.updated_at,
            is_deleted: account.is_deleted,
            deleted_at: account.deleted_at,
            deleted_by: account.deleted_by,
            last_transaction_date: account.last_transaction_date
          };
        });
        console.log('Mapped accounts:', JSON.stringify(mappedAccounts, null, 2));
        
        res.json({
          success: true,
          data: mappedAccounts
        });
      } catch (queryError) {
        console.error('Query error:', queryError);
        console.error('Query error details:', {
          name: queryError.name,
          message: queryError.message,
          sql: queryError.sql,
          parameters: queryError.parameters
        });
        throw queryError;
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        sql: error.sql,
        parameters: error.parameters
      });
      res.status(500).json({
        success: false,
        message: '獲取賬戶列表失敗',
        error: error.message,
        details: error.sql ? {
          sql: error.sql,
          parameters: error.parameters
        } : undefined
      });
    }
  },

  // 創建新賬戶
  async createAccount(req, res) {
    try {
      const { name, currency, initial_balance } = req.body;
      console.log('Creating account with:', { name, currency, initial_balance });
      
      const account = await Account.create({
        name,
        currency,
        initial_balance: initial_balance,
        current_balance: initial_balance
      });
      
      console.log('Account created:', account.toJSON());
      res.json({ success: true, data: account });
    } catch (error) {
      console.error('Error creating account:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        original: error.original
      });
      res.status(500).json({
        success: false,
        message: '創建賬戶失敗',
        error: error.message
      });
    }
  },

  // 獲取特定賬戶
  async getAccount(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      if (!account) {
        return res.status(404).json({ success: false, message: '賬戶不存在' });
      }
      res.json({ success: true, data: account });
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({ success: false, message: '獲取賬戶信息失敗' });
    }
  },

  // 更新賬戶餘額
  async updateBalance(req, res) {
    try {
      const { id } = req.params;
      const { new_balance } = req.body;
      const account = await Account.findByPk(id);
      if (!account) {
        return res.status(404).json({ success: false, message: '賬戶不存在' });
      }
      await account.update({ currentBalance: new_balance });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating account balance:', error);
      res.status(500).json({ success: false, message: '更新賬戶餘額失敗' });
    }
  },

  // 刪除賬戶
  async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      if (!account) {
        return res.status(404).json({ success: false, message: '賬戶不存在' });
      }
      await account.destroy();
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ success: false, message: '刪除賬戶失敗' });
    }
  },

  // 停用賬戶（軟刪除）
  async disableAccount(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: '賬戶不存在' 
        });
      }

      // 檢查賬戶是否已經被停用
      if (account.is_deleted) {
        return res.status(400).json({ 
          success: false, 
          message: '賬戶已經處於停用狀態' 
        });
      }

      await account.update({
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: req.user.id
      });

      res.json({ 
        success: true, 
        message: '賬戶已停用'
      });
    } catch (error) {
      console.error('Error disabling account:', error);
      res.status(500).json({ 
        success: false, 
        message: '停用賬戶失敗',
        error: error.message
      });
    }
  },

  // 啟用賬戶
  async enableAccount(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: '賬戶不存在' 
        });
      }

      // 檢查賬戶是否已經是啟用狀態
      if (!account.is_deleted) {
        return res.status(400).json({ 
          success: false, 
          message: '賬戶已經處於啟用狀態' 
        });
      }

      await account.update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null
      });

      res.json({ 
        success: true, 
        message: '賬戶已啟用'
      });
    } catch (error) {
      console.error('Error enabling account:', error);
      res.status(500).json({ 
        success: false, 
        message: '啟用賬戶失敗',
        error: error.message
      });
    }
  },

  // 檢查賬戶是否有交易記錄
  async checkAccountTransactions(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: '賬戶不存在' 
        });
      }

      // 檢查是否有關聯的請款記錄
      const hasTransactions = await Reimbursement.count({
        where: { accountId: id }
      }) > 0;

      res.json({
        success: true,
        data: {
          hasTransactions,
          lastTransactionDate: account.last_transaction_date
        }
      });
    } catch (error) {
      console.error('Error checking account transactions:', error);
      res.status(500).json({ 
        success: false, 
        message: '檢查賬戶交易記錄失敗',
        error: error.message
      });
    }
  },

  // 獲取帳戶交易記錄
  async getAccountTransactions(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: '帳戶不存在' 
        });
      }

      // 獲取與此帳戶相關的所有已付款請款單
      const reimbursements = await Reimbursement.findAll({
        where: { 
          accountId: id,
          status: 'paid'
        },
        order: [['reviewedAt', 'DESC']]
      });

      // 將請款單轉換為交易記錄格式
      const transactions = reimbursements.map(record => ({
        id: record.id,
        date: record.reviewedAt,
        type: 'expense',
        amount: record.totalAmount,
        balance: 0, // 稍後計算
        description: record.title,
        sourceType: record.type,
        sourceId: record.id
      }));

      // 計算每筆交易後的餘額
      let runningBalance = parseFloat(account.current_balance);
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        // 因為是從最新的交易開始，所以要先記錄當前餘額
        transactions[i].balance = runningBalance;
        // 然後根據交易類型計算前一筆交易的餘額
        if (transaction.type === 'expense') {
          runningBalance += parseFloat(transaction.amount); // 支出需要加回去得到之前的餘額
        } else {
          runningBalance -= parseFloat(transaction.amount); // 收入需要減掉得到之前的餘額
        }
      }

      console.log('Transactions with balance:', transactions);

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      res.status(500).json({ 
        success: false, 
        message: '獲取交易記錄失敗',
        error: error.message
      });
    }
  }
};

module.exports = accountController;
