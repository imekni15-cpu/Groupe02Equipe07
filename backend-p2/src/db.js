const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_save',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log('MySQL connected successfully');
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
