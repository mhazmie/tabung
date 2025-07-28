const mysql = require('mysql2');

const connection = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  charset: 'utf8mb4',
  multipleStatements: false,
});

connection.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connection established');
    conn.release();
  }
});

module.exports = connection;