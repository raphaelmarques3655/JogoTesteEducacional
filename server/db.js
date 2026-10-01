const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:
    process.env.DB_HOST ||
    '10.137.11.209',

  port:
    Number(
      process.env.DB_PORT ||
      3306
    ),

  user:
    process.env.DB_USER ||
    'alfabetiza',

  password:
    process.env.DB_PASSWORD ||
    '123456',

  database:
    process.env.DB_NAME ||
    'alfabetiza',

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  charset: 'utf8mb4'
});

module.exports = pool;