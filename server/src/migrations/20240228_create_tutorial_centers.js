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
      intention: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '意向'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '補習班名稱'
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '地址'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '聯繫電話'
      },
      send_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '寄送日期'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Email'
      },
      area: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '區域'
      },
      contact: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '窗口聯繫人'
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
    await queryInterface.addIndex('tutorial_centers', ['intention']);
    await queryInterface.addIndex('tutorial_centers', ['area']);
    await queryInterface.addIndex('tutorial_centers', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tutorial_centers');
  }
}; 