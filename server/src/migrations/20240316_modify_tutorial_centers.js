// 修改補習班表欄位屬性的遷移文件
// Migration file for modifying tutorial centers table columns
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 修改所有必填欄位為可空
    // Modify all required fields to be nullable
    await queryInterface.changeColumn('tutorial_centers', 'intention', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '意向'
    });

    await queryInterface.changeColumn('tutorial_centers', 'name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: '補習班名稱'
    });

    await queryInterface.changeColumn('tutorial_centers', 'address', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '地址'
    });

    await queryInterface.changeColumn('tutorial_centers', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '聯繫電話'
    });

    await queryInterface.changeColumn('tutorial_centers', 'area', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '區域'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 恢復欄位為必填
    // Restore fields to be required
    await queryInterface.changeColumn('tutorial_centers', 'intention', {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: '意向'
    });

    await queryInterface.changeColumn('tutorial_centers', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: '補習班名稱'
    });

    await queryInterface.changeColumn('tutorial_centers', 'address', {
      type: Sequelize.STRING(200),
      allowNull: false,
      comment: '地址'
    });

    await queryInterface.changeColumn('tutorial_centers', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: '聯繫電話'
    });

    await queryInterface.changeColumn('tutorial_centers', 'area', {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: '區域'
    });
  }
}; 