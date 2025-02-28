// 創建補習班表的遷移文件 Migration file for creating tutorial centers table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tutorial_centers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '補習班 ID'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '補習班名稱'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '聯繫電話'
      },
      city: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '縣市'
      },
      district: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '區域'
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: '詳細地址'
      },
      contact: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '窗口聯繫人'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Email'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '備註'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '狀態'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '創建時間'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '更新時間'
      }
    });

    // 添加索引 Add indexes
    await queryInterface.addIndex('tutorial_centers', ['name']);
    await queryInterface.addIndex('tutorial_centers', ['city', 'district']);
    await queryInterface.addIndex('tutorial_centers', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tutorial_centers');
  }
}; 