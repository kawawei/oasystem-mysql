module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 更新所有記錄
    await queryInterface.sequelize.query(`
      UPDATE attendances 
      SET status = CASE 
        WHEN checkOutTime IS NOT NULL THEN 'out'
        ELSE 'in'
      END;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 如果需要回滾，我們不做任何操作
    return Promise.resolve();
  }
}; 