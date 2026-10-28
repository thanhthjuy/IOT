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

// ================================
// LED CONTROL
// ================================

function toggleLED(number) {
  const led = document.getElementById("led" + number);
  const status = document.getElementById("led" + number + "Status");
  const bulb = document.getElementById("bulb" + number);

  if (!led) return;

  const isOn = led.classList.contains("on");

  led.classList.toggle("on", !isOn);

  if (status) {
    status.innerText = isOn ? "OFF" : "ON";
    status.classList.toggle("on", !isOn);
    status.classList.toggle("off", isOn);
  }

  if (bulb) {
    if (isOn) {
      bulb.style.color = "#9ca3af";
      bulb.style.opacity = "0.4";
      bulb.style.filter = "grayscale(1)";
      bulb.style.textShadow = "none";
    } else {
      bulb.style.color = "#facc15";
      bulb.style.opacity = "1";
      bulb.style.filter = "grayscale(0)";
      bulb.style.textShadow = "0 0 15px rgba(250, 204, 21, 0.8)";
    }
  }
}

/* ================================
   SHARED TABLE PAGINATION
   Dùng chung cho Sensor Data và Activity History
================================ */

function renderPagination(container, totalPages, currentPage, onChange) {
  if (!container) return;

  container.innerHTML = "";

  totalPages = Math.floor(Number(totalPages) || 0);
  currentPage = Math.floor(Number(currentPage) || 1);

  if (totalPages <= 0) return;

  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  const pages = new Set();

  // Luôn hiển thị trang đầu.
  pages.add(1);

  // Hiển thị các trang gần trang hiện tại.
  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page++
  ) {
    pages.add(page);
  }

  // Khi ở đầu danh sách.
  if (currentPage <= 2) {
    for (let page = 2; page <= Math.min(3, totalPages - 1); page++) {
      pages.add(page);
    }
  }

  // Khi ở cuối danh sách.
  if (currentPage >= totalPages - 1) {
    for (let page = Math.max(2, totalPages - 2); page < totalPages; page++) {
      pages.add(page);
    }
  }

  // Luôn hiển thị trang cuối.
  if (totalPages > 1) {
    pages.add(totalPages);
  }

  const visiblePages = Array.from(pages).sort((a, b) => a - b);

  let previousPage = 0;

  visiblePages.forEach(function (page) {
    // Thêm ... khi có từ một trang bị ẩn trở lên.
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

// ============================================================
// SENSOR DATA
// ============================================================

function setupSensorData() {
  const table = document.querySelector(".table-card table");
  const filterBox = document.querySelector(".filter-box");
  const pagination = document.querySelector(".pagination");

  if (!table || !filterBox || !pagination) return;

  const tbody = table.querySelector("tbody");
  const pageContainer = pagination.querySelector("div");

  if (!tbody || !pageContainer) return;

  // Lưu lại dữ liệu gốc trước khi phân trang.
  const allRows = Array.from(tbody.querySelectorAll("tr"));

  const searchButton = filterBox.querySelector(".search-button");
  const resetButton = filterBox.querySelector(".reset-button");
  const timeInput = filterBox.querySelector("input");
  const sensorSelect = filterBox.querySelector("select");

  let filteredRows = [...allRows];
  let currentPage = 1;

  function getRowsPerPage() {
    const tableCard = document.querySelector(".table-card");

    if (!tableCard) return 8;

    const height = tableCard.clientHeight;
    const tableHeader = 45;
    const paginationHeight = 58;
    const rowHeight = 44;

    const availableHeight = height - tableHeader - paginationHeight;

    return Math.min(15, Math.max(5, Math.floor(availableHeight / rowHeight)));
  }

  function renderTable() {
    const rowsPerPage = getRowsPerPage();
    const totalRecords = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRecords);

    tbody.innerHTML = "";

    if (totalRecords === 0) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td colspan="5" style="text-align:center; padding:30px;">
          Không tìm thấy dữ liệu
        </td>
      `;

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

  if (searchButton) {
    searchButton.addEventListener("click", function () {
      const timeValue = timeInput.value.trim().toLowerCase();
      const sensorValue = sensorSelect.value.trim().toLowerCase();

      filteredRows = allRows.filter(function (row) {
        const cells = row.querySelectorAll("td");

        if (cells.length < 5) return false;

        const sensor = cells[1].textContent.trim().toLowerCase();
        const time = cells[4].textContent.trim().toLowerCase();

        const sensorMatch = sensorValue === "all" || sensor === sensorValue;

        const timeMatch = timeValue === "" || time.includes(timeValue);

        return sensorMatch && timeMatch;
      });

      currentPage = 1;
      renderTable();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      timeInput.value = "";
      sensorSelect.value = "All";

      filteredRows = [...allRows];
      currentPage = 1;

      renderTable();
    });
  }

  window.addEventListener("resize", renderTable);

  renderTable();
}

// ============================================================
// ACTIVITY HISTORY
// ============================================================

function setupActivityHistory() {
  const table = document.querySelector(".table-card table");
  const filterBox = document.querySelector(".history-filter");
  const pagination = document.querySelector(".pagination");

  if (!table || !filterBox || !pagination) return;

  const tbody = table.querySelector("tbody");
  const pageContainer = pagination.querySelector("div");

  if (!tbody || !pageContainer) return;

  // Lưu lại dữ liệu gốc trước khi phân trang.
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

  function getRowsPerPage() {
    const tableCard = document.querySelector(".table-card");

    if (!tableCard) return 8;

    const height = tableCard.clientHeight;
    const tableHeader = 45;
    const paginationHeight = 58;
    const rowHeight = 44;

    const availableHeight = height - tableHeader - paginationHeight;

    return Math.min(15, Math.max(5, Math.floor(availableHeight / rowHeight)));
  }

  function renderTable() {
    const rowsPerPage = getRowsPerPage();
    const totalRecords = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRecords);

    tbody.innerHTML = "";

    if (totalRecords === 0) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td colspan="6" style="text-align:center; padding:30px;">
          Không tìm thấy dữ liệu
        </td>
      `;

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

        const deviceMatch = deviceValue === "all" || device === deviceValue;

        const actionMatch = actionValue === "all" || action === actionValue;

        const statusMatch = statusValue === "all" || status === statusValue;

        const timeMatch = timeValue === "" || time.includes(timeValue);

        return deviceMatch && actionMatch && statusMatch && timeMatch;
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

  window.addEventListener("resize", renderTable);

  renderTable();
}

// ============================================================
// DASHBOARD CHARTS
// Dữ liệu biểu đồ mô phỏng, không ghi vào database.
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const dashboard = document.querySelector(".dashboard-main");

  if (!dashboard) return;

  const rangeSettings = {
    today: {
      count: 12,
      labels: [
        "00:00",
        "02:00",
        "04:00",
        "06:00",
        "08:00",
        "10:00",
        "12:00",
        "14:00",
        "16:00",
        "18:00",
        "20:00",
        "22:00",
      ],
    },

    "7days": {
      count: 7,
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },

    month: {
      count: 10,
      labels: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "30"],
    },
  };

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
      base: 28.5,
      variation: 3,
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
      base: 72,
      variation: 12,
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
      base: 650,
      variation: 250,
      floor: 0,
      ceiling: 1200,
      precision: 0,
    },
  ];

  let selectedRange = "today";
  const dataStore = {};

  function createInitialData(config, count) {
    const values = [];
    let previous = config.base;

    for (let i = 0; i < count; i++) {
      previous += (Math.random() - 0.5) * config.variation * 0.8;
      previous += (config.base - previous) * 0.2;

      previous = Math.max(config.floor, Math.min(config.ceiling, previous));

      values.push(Number(previous.toFixed(config.precision)));
    }

    return values;
  }

  function formatValue(value, config) {
    return Number(value).toFixed(config.precision);
  }

  function renderChart(config, animate) {
    const svg = document.getElementById(config.svgId);

    if (!svg) return;

    const settings = rangeSettings[selectedRange];
    let values = dataStore[config.key];

    if (!values || values.length !== settings.count) {
      values = createInitialData(config, settings.count);
      dataStore[config.key] = values;
    }

    const width = 500;
    const height = 210;
    const left = 43;
    const right = 12;
    const top = 15;
    const bottom = 34;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);

    const span = Math.max(maxValue - minValue, config.variation * 0.35);

    minValue = Math.max(config.floor, minValue - span * 0.2);
    maxValue = Math.min(config.ceiling, maxValue + span * 0.2);

    if (maxValue <= minValue) {
      maxValue = minValue + 1;
    }

    const x = (index) =>
      left + (index / Math.max(1, values.length - 1)) * plotWidth;

    const y = (value) =>
      top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;

    let markup = "";

    for (let i = 0; i < 5; i++) {
      const gy = top + (plotHeight * i) / 4;
      const labelValue = maxValue - ((maxValue - minValue) * i) / 4;

      markup += `
        <line
          x1="${left}" y1="${gy}"
          x2="${width - right}" y2="${gy}"
          class="chart-grid-line"
        />
        <text
          x="${left - 7}" y="${gy + 4}"
          text-anchor="end"
          class="chart-axis-label"
        >${Math.round(labelValue)}</text>
      `;
    }

    settings.labels.forEach(function (label, index) {
      markup += `
        <text
          x="${x(index)}" y="${height - 9}"
          text-anchor="middle"
          class="chart-axis-label"
        >${label}</text>
      `;
    });

    const points = values
      .map((value, index) => `${x(index)},${y(value)}`)
      .join(" ");

    const area = `
      ${left},${top + plotHeight}
      ${points}
      ${width - right},${top + plotHeight}
    `;

    markup += `
      <polygon
        points="${area}"
        fill="${config.color}"
        opacity="0.10"
      />
      <polyline
        points="${points}"
        fill="none"
        stroke="${config.color}"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
        style="${animate ? "" : "animation:none;stroke-dashoffset:0"}"
      />
    `;

    values.forEach(function (value, index) {
      markup += `
        <circle
          cx="${x(index)}"
          cy="${y(value)}"
          r="3"
          fill="${config.color}"
          class="chart-point"
          style="animation-delay:${index * 25}ms"
        >
          <title>${formatValue(value, config)} ${config.unit}</title>
        </circle>
      `;
    });

    svg.innerHTML = markup;

    const current = values[values.length - 1];
    const currentElement = document.getElementById(config.currentId);
    const minElement = document.getElementById(config.minId);
    const maxElement = document.getElementById(config.maxId);
    const summaryElement = document.getElementById(config.summaryId);

    if (currentElement) {
      currentElement.textContent = `${formatValue(current, config)} ${config.unit}`;
    }

    if (minElement) {
      minElement.textContent = `Min ${formatValue(Math.min(...values), config)} ${config.unit}`;
    }

    if (maxElement) {
      maxElement.textContent = `Max ${formatValue(Math.max(...values), config)} ${config.unit}`;
    }

    if (summaryElement) {
      const value = document.createTextNode(formatValue(current, config) + " ");
      const unit = document.createElement("small");

      unit.textContent = config.unit;
      summaryElement.replaceChildren(value, unit);
    }
  }

  function redrawAll(animate = true) {
    configs.forEach(function (config) {
      renderChart(config, animate);
    });
  }

  document.querySelectorAll(".time-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      const range = button.dataset.range;

      if (!rangeSettings[range]) return;

      selectedRange = range;

      document.querySelectorAll(".time-btn").forEach(function (item) {
        const isActive = item === button;

        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      configs.forEach(function (config) {
        dataStore[config.key] = createInitialData(
          config,
          rangeSettings[selectedRange].count,
        );
      });

      redrawAll(true);
    });
  });

  redrawAll(true);

  // Chỉ tạo một bộ cập nhật biểu đồ cho Dashboard.
  window.setInterval(function () {
    const count = rangeSettings[selectedRange].count;

    configs.forEach(function (config) {
      let values = dataStore[config.key];

      if (!values || values.length !== count) {
        values = createInitialData(config, count);
      }

      const previous = values[values.length - 1];

      let next = previous + (Math.random() - 0.5) * config.variation * 0.55;

      next += (config.base - next) * 0.12;

      next = Math.max(config.floor, Math.min(config.ceiling, next));

      values.push(Number(next.toFixed(config.precision)));
      values.shift();

      dataStore[config.key] = values;

      renderChart(config, true);
    });
  }, 3000);

  document
    .querySelectorAll(".dashboard-light-controls .switch")
    .forEach(function (switchElement) {
      switchElement.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();

        const match = switchElement.id.match(/led(\d+)/);

        if (match) {
          toggleLED(Number(match[1]));
        }
      });
    });
});

// ============================================================
// EDIT PROFILE
// ============================================================

function editProfile() {
  const nameElement = document.querySelector(".profile-header h1");
  const msvElement = document.getElementById("profile-msv");
  const roleElement = document.getElementById("profile-role");

  if (!nameElement || !msvElement || !roleElement) return;

  const name = prompt("Nhập họ và tên:", nameElement.textContent);
  if (name === null) return;

  const msv = prompt("Nhập mã sinh viên:", msvElement.textContent);
  if (msv === null) return;

  const role = prompt("Nhập chức vụ:", roleElement.textContent);
  if (role === null) return;

  if (!name.trim() || !msv.trim() || !role.trim()) {
    alert("Các thông tin không được để trống!");
    return;
  }

  nameElement.textContent = name.trim();
  msvElement.textContent = msv.trim();
  roleElement.textContent = role.trim();

  localStorage.setItem("profileName", name.trim());
  localStorage.setItem("profileMsv", msv.trim());
  localStorage.setItem("profileRole", role.trim());

  alert("Cập nhật thông tin thành công!");
}

// ============================================================
// LOAD PROFILE
// ============================================================

function loadProfile() {
  const nameElement = document.querySelector(".profile-header h1");
  const msvElement = document.getElementById("profile-msv");
  const roleElement = document.getElementById("profile-role");

  if (!nameElement || !msvElement || !roleElement) return;

  const name = localStorage.getItem("profileName");
  const msv = localStorage.getItem("profileMsv");
  const role = localStorage.getItem("profileRole");

  if (name) nameElement.textContent = name;
  if (msv) msvElement.textContent = msv;
  if (role) roleElement.textContent = role;
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

function changePassword() {
  alert(
    "Chức năng đổi mật khẩu cần được kết nối với hệ thống đăng nhập để xác thực mật khẩu hiện tại và lưu mật khẩu mới an toàn.",
  );
}
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".sensor-select")) {
    setupSensorData();
  }
  if (document.querySelector(".history-filter")) {
    setupActivityHistory();
  }
});
