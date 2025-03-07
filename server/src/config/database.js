const { Sequelize } = require('sequelize');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'liheng_oa',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'mysql-dev',
    dialect: 'mysql',
    timezone: '+08:00',
    dialectOptions: {
      timezone: '+08:00',
      dateStrings: true,
      typeCast: true
    },
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
  }
);

module.exports = sequelize; 