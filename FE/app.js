// ================================
// LOGIN
// ================================

function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (username === "admin" && password === "admin") {
    window.location.href = "dashboard.html";
  } else {
    alert("Username hoặc Password không đúng!");
  }
}

// ================================
// LOGOUT
// ================================

function logout() {
  window.location.href = "index.html";
}

/* ================================
   SHARED TABLE PAGINATION
================================ */

function renderPagination(container, totalPages, currentPage, onChange) {
  if (!container) return;

  container.innerHTML = "";

  totalPages = Math.floor(Number(totalPages) || 0);
  currentPage = Math.floor(Number(currentPage) || 1);

  if (totalPages <= 0) return;

  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  const pages = new Set();
  pages.add(1);

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page++
  ) {
    pages.add(page);
  }

  if (currentPage <= 2) {
    for (let page = 2; page <= Math.min(3, totalPages - 1); page++) {
      pages.add(page);
    }
  }

  if (currentPage >= totalPages - 1) {
    for (let page = Math.max(2, totalPages - 2); page < totalPages; page++) {
      pages.add(page);
    }
  }

  if (totalPages > 1) {
    pages.add(totalPages);
  }

  const visiblePages = Array.from(pages).sort((a, b) => a - b);
  let previousPage = 0;

  visiblePages.forEach(function (page) {
    if (previousPage > 0 && page - previousPage > 1) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      container.appendChild(dots);
    }

    createPageButton(page);
    previousPage = page;
  });

  function createPageButton(page) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page";
    button.textContent = page;

    if (page === currentPage) {
      button.classList.add("active");
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", function () {
      if (page === currentPage) return;
      if (typeof onChange === "function") {
        onChange(page);
      }
    });

    container.appendChild(button);
  }
}

function setupPageSizeControl(pagination, pageContainer, onChange) {
  if (!pagination || !pageContainer) return;
  const select = pagination.querySelector(".page-size-select");
  if (!select) return;

  select.addEventListener("change", function () {
    if (typeof onChange === "function") {
      onChange(Number(select.value));
    }
  });

  return function () {
    return Number(select.value) || 10;
  };
}

// ============================================================
// SENSOR DATA & ACTIVITY HISTORY & DASHBOARD CHARTS
// ============================================================

function setupSensorData() {
  const table = document.querySelector(".table-card table");
  const filterBox = document.querySelector(".filter-box");
  const pagination = document.querySelector(".pagination");

  if (!table || !filterBox || !pagination) return;

  const tbody = table.querySelector("tbody");
  const pageContainer = pagination.querySelector("div");
  if (!tbody || !pageContainer) return;

  const allRows = Array.from(tbody.querySelectorAll("tr"));
  const searchButton = filterBox.querySelector(".search-button");
  const resetButton = filterBox.querySelector(".reset-button");
  const searchInput = filterBox.querySelector(".search-input");
  const sensorSelect = filterBox.querySelector(".sensor-filter");

  if (!searchInput || !sensorSelect) return;

  let filteredRows = [...allRows];
  let currentPage = 1;
  let rowsPerPage = 10;

  setupPageSizeControl(pagination, pageContainer, function (size) {
    rowsPerPage = size;
    currentPage = 1;
    renderTable();
  });

  function renderTable() {
    const totalRecords = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRecords);

    tbody.innerHTML = "";

    if (totalRecords === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="text-align:center; padding:30px;">Không tìm thấy dữ liệu</td>`;
      tbody.appendChild(tr);
    } else {
      filteredRows.slice(start, end).forEach(function (row, index) {
        const clone = row.cloneNode(true);
        const numberCell = clone.querySelector("td");
        if (numberCell) {
          numberCell.textContent = start + index + 1;
        }
        tbody.appendChild(clone);
      });
    }

    renderPagination(pageContainer, totalPages, currentPage, function (page) {
      currentPage = page;
      renderTable();
    });
  }

  function searchData() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const sensorValue = sensorSelect.value.trim().toLowerCase();

    filteredRows = allRows.filter(function (row) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return false;

      const sensor = cells[1].textContent.trim().toLowerCase();
      const time = cells[4].textContent.trim().toLowerCase();

      let sensorMatch = true;
      let searchMatch = true;

      if (
        sensorValue === "temperature" ||
        sensorValue === "humidity" ||
        sensorValue === "light"
      ) {
        sensorMatch = sensor === sensorValue;
      }

      if (searchValue !== "") {
        if (sensorValue === "time") {
          searchMatch = time.includes(searchValue);
        } else {
          const rowText = Array.from(cells)
            .slice(1)
            .map((cell) => cell.textContent.trim().toLowerCase())
            .join(" ");
          searchMatch = rowText.includes(searchValue);
        }
      }

      return sensorMatch && searchMatch;
    });

    currentPage = 1;
    renderTable();
  }

  if (searchButton) searchButton.addEventListener("click", searchData);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchData();
  });
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      searchInput.value = "";
      sensorSelect.value = "All";
      filteredRows = [...allRows];
      currentPage = 1;
      renderTable();
    });
  }

  renderTable();
}

function setupActivityHistory() {
  const table = document.querySelector(".table-card table");
  const filterBox = document.querySelector(".history-filter");
  const pagination = document.querySelector(".pagination");

  if (!table || !filterBox || !pagination) return;
  const tbody = table.querySelector("tbody");
  const pageContainer = pagination.querySelector("div");
  if (!tbody || !pageContainer) return;

  const allRows = Array.from(tbody.querySelectorAll("tr"));
  const searchButton = filterBox.querySelector(".search-button");
  const resetButton = filterBox.querySelector(".reset-button");
  const timeInput = filterBox.querySelector("input");
  const selects = filterBox.querySelectorAll("select");

  const deviceSelect = selects[0];
  const actionSelect = selects[1];
  const statusSelect = selects[2];
  if (!deviceSelect || !actionSelect || !statusSelect || !timeInput) return;

  let filteredRows = [...allRows];
  let currentPage = 1;
  let rowsPerPage = 10;

  setupPageSizeControl(pagination, pageContainer, function (size) {
    rowsPerPage = size;
    currentPage = 1;
    renderTable();
  });

  function renderTable() {
    const totalRecords = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRecords);

    tbody.innerHTML = "";

    if (totalRecords === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="text-align:center; padding:30px;">Không tìm thấy dữ liệu</td>`;
      tbody.appendChild(tr);
    } else {
      filteredRows.slice(start, end).forEach(function (row, index) {
        const clone = row.cloneNode(true);
        const numberCell = clone.querySelector("td");
        if (numberCell) numberCell.textContent = start + index + 1;
        tbody.appendChild(clone);
      });
    }

    renderPagination(pageContainer, totalPages, currentPage, function (page) {
      currentPage = page;
      renderTable();
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", function () {
      const timeValue = timeInput.value.trim().toLowerCase();
      const deviceValue = deviceSelect.value.trim().toLowerCase();
      const actionValue = actionSelect.value.trim().toLowerCase();
      const statusValue = statusSelect.value.trim().toLowerCase();

      filteredRows = allRows.filter(function (row) {
        const cells = row.querySelectorAll("td");
        if (cells.length < 6) return false;

        const device = cells[2].textContent.trim().toLowerCase();
        const action = cells[3].textContent.trim().toLowerCase();
        const status = cells[4].textContent.trim().toLowerCase();
        const time = cells[5].textContent.trim().toLowerCase();

        return (
          (deviceValue === "all" || device === deviceValue) &&
          (actionValue === "all" || action === actionValue) &&
          (statusValue === "all" || status === statusValue) &&
          (timeValue === "" || time.includes(timeValue))
        );
      });

      currentPage = 1;
      renderTable();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      timeInput.value = "";
      deviceSelect.value = "All";
      actionSelect.value = "All";
      statusSelect.value = "All";
      filteredRows = [...allRows];
      currentPage = 1;
      renderTable();
    });
  }

  renderTable();
}

// ============================================================
// API CONNECTION & DYNAMIC DATA LOADING
// ============================================================

const API_URL = "http://localhost:3000/api";

async function callAPI(url, options = {}) {
  try {
    const response = await fetch(API_URL + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Lỗi khi gọi API");
    }
    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateLEDInterface(number, isOn) {
  const led = document.getElementById("led" + number);
  const status = document.getElementById("led" + number + "Status");
  const bulb = document.getElementById("bulb" + number);

  if (led) {
    led.classList.toggle("on", isOn);
    led.classList.remove("loading");
  }
  if (status) {
    status.innerText = isOn ? "ON" : "OFF";
    status.classList.toggle("on", isOn);
    status.classList.toggle("off", !isOn);
  }
  if (bulb) {
    bulb.classList.toggle("active-bulb", isOn);
    bulb.classList.toggle("led-on", isOn);
    bulb.classList.toggle("led-off", !isOn);
  }
}

async function loadLEDStatus() {
  try {
    const result = await callAPI("/devices");
    const devices = result.data || [];
    devices.forEach(function (device) {
      const match = device.name.match(/LED\s*(\d+)/i);
      if (match) {
        updateLEDInterface(Number(match[1]), device.status === "ON");
      }
    });
  } catch (error) {
    console.error("Không thể tải trạng thái LED:", error);
  }
}

let toggleLED = async function (number) {
  const led = document.getElementById("led" + number);
  const status = document.getElementById("led" + number + "Status");

  if (!led || led.classList.contains("loading")) return;

  const currentIsOn = led.classList.contains("on");
  const action = currentIsOn ? "OFF" : "ON";

  led.classList.add("loading");
  led.disabled = true;

  if (status) {
    status.innerHTML = '<span class="loading-spinner"></span> Loading...';
    status.classList.remove("on", "off", "fail");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const result = await callAPI("/devices/" + number + "/control", {
      method: "POST",
      body: JSON.stringify({ action }),
      signal: controller.signal,
    });

    if (!result.success)
      throw new Error(result.message || "Điều khiển thất bại");

    updateLEDInterface(number, result.data.status === "ON");
  } catch (error) {
    updateLEDInterface(number, currentIsOn);
    if (status) {
      status.innerText = "FAIL";
      status.classList.remove("on", "off");
      status.classList.add("fail");
    }
    alert("Không thể điều khiển LED: " + error.message);
  } finally {
    clearTimeout(timeout);
    led.classList.remove("loading");
    led.disabled = false;
  }
};

const oldSetupSensorData = setupSensorData;
setupSensorData = async function () {
  const table = document.querySelector(".table-card table");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  try {
    const result = await callAPI("/sensors");
    const records = result.data || [];
    tbody.innerHTML = "";
    let rows = [];

    records.forEach(function (record) {
      const time = formatDateTime(record.recorded_at);
      rows.push({
        sensor: "Temperature",
        value: record.temperature,
        unit: "°C",
        time,
      });
      rows.push({
        sensor: "Humidity",
        value: record.humidity,
        unit: "%",
        time,
      });
      rows.push({ sensor: "Light", value: record.light, unit: "ADC", time });
    });

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;">Chưa có dữ liệu cảm biến</td></tr>`;
      return;
    }

    rows.forEach(function (item, index) {
      const tr = document.createElement("tr");

      const time = item.time;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <span class="sensor-name">
            <span class="sensor-dot ${item.sensor.toLowerCase()}"></span>
            ${item.sensor}
          </span>
        </td>
        <td>${item.value}</td>
        <td>${item.unit}</td>
        <td>
          <div class="time-copy-wrapper">
            <span>${time}</span>
            <button
              type="button"
              class="copy-time-btn"
              data-time="${time}"
              title="Copy thời gian"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <rect x="8" y="8" width="13" height="13" rx="2"/>
                <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
    // Copy thời gian khi nhấn biểu tượng
    tbody.addEventListener("click", async function (event) {
      const button = event.target.closest(".copy-time-btn");

      if (!button) return;

      const time = button.dataset.time;

      try {
        await navigator.clipboard.writeText(time);

        button.title = "Đã copy!";
        button.style.color = "#16a34a";

        button.innerHTML = `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m5 12 4 4L19 6"/>
          </svg>
        `;

        setTimeout(function () {
          button.title = "Copy thời gian";
          button.style.color = "";
          button.innerHTML = `
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="8" y="8" width="13" height="13" rx="2"/>
              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
            </svg>
          `;
        }, 1500);
      } catch (error) {
        alert("Không thể copy thời gian!");
        console.error(error);
      }
    });
    oldSetupSensorData();
  } catch (error) {
    console.error("Lỗi tải dữ liệu cảm biến:", error);
  }
};

const oldSetupActivityHistory = setupActivityHistory;
setupActivityHistory = async function () {
  const table = document.querySelector(".table-card table");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  try {
    const result = await callAPI("/history");
    const records = result.data || [];
    tbody.innerHTML = "";

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;">Chưa có lịch sử điều khiển</td></tr>`;
      return;
    }

    records.forEach(function (record, index) {
      const deviceName =
        record.device_key === "LED1"
          ? "LED 1"
          : record.device_key === "LED2"
            ? "LED 2"
            : record.device_key;

      const time = formatDateTime(record.created_at);

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${record.username || "admin"}</td>
        <td>${deviceName}</td>
        <td>${record.action}</td>
        <td>${record.status}</td>
        <td>
          <div class="time-copy-wrapper">
            <span>${time}</span>

            <button
              type="button"
              class="copy-time-btn"
              data-time="${time}"
              title="Copy thời gian"
              aria-label="Copy thời gian"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="8" y="8" width="13" height="13" rx="2"/>
                <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
    // Copy thời gian trong Activity History
    tbody.addEventListener("click", async function (event) {
      const button = event.target.closest(".copy-time-btn");

      if (!button) return;

      const time = button.dataset.time;

      try {
        await navigator.clipboard.writeText(time);

        button.title = "Đã copy!";
        button.style.color = "#16a34a";

        button.innerHTML = `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m5 12 4 4L19 6"/>
          </svg>
        `;

        setTimeout(function () {
          button.title = "Copy thời gian";
          button.style.color = "";

          button.innerHTML = `
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="8" y="8" width="13" height="13" rx="2"/>
              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
            </svg>
          `;
        }, 1500);
      } catch (error) {
        alert("Không thể copy thời gian!");
        console.error(error);
      }
    });
    oldSetupActivityHistory();
  } catch (error) {
    console.error("Lỗi tải lịch sử:", error);
  }
};

async function loadDashboardSensorData() {
  try {
    const result = await callAPI("/sensors/latest");
    const record = result.data;
    if (!record) return;

    const temperature = document.getElementById("temperatureCurrent");
    if (temperature) temperature.textContent = record.temperature + " °C";

    const humidity = document.getElementById("humidityCurrent");
    if (humidity) humidity.textContent = record.humidity + " %";

    const light = document.getElementById("lightCurrent");
    if (light) light.textContent = record.light + " ADC";
  } catch (error) {
    console.error("Không thể tải dữ liệu Dashboard:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".dashboard-main")) {
    loadDashboardSensorData();
    loadLEDStatus();
    setInterval(loadDashboardSensorData, 3000);
  }
  if (document.querySelector(".sensor-select")) {
    setupSensorData();
  }
  if (document.querySelector(".history-filter")) {
    setupActivityHistory();
  }
});

// ============================================================
// DASHBOARD CHARTS
// Vẽ biểu đồ từ TOÀN BỘ lịch sử sensor trong MySQL
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const dashboard = document.querySelector(".dashboard-main");
  if (!dashboard) return;

  const configs = [
    {
      key: "temperature",
      svgId: "temperatureChart",
      currentId: "temperatureCurrent",
      minId: "temperatureMin",
      maxId: "temperatureMax",
      summaryId: "temperatureSummary",
      unit: "°C",
      color: "#ff4048",
      floor: 15,
      ceiling: 40,
      precision: 1,
    },
    {
      key: "humidity",
      svgId: "humidityChart",
      currentId: "humidityCurrent",
      minId: "humidityMin",
      maxId: "humidityMax",
      summaryId: "humiditySummary",
      unit: "%",
      color: "#2d67e8",
      floor: 0,
      ceiling: 100,
      precision: 0,
    },
    {
      key: "light",
      svgId: "lightChart",
      currentId: "lightCurrent",
      minId: "lightMin",
      maxId: "lightMax",
      summaryId: "lightSummary",
      unit: "ADC",
      color: "#df7900",
      floor: 0,
      ceiling: 4095,
      precision: 0,
    },
  ];

  // Mặc định hiển thị toàn bộ lịch sử
  let selectedRange = "all";
  let sensorRecords = [];

  // ============================================================
  // 1. CHUYỂN ĐỔI THỜI GIAN
  // ============================================================

  function getRecordDate(record) {
    const value = record.recorded_at || record.created_at;

    if (!value) return null;

    let date;

    // MySQL DATETIME: YYYY-MM-DD HH:mm:ss
    // Xử lý theo giờ địa phương, tránh lệch múi giờ.
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
    ) {
      const parts = value.match(
        /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
      );

      date = new Date(
        Number(parts[1]),
        Number(parts[2]) - 1,
        Number(parts[3]),
        Number(parts[4]),
        Number(parts[5]),
        Number(parts[6]),
      );
    } else {
      date = new Date(value);
    }

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatTime(date, showDate) {
    if (showDate) {
      return (
        String(date.getDate()).padStart(2, "0") +
        "/" +
        String(date.getMonth() + 1).padStart(2, "0")
      );
    }

    return (
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0")
    );
  }

  // ============================================================
  // 2. LẤY TOÀN BỘ LỊCH SỬ SENSOR TỪ MYSQL
  // ============================================================

  async function loadSensorData() {
    try {
      const result = await callAPI("/sensors");

      sensorRecords = (result.data || [])
        .filter(function (record) {
          return getRecordDate(record) !== null;
        })
        .sort(function (a, b) {
          return getRecordDate(a) - getRecordDate(b);
        });

      renderAllCharts();
    } catch (error) {
      console.error("Lỗi tải lịch sử cảm biến:", error);

      configs.forEach(function (config) {
        const svg = document.getElementById(config.svgId);

        if (svg) {
          svg.innerHTML = `
            <text x="250" y="105"
              text-anchor="middle"
              fill="#ef4444"
              font-size="14">
              Không thể tải dữ liệu
            </text>
          `;
        }
      });
    }
  }

  // ============================================================
  // 3. LỌC LỊCH SỬ THEO KHOẢNG THỜI GIAN
  // ============================================================

  function filterRecords() {
    const now = new Date();

    return sensorRecords.filter(function (record) {
      const date = getRecordDate(record);

      if (!date) return false;

      // Toàn bộ lịch sử
      if (selectedRange === "all") {
        return true;
      }

      // Lịch sử hôm nay
      if (selectedRange === "today") {
        return date.toDateString() === now.toDateString();
      }

      // 7 ngày gần nhất
      if (selectedRange === "7days") {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        return date >= start && date <= now;
      }

      // Tháng hiện tại
      if (selectedRange === "month") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      return false;
    });
  }

  // ============================================================
  // 4. LẤY GIÁ TRỊ CẢM BIẾN
  // Không giới hạn 60 bản ghi
  // ============================================================

  function getChartData(config) {
    return filterRecords()
      .map(function (record) {
        const value = Number(record[config.key]);

        return {
          date: getRecordDate(record),
          value: value,
        };
      })
      .filter(function (item) {
        return item.date !== null && Number.isFinite(item.value);
      })
      .sort(function (a, b) {
        return a.date - b.date;
      });
  }

  function formatValue(value, config) {
    return Number(value).toFixed(config.precision);
  }

  // ============================================================
  // 5. VẼ BIỂU ĐỒ
  // Trục X căn theo thời gian thực tế
  // ============================================================

  function renderChart(config) {
    const svg = document.getElementById(config.svgId);
    if (!svg) return;

    const data = getChartData(config);

    const currentElement = document.getElementById(config.currentId);
    const minElement = document.getElementById(config.minId);
    const maxElement = document.getElementById(config.maxId);
    const summaryElement = document.getElementById(config.summaryId);

    // Không có dữ liệu
    if (data.length === 0) {
      svg.innerHTML = `
        <text x="250" y="105"
          text-anchor="middle"
          fill="#888"
          font-size="14">
          Chưa có dữ liệu cảm biến
        </text>
      `;

      if (currentElement) currentElement.textContent = "--";
      if (minElement) minElement.textContent = "Min --";
      if (maxElement) maxElement.textContent = "Max --";
      if (summaryElement) summaryElement.textContent = "--";

      return;
    }

    const width = 500;
    const height = 210;

    const left = 48;
    const right = 15;
    const top = 15;
    const bottom = 35;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    // ========================================================
    // TÍNH GIỚI HẠN TRỤC X THEO THỜI GIAN
    // ========================================================

    const firstTime = data[0].date.getTime();
    const lastTime = data[data.length - 1].date.getTime();

    // Nếu chỉ có một thời điểm, tạo khoảng hiển thị tối thiểu.
    const timeSpan = Math.max(lastTime - firstTime, 1000);

    function getX(date) {
      return left + ((date.getTime() - firstTime) / timeSpan) * plotWidth;
    }

    // ========================================================
    // TÍNH GIỚI HẠN TRỤC Y
    // ========================================================

    const values = data.map((item) => item.value);

    const actualMin = Math.min(...values);
    const actualMax = Math.max(...values);

    const span = Math.max(actualMax - actualMin, 1);

    let minValue = Math.max(config.floor, actualMin - span * 0.2);

    let maxValue = Math.min(config.ceiling, actualMax + span * 0.2);

    if (maxValue <= minValue) {
      maxValue = minValue + 1;
    }

    function getY(value) {
      return top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
    }

    let markup = "";

    // ========================================================
    // VẼ ĐƯỜNG LƯỚI VÀ NHÃN TRỤC Y
    // ========================================================

    for (let i = 0; i < 5; i++) {
      const y = top + (plotHeight * i) / 4;

      const labelValue = maxValue - ((maxValue - minValue) * i) / 4;

      markup += `
        <line
          x1="${left}"
          y1="${y}"
          x2="${width - right}"
          y2="${y}"
          stroke="#e5e7eb"
          stroke-width="1"
        />

        <text
          x="${left - 7}"
          y="${y + 4}"
          text-anchor="end"
          fill="#888"
          font-size="10"
        >${Number(labelValue.toFixed(config.precision))}</text>
      `;
    }

    // ========================================================
    // VẼ NHÃN TRỤC X THEO THỜI GIAN THỰC TẾ
    // ========================================================

    const showDate = timeSpan > 24 * 60 * 60 * 1000;

    for (let i = 0; i < 5; i++) {
      const ratio = i / 4;

      const timestamp = firstTime + timeSpan * ratio;

      const date = new Date(timestamp);
      const x = left + plotWidth * ratio;

      markup += `
        <text
          x="${x}"
          y="${height - 9}"
          text-anchor="middle"
          fill="#888"
          font-size="10"
        >${formatTime(date, showDate)}</text>
      `;
    }

    // ========================================================
    // VẼ ĐƯỜNG BIỂU ĐỒ TỪ TOÀN BỘ LỊCH SỬ
    // ========================================================

    const points = data.map(function (item) {
      return {
        x: getX(item.date),
        y: getY(item.value),
        value: item.value,
        date: item.date,
      };
    });

    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

    // Vùng màu bên dưới đường biểu đồ
    if (points.length >= 2) {
      const areaPoints = [
        `${points[0].x},${top + plotHeight}`,
        linePoints,
        `${points[points.length - 1].x},${top + plotHeight}`,
      ].join(" ");

      markup += `
        <polygon
          points="${areaPoints}"
          fill="${config.color}"
          opacity="0.10"
        />
      `;

      // Đường nối các lần đo
      markup += `
        <polyline
          points="${linePoints}"
          fill="none"
          stroke="${config.color}"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      `;
    }

    // Vẽ điểm dữ liệu nếu số lượng không quá lớn.
    // Khi có nhiều bản ghi, vẫn giữ toàn bộ điểm trên đường nối.
    if (points.length <= 100) {
      points.forEach(function (point) {
        markup += `
          <circle
            cx="${point.x}"
            cy="${point.y}"
            r="3"
            fill="${config.color}"
          >
            <title>
              ${formatValue(point.value, config)} ${config.unit}
              - ${formatDateTime(point.date)}
            </title>
          </circle>
        `;
      });
    }

    svg.innerHTML = markup;

    // ========================================================
    // CẬP NHẬT CURRENT, MIN, MAX
    // ========================================================

    const current = data[data.length - 1].value;

    if (currentElement) {
      currentElement.textContent = `${formatValue(current, config)} ${config.unit}`;
    }

    if (minElement) {
      minElement.textContent = `Min ${formatValue(actualMin, config)} ${config.unit}`;
    }

    if (maxElement) {
      maxElement.textContent = `Max ${formatValue(actualMax, config)} ${config.unit}`;
    }

    if (summaryElement) {
      summaryElement.textContent = `${formatValue(current, config)} ${config.unit}`;
    }
  }

  // ============================================================
  // 6. VẼ LẠI CẢ 3 BIỂU ĐỒ
  // ============================================================

  function renderAllCharts() {
    configs.forEach(function (config) {
      renderChart(config);
    });
  }

  // ============================================================
  // 7. NÚT LỌC TODAY / 7 DAYS / MONTH
  // ============================================================

  document.querySelectorAll(".time-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      const range = button.dataset.range;

      if (!["today", "7days", "month", "all"].includes(range)) {
        return;
      }

      selectedRange = range;

      document.querySelectorAll(".time-btn").forEach(function (item) {
        const isActive = item === button;

        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      renderAllCharts();
    });
  });

  // ============================================================
  // 8. TẢI DỮ LIỆU VÀ TỰ ĐỘNG CẬP NHẬT
  // ============================================================

  loadSensorData();

  // Cập nhật biểu đồ mỗi 3 giây
  window.setInterval(loadSensorData, 3000);
});
