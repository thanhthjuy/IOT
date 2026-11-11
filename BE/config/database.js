const mysql = require("mysql2/promise");
require("dotenv").config();

// Cấu hình kết nối MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối Database
async function connectDatabase() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully!");

    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}

module.exports = {
  db,
  connectDatabase,
};
