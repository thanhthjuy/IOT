const express = require("express");
const router = express.Router();

const { db } = require("../config/database");

// API 1: Lấy toàn bộ lịch sử hoạt động
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          h.id,
          u.username,
          h.device_id,
          d.name AS device_name,
          d.name AS device,
          CASE
            WHEN h.device_id = 1 THEN 'LED1'
            WHEN h.device_id = 2 THEN 'LED2'
            ELSE d.name
          END AS device_key,
          h.action,
          h.status,
          h.time,
          h.time AS created_at
       FROM device_history h
       LEFT JOIN users u ON h.user_id = u.id
       LEFT JOIN devices d ON h.device_id = d.id
       ORDER BY h.time DESC`,
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error getting history:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử hoạt động",
    });
  }
});

// API 2: Lọc lịch sử theo thiết bị
router.get("/device/:deviceKey", async (req, res) => {
  try {
    const deviceKey = req.params.deviceKey.trim().toUpperCase();

    const deviceIdMap = {
      LED1: 1,
      LED2: 2,
    };

    const deviceId = deviceIdMap[deviceKey];

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Mã thiết bị không hợp lệ",
      });
    }

    const [rows] = await db.query(
      `SELECT
          h.id,
          u.username,
          h.device_id,
          d.name AS device_name,
          d.name AS device,
          CASE
            WHEN h.device_id = 1 THEN 'LED1'
            WHEN h.device_id = 2 THEN 'LED2'
            ELSE d.name
          END AS device_key,
          h.action,
          h.status,
          h.time,
          h.time AS created_at
       FROM device_history h
       LEFT JOIN users u ON h.user_id = u.id
       LEFT JOIN devices d ON h.device_id = d.id
       WHERE h.device_id = ?
       ORDER BY h.time DESC`,
      [deviceId],
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error filtering history:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể lọc lịch sử hoạt động",
    });
  }
});

module.exports = router;
