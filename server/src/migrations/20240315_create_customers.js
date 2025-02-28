'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '客戶 ID'
      },
      tutorial_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tutorial_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '關聯的補習班 ID'
      },
      status: {
        type: Sequelize.ENUM(
          'new',           // 新名單
          'interested',    // 有意願
          'in_progress',   // 考慮中
          'not_interested',// 無意願
          'no_answer',     // 未接聽
          'busy',          // 忙線中
          'invalid',       // 空號
          'call_back',     // 預約回撥
          'visited',       // 已拜訪
          'contracted'     // 已簽約
        ),
        defaultValue: 'new',
        comment: '客戶狀態'
      },
      last_contact_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最後聯繫時間'
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

    // 添加索引
    await queryInterface.addIndex('customers', ['tutorial_center_id']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('customers', ['last_contact_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customers');
  }
}; 