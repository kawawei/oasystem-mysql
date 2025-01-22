const { Sequelize } = require('sequelize');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'mysql-dev',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'oa_system_dev',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  retry: {
    max: 10,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    backoffBase: 1000,
    backoffExponent: 1.5,
  }
});

module.exports = sequelize; 