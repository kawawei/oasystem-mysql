const Account = require('../models/Account');
const sequelize = require('../config/database');

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
          where: {
            is_deleted: false
          },
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
            updatedAt: account.updated_at
          };
        });
        console.log('Mapped accounts:', JSON.stringify(mappedAccounts, null, 2));
        
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
  }
};

module.exports = accountController;
