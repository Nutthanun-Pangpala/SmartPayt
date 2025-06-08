// Load environment variables from .env file
require('dotenv').config();
const mysql = require('mysql2');

// Set up MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: 3307,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,  // This ensures the database is selected
});


// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

module.exports = db;
