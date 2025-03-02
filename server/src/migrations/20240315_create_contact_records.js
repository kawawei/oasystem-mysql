'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contact_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '通話記錄 ID'
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '關聯的客戶 ID'
      },
      call_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '通話時間'
      },
      result: {
        type: Sequelize.ENUM(
          'answered',    // 已接聽
          'no_answer',   // 未接聽
          'busy',        // 忙碌中
          'invalid'      // 空號
        ),
        allowNull: false,
        comment: '通話結果'
      },
      intention: {
        type: Sequelize.ENUM(
          'interested',     // 有意願
          'considering',    // 考慮中
          'not_interested', // 無意願
          'call_back',      // 預約回撥
          'visited'         // 已約訪
        ),
        allowNull: true,
        comment: '意向程度（僅在已接聽時有效）'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '備註'
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
    await queryInterface.addIndex('contact_records', ['customer_id']);
    await queryInterface.addIndex('contact_records', ['call_time']);
    await queryInterface.addIndex('contact_records', ['result']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contact_records');
  }
}; 