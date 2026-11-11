const mqtt = require("mqtt");
require("dotenv").config();

const { db } = require("../config/database");

// Kết nối MQTT Broker
const mqttClient = mqtt.connect(
  `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
  {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `iot_backend_${process.pid}`,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  },
);

// Khi kết nối thành công
mqttClient.on("connect", () => {
  console.log("MQTT connected successfully!");

  // Đăng ký nhận dữ liệu cảm biến
  mqttClient.subscribe(process.env.MQTT_TOPIC_SENSOR, { qos: 1 }, (error) => {
    if (error) {
      console.error("MQTT subscribe error:", error.message);
    } else {
      console.log("Subscribed to:", process.env.MQTT_TOPIC_SENSOR);
    }
  });
});

// Khi nhận được dữ liệu từ MQTT
mqttClient.on("message", async (topic, message) => {
  if (topic !== process.env.MQTT_TOPIC_SENSOR) {
    return;
  }

  try {
    const payload = message.toString().trim();
    console.log("Received sensor data:", payload);

    let temperature, humidity, light;

    // Hỗ trợ cả định dạng JSON hoặc dạng key:value phân cách bởi dấu phẩy
    if (payload.startsWith("{") && payload.endsWith("}")) {
      const data = JSON.parse(payload);
      temperature = Number(data.temp ?? data.temperature);
      humidity = Number(data.humi ?? data.humidity);
      light = Number(data.light);
    } else {
      const values = {};
      payload.split(",").forEach((item) => {
        const parts = item.split(":");
        if (parts.length === 2) {
          values[parts[0].trim().toLowerCase()] = Number(parts[1].trim());
        }
      });
      temperature = values.temp;
      humidity = values.humi;
      light = values.light;
    }

    // Kiểm tra dữ liệu
    if (
      !Number.isFinite(temperature) ||
      !Number.isFinite(humidity) ||
      !Number.isFinite(light)
    ) {
      console.error("Invalid sensor data parsed:", {
        temperature,
        humidity,
        light,
      });
      return;
    }

    // Lưu dữ liệu vào MySQL
    await db.query(
      `INSERT INTO sensor_data (temperature, humidity, light)
             VALUES (?, ?, ?)`,
      [temperature, humidity, light],
    );

    console.log("Sensor data saved to MySQL!");
  } catch (error) {
    console.error("Error processing sensor data:", error.message);
  }
});

// Khi mất kết nối và kết nối lại
mqttClient.on("reconnect", () => {
  console.log("Reconnecting to MQTT Broker...");
});

// Khi xảy ra lỗi
mqttClient.on("error", (error) => {
  console.error("MQTT Error:", error.message);
});

// Hàm gửi lệnh điều khiển LED
function publishCommand(command) {
  return new Promise((resolve, reject) => {
    if (!mqttClient.connected) {
      return reject(new Error("MQTT Broker chưa kết nối"));
    }

    mqttClient.publish(
      process.env.MQTT_TOPIC_CONTROL,
      command,
      { qos: 1, retain: false },
      (error) => {
        if (error) {
          return reject(error);
        }

        console.log("MQTT command sent:", command);
        resolve(true);
      },
    );
  });
}

module.exports = {
  mqttClient,
  publishCommand,
};
