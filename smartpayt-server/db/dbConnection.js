// db/dbConnection.js
require("dotenv").config();
const mysql = require("mysql2/promise");

// ✅ ใช้ mysql2/promise โดยตรง (ไม่ต้อง .promise() อีก)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Connected to MySQL database.");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

module.exports = db;
