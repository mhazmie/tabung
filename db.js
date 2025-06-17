const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',          // Change if using remote DB
  user: 'root',               // Your DB username
  password: 'rootpassword',   // Your DB password
  database: 'tabung'          // Your DB name
});

connection.connect((error) => {
  if (error) {
    console.error('Error connecting to the database:', error.stack);
    return;
  }
  console.log('Connected to MySQL as ID', connection.threadId);
});

module.exports = connection;
