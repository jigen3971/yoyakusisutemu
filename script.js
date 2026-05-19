const CONFIG = {
  gasUrl: "https://script.google.com/macros/s/AKfycbzcmJdhFS1MSQ79nL36tUVTpcnjS87FVOuUHGKPPIX23g3VIR4HflOxQRZofpUe5mfp/exec",
  openHour: 11, closeHour: 18, closedDays: [2], closedSecondSunday: true, maxDaysAhead: 60, slotMinutes: 30,
  types: {
    food: { label: "お食事", emoji: "🍛", colorClass: "food", capacity: 6, duration: 1, showPeople: true },
    fortune: { label: "占い", emoji: "🔮", colorClass: "fortune", capacity: 1, duration: 1, showPeople: false },
    pcclass: { label: "パソコン教室", emoji: "💻", colorClass: "pcclass", capacity: 3, duration: 3, showPeople: true }
  }
};
let state = { type: null, date: null, time: null, name: "", phone: "", people: "", note: "" };
let calYear, calMonth, screenHistory = [];
function showScreen(name, addHistory = true) { if (addHistory && currentScreen()) screenHistory.push(currentScreen()); document.querySelectorAll(".screen").forEach(s => s.classList.remove("active")); document.getElementById("screen-" + name).classList.add("active"); window.scrollTo(0, 0); const b = document.getElementById("btn-back"), p = document.getElementById("progress-bar"); if (name === "type") { b.style.display = "none"; p.style.display = "none"; screenHistory = []; } else { b.style.display = "block"; p.style.display = "flex"; } const sm = { type:1, calendar:2, time:3, form:4, confirm:5, done:5 }, cur = sm[name] || 1; document.querySelectorAll(".step").forEach(s => { const n = parseInt(s.dataset.step); s.classList.remove("active","done"); if (n === cur) s.classList.add("active"); else if (n < cur) s.classList.add("done"); }); }
function currentScreen() { const a = document.querySelector(".screen.active"); return a ? a.id.replace("screen-","") : null; }
function goBack() { if (screenHistory.length > 0) { const p = screenHistory.pop(); showScreen(p, false); } }
function isSecondSunday(date) { return date.getDay() === 0 && date.getDate() > 7 && date.getDate() <= 14; }
function selectType(type) { state.type = type; state.date = null; state.time = null; const t = CONFIG.types[type]; document.getElementById("cal-type-badge").textContent = t.emoji + " " + t.label; document.getElementById("cal-type-badge").className = "type-badge " + t.colorClass; document.getElementById("group-people").style.display = t.showPeople ? "block" : "none"; const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); renderCalendar(); showScreen("calendar"); }
function prevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function nextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }
function renderCalendar() {
  document.getElementById("month-label").textContent = calYear + "年" + (calMonth + 1) + "月";
  const fd = new Date(calYear, calMonth, 1).getDay(), dim = new Date(calYear, calMonth + 1, 0).getDate(), dip = new Date(calYear, calMonth, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + CONFIG.maxDaysAhead);
  const DOW = ["日","月","火","水","木","金","土"], DC = ["sun","","","","","","sat"];
  let html = DOW.map((d,i) => '<div class="cal-header ' + DC[i] + '">' + d + '</div>').join("");
  let dc = 1, nc = 1;
  for (let i = 0; i < 42; i++) {
    const col = i % 7; let dn, io = false, date;
    if (i < fd) { dn = dip - fd + i + 1; io = true; date = new Date(calYear, calMonth - 1, dn); }
    else if (dc <= dim) { dn = dc++; date = new Date(calYear, calMonth, dn); }
    else { dn = nc++; io = true; date = new Date(calYear, calMonth + 1, dn); }
    date.setHours(0,0,0,0);
    const isPast = date < today, isTooFar = date > maxDate;
    const isClosed = CONFIG.closedDays.includes(date.getDay()) || (CONFIG.closedSecondSunday && isSecondSunday(date));
    const isToday = date.getTime() === today.getTime();
    const colCls = col === 0 ? "sun" : col === 6 ? "sat" : "";
    const ds = toDateStr(date), isSelected = ds === state.date;
    let cls = "cal-day " + colCls;
    if (io) cls += " other-month";
    else if (isPast || isTooFar || isClosed) cls += " disabled";
    if (isToday && !isClosed && !io) cls += " today";
    if (isSelected) cls += " selected";
    const ca = (!io && !isPast && !isTooFar && !isClosed) ? 'onclick="selectDate(\'' + ds + '\')"' : "";
    html += '<div class="' + cls + '" ' + ca + '><span class="day-num">' + dn + '</span>' + (isClosed && !io ? '<span class="day-closed">休</span>' : '') + '</div>';
  }
  document.getElementById("cal-grid").innerHTML = html;
}
function toDateStr(d) { return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function formatDateJp(ds) { const d = new Date(ds), dow = ["日","月","火","水","木","金","土"][d.getDay()]; return d.getFullYear() + "年" + (d.getMonth()+1) + "月" + d.getDate() + "日（" + dow + "）"; }
async function selectDate(ds) {
  state.date = ds; state.time = null; renderCalendar();
  const t = CONFIG.types[state.type];
  document.getElementById("time-type-badge").textContent = t.emoji + " " + t.label;
  document.getElementById("time-type-badge").className = "type-badge " + t.colorClass;
  document.getElementById("time-date-label").textContent = formatDateJp(ds);
  showLoading(true); const booked = await fetchBookedSlots(ds, state.type); showLoading(false);
  renderTimeSlots(booked); showScreen("time");
}
async function fetchBookedSlots(date, type) { if (!CONFIG.gasUrl || CONFIG.gasUrl === "YOUR_GAS_URL_HERE") return []; try { const r = await fetch(CONFIG.gasUrl + "?date=" + date + "&type=" + type); const d = await r.json(); return d.bookedSlots || []; } catch { return []; } }
function renderTimeSlots(booked) {
  const t = CONFIG.types[state.type], slots = generateSlots(), con = document.getElementById("time-slots");
  if (!slots.length) { con.innerHTML = '<div class="no-slots">受付時間外です</div>'; return; }
  con.innerHTML = slots.map(s => { const b = isSlotBooked(s, booked, t.duration, t.capacity); return b ? '<button class="slot-btn booked" disabled>× ' + s + '</button>' : '<button class="slot-btn' + (state.time === s ? " selected" : "") + '" onclick="selectTime(\'' + s + '\')">' + s + '</button>'; }).join("");
}
function generateSlots() { const s = []; for (let h = CONFIG.openHour; h < CONFIG.closeHour; h++) for (let m = 0; m < 60; m += CONFIG.slotMinutes) s.push(String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0")); return s; }
function isSlotBooked(slot, booked, dur, cap) { let c = 0; booked.forEach(b => { const bs = timeToMin(b.time), be = bs + (b.duration||1)*CONFIG.slotMinutes, ss = timeToMin(slot), se = ss + dur*CONFIG.slotMinutes; if (ss < be && se > bs) c++; }); return c >= cap; }
function timeToMin(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function selectTime(time) { state.time = time; renderTimeSlots([]); const t = CONFIG.types[state.type]; document.getElementById("form-summary").textContent = t.emoji + " " + t.label + "　" + formatDateJp(state.date) + "　" + state.time + "〜" + addMinutes(state.time, t.duration*CONFIG.slotMinutes); showScreen("form"); }
function showConfirm() {
  const name = document.getElementById("f-name").value.trim(), phone = document.getElementById("f-phone").value.trim();
  const t = CONFIG.types[state.type], people = t.showPeople ? document.getElementById("f-people").value : "1";
  if (!name) { showToast("お名前をご入力ください"); return; }
  if (!phone) { showToast("お電話番号をご入力ください"); return; }
  if (t.showPeople && !people) { showToast("人数をお選びください"); return; }
  state.name = name; state.phone = phone; state.people = people || "1"; state.note = document.getElementById("f-note").value.trim();
  const end = addMinutes(state.time, t.duration*CONFIG.slotMinutes);
  document.getElementById("confirm-details").innerHTML = row("種別", t.emoji+" "+t.label) + row("日付", formatDateJp(state.date)) + row("時間", state.time+" 〜 "+end) + (t.showPeople ? row("人数", state.people+"名") : "") + row("お名前", state.name) + row("お電話", state.phone) + (state.note ? row("ご要望", state.note) : "");
  showScreen("confirm");
}
function row(l,v) { return '<div class="confirm-row"><span class="confirm-label">'+l+'</span><span class="confirm-value">'+v+'</span></div>'; }
function addMinutes(time, min) { const [h,m] = time.split(":").map(Number), t = h*60+m+min; return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0"); }
async function submitBooking() {
  const btn = document.getElementById("btn-submit"); btn.disabled = true; btn.textContent = "送信中..."; showLoading(true);
  const t = CONFIG.types[state.type];
  const payload = { type: state.type, typeLabel: t.label, date: state.date, time: state.time, duration: t.duration, name: state.name, phone: state.phone, people: state.people, note: state.note, bookedAt: new Date().toISOString() };
  let ok = false;
  try {
    await fetch(CONFIG.gasUrl, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
    ok = true;
  } catch { showToast("送信エラーが発生しました。お電話にてお問い合わせください。"); }
  showLoading(false); btn.disabled = false; btn.textContent = "予約を確定する";
  if (ok) { const end = addMinutes(state.time, t.duration*CONFIG.slotMinutes); document.getElementById("done-details").innerHTML = row("種別",t.emoji+" "+t.label) + row("日付",formatDateJp(state.date)) + row("時間",state.time+" 〜 "+end) + (t.showPeople && state.people > 1 ? row("人数",state.people+"名") : "") + row("お名前",state.name) + row("お電話",state.phone); showScreen("done"); }
}
function resetApp() { state = {type:null,date:null,time:null,name:"",phone:"",people:"",note:""}; ["f-name","f-phone","f-note"].forEach(id => document.getElementById(id).value=""); document.getElementById("f-people").value=""; screenHistory=[]; showScreen("type"); }
function showLoading(s) { document.getElementById("loading").style.display = s ? "flex" : "none"; }
let tt; function showToast(m) { const t=document.getElementById("toast"); t.textContent=m; t.style.display="block"; if(tt)clearTimeout(tt); tt=setTimeout(()=>t.style.display="none",3000); }
showScreen("type", false);