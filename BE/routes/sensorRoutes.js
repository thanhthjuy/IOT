const express = require("express");
const router = express.Router();

const { db } = require("../config/database");

// API 1: Lấy toàn bộ dữ liệu cảm biến
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, temperature, humidity, light, recorded_at
       FROM sensor_data
       ORDER BY recorded_at DESC`,
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error getting sensor data:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu cảm biến",
    });
  }
});

// API 2: Lấy dữ liệu cảm biến mới nhất
router.get("/latest", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, temperature, humidity, light, recorded_at
       FROM sensor_data
       ORDER BY recorded_at DESC
       LIMIT 1`,
    );

    res.status(200).json({
      success: true,
      data: rows.length > 0 ? rows[0] : null,
    });
  } catch (error) {
    console.error("Error getting latest sensor data:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu cảm biến mới nhất",
    });
  }
});

module.exports = router;
