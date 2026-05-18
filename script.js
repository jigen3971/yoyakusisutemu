// ===================================================
//  予約システム - script.js
//  ★ CONFIG を変更して設定をカスタマイズできます
// ===================================================

const CONFIG = {
  gasUrl: "https://script.google.com/macros/s/AKfycbw2go_rY8H3_tQ0bzig6Ub8wY83Z-DSp83EakfeMMv6M0EsC6VX738vWXGGoqGatbc-/exec",

  // 営業時間（24時間形式）
  openHour: 11,
  closeHour: 21,

  // 定休日（0=日 1=月 2=火 3=水 4=木 5=金 6=土）
  closedDays: [1], // 月曜定休

  // スロット間隔（分）
  slotMinutes: 30,

  // 予約種別設定
  types: {
    food: {
      label: "お食事",
      emoji: "🍛",
      colorClass: "food",
      capacity: 8,      // 同時間帯の最大予約組数
      duration: 1,      // 占有スロット数（1=30分）
      showPeople: true, // 人数選択を表示
    },
    fortune: {
      label: "占い",
      emoji: "🔮",
      colorClass: "fortune",
      capacity: 1,
      duration: 1,      // 1スロット=30分
      showPeople: false,
    },
    pcclass: {
      label: "パソコン教室",
      emoji: "💻",
      colorClass: "pcclass",
      capacity: 3,
      duration: 3,      // 3スロット=90分
      showPeople: true,
    }
  }
};

// ===== 状態管理 =====
let state = {
  type: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  people: "",
  note: "",
};

let calYear, calMonth;
let screenHistory = [];

// ===== 画面管理 =====
function showScreen(name, addHistory = true) {
  if (addHistory && currentScreen()) screenHistory.push(currentScreen());
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  window.scrollTo(0, 0);

  const backBtn = document.getElementById("btn-back");
  const progressBar = document.getElementById("progress-bar");

  if (name === "type") {
    backBtn.style.display = "none";
    progressBar.style.display = "none";
    screenHistory = [];
  } else {
    backBtn.style.display = "block";
    progressBar.style.display = "flex";
  }

  // 進捗バー更新
  const stepMap = { type:1, calendar:2, time:3, form:4, confirm:5, done:5 };
  const current = stepMap[name] || 1;
  document.querySelectorAll(".step").forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.remove("active", "done");
    if (n === current) s.classList.add("active");
    else if (n < current) s.classList.add("done");
  });
}

function currentScreen() {
  const active = document.querySelector(".screen.active");
  return active ? active.id.replace("screen-", "") : null;
}

function goBack() {
  if (screenHistory.length > 0) {
    const prev = screenHistory.pop();
    showScreen(prev, false);
  }
}

// ===== 種別選択 =====
function selectType(type) {
  state.type = type;
  state.date = null;
  state.time = null;

  const t = CONFIG.types[type];

  // カレンダーバッジ
  document.getElementById("cal-type-badge").textContent = t.emoji + " " + t.label;
  document.getElementById("cal-type-badge").className = "type-badge " + t.colorClass;

  // 人数フィールド表示制御
  document.getElementById("group-people").style.display = t.showPeople ? "block" : "none";

  // カレンダー初期化
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();

  showScreen("calendar");
}

// ===== カレンダー =====
function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function renderCalendar() {
  document.getElementById("month-label").textContent = calYear + "年" + (calMonth + 1) + "月";

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const dip = new Date(calYear, calMonth, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const DOW = ["日","月","火","水","木","金","土"];
  const DOW_CLS = ["sun","","","","","","sat"];

  let html = DOW.map((d, i) =>
    '<div class="cal-header ' + DOW_CLS[i] + '">' + d + '</div>'
  ).join("");

  let dc = 1, nc = 1;

  for (let i = 0; i < 42; i++) {
    const col = i % 7;
    let dn, io = false, date;

    if (i < firstDow) {
      dn = dip - firstDow + i + 1;
      io = true;
      date = new Date(calYear, calMonth - 1, dn);
    } else if (dc <= dim) {
      dn = dc++;
      date = new Date(calYear, calMonth, dn);
    } else {
      dn = nc++;
      io = true;
      date = new Date(calYear, calMonth + 1, dn);
    }

    date.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isClosed = CONFIG.closedDays.includes(date.getDay());
    const isToday = date.getTime() === today.getTime();
    const colCls = col === 0 ? "sun" : col === 6 ? "sat" : "";
    const ds = toDateStr(date);
    const isSelected = ds === state.date;

    let cls = "cal-day " + colCls;
    if (io) cls += " other-month";
    else if (isPast || isClosed) cls += (isClosed ? " disabled" : " past");
    else if (isToday) cls += " today";
    if (isSelected) cls += " selected";

    const clickable = !io && !isPast && !isClosed;
    const onclick = clickable ? 'onclick="selectDate(\'' + ds + '\')"' : "";

    html += '<div class="' + cls + '" ' + onclick + '>' +
      '<span class="day-num">' + dn + '</span>' +
      (isClosed && !io ? '<span style="font-size:9px;color:#bbb;">休</span>' : '') +
      '</div>';
  }

  document.getElementById("cal-grid").innerHTML = html;
}

function toDateStr(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function formatDateJp(ds) {
  const d = new Date(ds);
  const dow = ["日","月","火","水","木","金","土"][d.getDay()];
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + dow + "）";
}

// ===== 日付選択 =====
async function selectDate(ds) {
  state.date = ds;
  state.time = null;

  // カレンダー再描画（選択状態更新）
  renderCalendar();

  const t = CONFIG.types[state.type];

  // 時間画面のヘッダー
  document.getElementById("time-type-badge").textContent = t.emoji + " " + t.label;
  document.getElementById("time-type-badge").className = "type-badge " + t.colorClass;
  document.getElementById("time-date-label").textContent = formatDateJp(ds);

  // スロット取得
  showLoading(true);
  const bookedSlots = await fetchBookedSlots(ds, state.type);
  showLoading(false);

  renderTimeSlots(bookedSlots);
  showScreen("time");
}

// ===== 予約済みスロット取得 =====
async function fetchBookedSlots(date, type) {
  if (!CONFIG.gasUrl || CONFIG.gasUrl === "YOUR_GAS_URL_HERE") {
    // デモモード：ランダムに何スロットか埋める
    return [];
  }
  try {
    const url = CONFIG.gasUrl + "?date=" + date + "&type=" + type;
    const res = await fetch(url);
    const data = await res.json();
    return data.bookedSlots || [];
  } catch {
    showToast("通信エラーが発生しました");
    return [];
  }
}

// ===== 時間スロット描画 =====
function renderTimeSlots(bookedSlots) {
  const t = CONFIG.types[state.type];
  const slots = generateSlots();
  const container = document.getElementById("time-slots");

  if (slots.length === 0) {
    container.innerHTML = '<div class="no-slots">本日の受付時間外です</div>';
    return;
  }

  let html = "";
  slots.forEach(slot => {
    const isBooked = isSlotBooked(slot, bookedSlots, t.duration, t.capacity);
    if (isBooked) {
      html += '<button class="slot-btn booked" disabled>×<br><span style="font-size:11px;">' + slot + '</span></button>';
    } else {
      html += '<button class="slot-btn' + (state.time === slot ? " selected" : "") +
        '" onclick="selectTime(\'' + slot + '\')">' + slot + '</button>';
    }
  });

  container.innerHTML = html;
}

function generateSlots() {
  const slots = [];
  for (let h = CONFIG.openHour; h < CONFIG.closeHour; h++) {
    for (let m = 0; m < 60; m += CONFIG.slotMinutes) {
      slots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
  }
  return slots;
}

function isSlotBooked(slot, bookedSlots, duration, capacity) {
  // このスロットに何件予約があるか確認
  let count = 0;
  bookedSlots.forEach(b => {
    // 予約が重複するスロットを確認
    const bStart = timeToMin(b.time);
    const bEnd = bStart + (b.duration || 1) * CONFIG.slotMinutes;
    const sStart = timeToMin(slot);
    const sEnd = sStart + duration * CONFIG.slotMinutes;
    if (sStart < bEnd && sEnd > bStart) count++;
  });
  return count >= capacity;
}

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ===== 時間選択 =====
function selectTime(time) {
  state.time = time;
  renderTimeSlots([]); // 選択状態更新

  // 時間確定後、フォームへ
  const t = CONFIG.types[state.type];
  const summary = t.emoji + " " + t.label + " / " +
    formatDateJp(state.date) + " " + state.time + "〜";
  document.getElementById("form-summary").textContent = summary;

  showScreen("form");
}

// ===== 確認画面 =====
function showConfirm() {
  const name = document.getElementById("f-name").value.trim();
  const phone = document.getElementById("f-phone").value.trim();
  const t = CONFIG.types[state.type];
  const people = t.showPeople ? document.getElementById("f-people").value : "1";

  if (!name) { showToast("お名前を入力してください"); return; }
  if (!phone) { showToast("電話番号を入力してください"); return; }
  if (t.showPeople && !people) { showToast("人数を選択してください"); return; }

  state.name = name;
  state.phone = phone;
  state.people = people || "1";
  state.note = document.getElementById("f-note").value.trim();

  const endTime = addMinutes(state.time, t.duration * CONFIG.slotMinutes);

  document.getElementById("confirm-details").innerHTML =
    row("種別", t.emoji + " " + t.label) +
    row("日付", formatDateJp(state.date)) +
    row("時間", state.time + " 〜 " + endTime) +
    (t.showPeople ? row("人数", state.people + "名") : "") +
    row("お名前", state.name) +
    row("電話番号", state.phone) +
    (state.note ? row("ご要望", state.note) : "");

  showScreen("confirm");
}

function row(label, value) {
  return '<div class="confirm-row"><span class="confirm-label">' + label +
    '</span><span class="confirm-value">' + value + '</span></div>';
}

function addMinutes(time, min) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + min;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" +
    String(total % 60).padStart(2, "0");
}

// ===== 予約送信 =====
async function submitBooking() {
  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  btn.textContent = "送信中...";
  showLoading(true);

  const t = CONFIG.types[state.type];
  const payload = {
    type: state.type,
    typeLabel: t.label,
    date: state.date,
    time: state.time,
    duration: t.duration,
    name: state.name,
    phone: state.phone,
    people: state.people,
    note: state.note,
    bookedAt: new Date().toISOString(),
  };

  let success = false;

  if (!CONFIG.gasUrl || CONFIG.gasUrl === "YOUR_GAS_URL_HERE") {
    // デモモード
    await new Promise(r => setTimeout(r, 1000));
    success = true;
  } else {
    try {
      await fetch(CONFIG.gasUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      success = true;
    } catch {
      showToast("送信エラーが発生しました。お電話にてお問い合わせください。");
    }
  }

  showLoading(false);
  btn.disabled = false;
  btn.textContent = "予約を確定する";

  if (success) {
    const endTime = addMinutes(state.time, t.duration * CONFIG.slotMinutes);
    document.getElementById("done-details").innerHTML =
      row("種別", t.emoji + " " + t.label) +
      row("日付", formatDateJp(state.date)) +
      row("時間", state.time + " 〜 " + endTime) +
      (t.showPeople && state.people !== "1" ? row("人数", state.people + "名") : "") +
      row("お名前", state.name) +
      row("電話番号", state.phone);

    showScreen("done");
  }
}

// ===== リセット =====
function resetApp() {
  state = { type: null, date: null, time: null, name: "", phone: "", people: "", note: "" };
  document.getElementById("f-name").value = "";
  document.getElementById("f-phone").value = "";
  document.getElementById("f-people").value = "";
  document.getElementById("f-note").value = "";
  screenHistory = [];
  showScreen("type");
}

// ===== ローディング =====
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "flex" : "none";
}

// ===== トースト =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.display = "none", 3000);
}

// ===== 初期化 =====
showScreen("type", false);