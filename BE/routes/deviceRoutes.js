const express = require("express");
const router = express.Router();

const { db } = require("../config/database");
const { publishCommand } = require("../services/mqttService");

// Ánh xạ ID database với mã MQTT
const DEVICE_MAP = {
  1: {
    name: "LED 1",
    key: "LED1",
  },
  2: {
    name: "LED 2",
    key: "LED2",
  },
};

// API 1: Lấy danh sách thiết bị
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, type, status
       FROM devices
       ORDER BY id ASC`,
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error getting devices:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách thiết bị",
    });
  }
});

// API 2: Điều khiển LED
router.post("/:id/control", async (req, res) => {
  try {
    const deviceId = Number(req.params.id);

    const action =
      typeof req.body?.action === "string"
        ? req.body.action.trim().toUpperCase()
        : "";

    if (!Number.isInteger(deviceId) || deviceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID thiết bị không hợp lệ",
      });
    }

    if (!["ON", "OFF"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Lệnh chỉ được là ON hoặc OFF",
      });
    }

    // Kiểm tra ID có trong danh sách LED hỗ trợ
    const deviceConfig = DEVICE_MAP[deviceId];

    if (!deviceConfig) {
      return res.status(400).json({
        success: false,
        message: "ID thiết bị không được hỗ trợ",
      });
    }

    // Lấy thiết bị trong database
    const [devices] = await db.query(
      "SELECT id, name, type, status FROM devices WHERE id = ?",
      [deviceId],
    );

    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị",
      });
    }

    const device = devices[0];

    if (
      device.type?.toUpperCase() !== "LED" ||
      device.name.trim().toUpperCase() !== deviceConfig.name.toUpperCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "Thông tin thiết bị không khớp với ID",
      });
    }

    // Tạo lệnh MQTT theo ID
    const command = `${deviceConfig.key}:${action}`;

    console.log(`Điều khiển ${deviceConfig.name}: ${command}`);

    // Gửi lệnh MQTT
    try {
      await publishCommand(command);
    } catch (mqttError) {
      await db.query(
        `INSERT INTO device_history
         (user_id, device_id, action, status, time)
         VALUES (?, ?, ?, ?, NOW())`,
        [1, deviceId, action, "FAILED"],
      );

      return res.status(503).json({
        success: false,
        message: mqttError.message || "Không thể gửi lệnh MQTT",
      });
    }

    // Cập nhật đúng thiết bị theo ID
    await db.query("UPDATE devices SET status = ? WHERE id = ?", [
      action,
      deviceId,
    ]);

    // Lưu lịch sử đúng device_id
    await db.query(
      `INSERT INTO device_history
       (user_id, device_id, action, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [1, deviceId, action, "SUCCESS"],
    );

    res.status(200).json({
      success: true,
      message: `Đã gửi lệnh ${action} đến ${deviceConfig.name}`,
      data: {
        id: deviceId,
        name: deviceConfig.name,
        device_key: deviceConfig.key,
        action: action,
        status: action,
      },
    });
  } catch (error) {
    console.error("Error controlling device:", error.message);

    res.status(500).json({
      success: false,
      message: "Không thể điều khiển thiết bị",
    });
  }
});

module.exports = router;
