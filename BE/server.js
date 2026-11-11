const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDatabase } = require("./config/database");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const historyRoutes = require("./routes/historyRoutes");
const { mqttClient } = require("./services/mqttService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/history", historyRoutes);

// API kiểm tra Backend
app.get("/", (req, res) => {
  res.json({
    message: "IoT System Backend is running!",
  });
});

// Khởi động Server
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
