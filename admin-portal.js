const adminRooms = [
  { id: "iet20", name: "IET20", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approx.", purposes: ["lecture", "examination", "event"], enabled: true },
  { id: "iet18", name: "IET18", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approx.", purposes: ["lecture", "examination", "event"], enabled: true },
  { id: "iet19", name: "IET19", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approx.", purposes: ["lecture", "examination", "event"], enabled: true },
  { id: "iet17", name: "IET17", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approx.", purposes: ["lecture", "examination", "event"], enabled: true },
  { id: "iet32", name: "IET32", building: "IET", floor: "Second", type: "Seminar Hall", capacity: 200, capacitySource: "Supplied approx.", purposes: ["lecture", "examination", "event"], enabled: true },
  ...["IET24", "IET25", "IET29", "IET30", "IET28"].map((name) => ({ id: name.toLowerCase(), name, building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"], enabled: true })),
  ...["CSE", "ME", "ECE", "IT"].map((name) => ({ id: `${name.toLowerCase()}-lab`, name: `${name} Lab`, building: "IET", floor: "First", type: "Laboratory", capacity: 40, capacitySource: "Demo configured", purposes: ["practical"], enabled: true })),
  { id: "library", name: "Library", building: "IET", floor: "Ground", type: "Library", capacity: 165, capacitySource: "Supplied approx.", purposes: ["examination"], enabled: true },
  { id: "faculty-cabins", name: "Faculty cabins", building: "IET", floor: "Ground", type: "Staff area", capacity: null, capacitySource: "Not applicable", purposes: [], enabled: false },
  { id: "director-office", name: "Director's Office", building: "IET", floor: "Ground", type: "Office", capacity: null, capacitySource: "Not applicable", purposes: [], enabled: false },
  { id: "admin-office", name: "Administrative Office", building: "IET", floor: "Ground", type: "Office", capacity: null, capacitySource: "Not applicable", purposes: [], enabled: false },
  { id: "placement-cell", name: "Placement Cell", building: "IET", floor: "Ground", type: "Office", capacity: null, capacitySource: "Not applicable", purposes: [], enabled: false },
  ...Array.from({ length: 12 }, (_, index) => ({ id: `lh${String(index + 1).padStart(2, "0")}`, name: `LH${String(index + 1).padStart(2, "0")}`, building: "Deeksha Bhawan", floor: index < 7 ? "Ground" : "First", type: "Classroom", capacity: 60, capacitySource: "Demo configured · verify", purposes: ["lecture", "examination", "event"], enabled: true })),
  { id: "iet23", name: "IET23†", building: "IET", floor: "Second", type: "Unverified label", capacity: null, capacitySource: "Verify room register", purposes: [], enabled: false },
  { id: "lh13", name: "LH13†", building: "Deeksha Bhawan", floor: "First", type: "Unverified label", capacity: null, capacitySource: "Verify room register", purposes: [], enabled: false },
  { id: "lh14", name: "LH14†", building: "Deeksha Bhawan", floor: "First", type: "Unverified label", capacity: null, capacitySource: "Verify room register", purposes: [], enabled: false },
];

let adminBookings = [
  { id: "T-1001", roomId: "iet20", date: "2026-11-05", start: "10:30", end: "11:30", purpose: "examination", title: "Minor examination setup", owner: "Demo Faculty A", status: "confirmed", testData: true },
  { id: "T-1002", roomId: "iet18", date: "2026-11-05", start: "11:00", end: "12:00", purpose: "event", title: "Department session", owner: "Demo Faculty B", status: "confirmed", testData: true },
  { id: "T-1003", roomId: "cse-lab", date: "2026-11-05", start: "09:00", end: "12:00", purpose: "practical", title: "CSE practical", owner: "Demo Faculty A", status: "confirmed", testData: true },
  { id: "T-1004", roomId: "lh03", date: "2026-11-06", start: "09:00", end: "11:00", purpose: "examination", title: "NSS minor examination", owner: "Demo Faculty C", status: "confirmed", testData: true },
  { id: "T-1005", roomId: "iet24", date: "2026-11-06", start: "13:00", end: "14:00", purpose: "lecture", title: "CSE revision session", owner: "Demo Faculty A", status: "cancelled", testData: true },
  { id: "T-1006", roomId: "lh08", date: "2026-11-07", start: "10:00", end: "12:00", purpose: "event", title: "Student activity preview", owner: "Demo Faculty B", status: "confirmed", testData: true },
  { id: "T-1007", roomId: "iet25", date: "2026-11-09", start: "11:00", end: "13:00", purpose: "examination", title: "CSE assessment request", owner: "Demo Faculty C", status: "pending", testData: true },
  { id: "T-1008", roomId: "iet19", date: "2026-11-05", start: "09:30", end: "10:30", purpose: "lecture", title: "Overlapping timetable request", owner: "Demo Faculty B", status: "pending", testData: true },
];

const demoStudents = [
  { student: "Demo Student 001", branch: "CSE", year: "2", batch: "2024", section: "A" },
  { student: "Demo Student 002", branch: "CSE", year: "2", batch: "2024", section: "A" },
  { student: "Demo Student 003", branch: "AI ML", year: "1", batch: "2025", section: "B" },
  { student: "Demo Student 004", branch: "AI DS", year: "3", batch: "2023", section: "—" },
  { student: "Demo Student 005", branch: "ECE", year: "4", batch: "2022", section: "—" },
  { student: "Demo Student 006", branch: "ME", year: "2", batch: "2024", section: "—" },
  { student: "Demo Student 007", branch: "IT", year: "1", batch: "2025", section: "—" },
];

const demoFaculty = [
  { name: "Demo Faculty A", department: "CSE", access: true, booking: true, schedule: true },
  { name: "Demo Faculty B", department: "ECE", access: true, booking: true, schedule: true },
  { name: "Demo Faculty C", department: "AI ML", access: true, booking: false, schedule: true },
  { name: "Demo Faculty D", department: "ME", access: false, booking: false, schedule: false },
];

const scheduleEvents = [
  { id: "S-01", date: "2026-11-05", start: "09:00", end: "10:00", group: "CSE-2-A", faculty: "Demo Faculty A", roomId: "iet20", title: "Algorithms lecture", source: "Student group overlap" },
  { id: "S-02", date: "2026-11-05", start: "09:30", end: "10:30", group: "CSE-2-A", faculty: "Demo Faculty B", roomId: "iet19", title: "Data Structures lecture", source: "Student group overlap" },
  { id: "S-03", date: "2026-11-05", start: "11:00", end: "12:00", group: "CSE-2-B", faculty: "Demo Faculty C", roomId: "iet18", title: "Discrete Mathematics", source: "Faculty schedule overlap" },
  { id: "S-04", date: "2026-11-05", start: "11:30", end: "12:30", group: "ECE-1-A", faculty: "Demo Faculty C", roomId: "iet17", title: "ECE extra class", source: "Faculty schedule overlap" },
  { id: "S-05", date: "2026-11-05", start: "13:00", end: "14:00", group: "IT-2-A", faculty: "Demo Faculty D", roomId: "iet19", title: "IT revision", source: "Room double booking" },
  { id: "S-06", date: "2026-11-05", start: "13:30", end: "14:30", group: "ME-2-A", faculty: "Demo Faculty B", roomId: "iet19", title: "ME tutorial", source: "Room double booking" },
];

let announcements = [
  { id: "N-01", title: "NSS Minor Examination venue updated", body: "Demo notice: the examination is listed at LH03, Deeksha Bhawan. Confirm the venue with the examination office before publishing real information.", audience: "CSE-2-A", isPublic: false, status: "Draft", created: "5 Nov 2026" },
  { id: "N-02", title: "Student portal preview is available", body: "This prototype uses fictional sample data and is not an official university service.", audience: "public", isPublic: true, status: "Published · demo", created: "4 Nov 2026" },
];

let issueReports = [
  { id: "R-201", title: "Room label mismatch in demo map", body: "The source drawing shows IET23, but the written room list names IET28 instead.", category: "Campus data", location: "IET · Second floor", reporter: "Demo Student 003", created: "5 Nov 2026 · 09:20", status: "open", resolution: "" },
  { id: "R-202", title: "Examination venue update needs confirmation", body: "Please confirm the sample NSS notice points students to the current venue.", category: "Exam schedule", location: "NSS Minor Examination", reporter: "Demo Student 007", created: "4 Nov 2026 · 14:10", status: "investigating", resolution: "Checking the demo notice against the sample schedule." },
  { id: "R-203", title: "Sample timetable appears out of date", body: "A demo timetable card needs a refreshed sample date.", category: "Timetable", location: "CSE Year 2 Section A", reporter: "Demo Student 001", created: "3 Nov 2026 · 12:45", status: "resolved", resolution: "Updated the fictional sample date." },
];

let auditEntries = [
  { time: "5 Nov 2026 · 09:20", actor: "Demo Student 003", action: "Submitted issue R-201", detail: "Campus data · demo" },
  { time: "5 Nov 2026 · 09:00", actor: "Demo Faculty A", action: "Created booking T-1001", detail: "IET20 · examination · test data" },
  { time: "4 Nov 2026 · 16:40", actor: "Demo Administrator", action: "Reviewed notice N-02", detail: "Public demo notice" },
  { time: "4 Nov 2026 · 14:10", actor: "Demo Student 007", action: "Submitted issue R-202", detail: "Exam schedule · demo" },
];

let bookingRules = { examApproval: true, eventApproval: false, advanceDays: 30, cancelHours: 2 };
let currentBuilding = "IET";
let currentFloor = "all";
let issueFilter = "all";
let studentImportRows = null;
let activeBookingChangeId = null;
let nextRoomNumber = 1;
const demoMode = new URLSearchParams(window.location.search).get("demo") === "1" || (typeof window !== "undefined" && Boolean(window.happyDOM));
let liveMode = false;
let liveStudents = [];
let liveBuildings = [];

function fromApiAdminRoom(record) {
  return {
    id: record.id,
    name: record.room_number,
    building: record.building_code === "DEEKSHA" ? "Deeksha Bhawan" : record.building_code,
    floor: record.floor_label.replace(/ floor$/i, ""),
    floor_id: record.floor_id,
    type: ({ classroom: "Classroom", laboratory: "Laboratory", seminar_hall: "Seminar Hall", library: "Library", office: "Office" })[record.room_type] || record.room_type,
    capacity: record.capacity,
    capacitySource: record.capacity_source,
    purposes: record.permitted_uses,
    enabled: record.is_active,
    verified: record.is_verified,
  };
}

function fromApiAdminBooking(record) {
  const start = new Date(record.start_time);
  const end = new Date(record.end_time);
  const localDate = (value) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  const localTime = (value) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(value);
  return {
    ...record,
    roomId: record.room_id,
    date: localDate(start),
    start: localTime(start),
    end: localTime(end),
    owner: record.faculty_email,
    status: record.status === "approved" ? "confirmed" : record.status,
    testData: record.test_data,
  };
}

function fromApiSchedule(record, date) {
  return {
    id: record.id,
    date,
    start: record.start_time.slice(0, 5),
    end: record.end_time.slice(0, 5),
    group: `${record.branch_code}-${record.academic_year}-${record.section || ""}`,
    faculty: record.faculty_name,
    roomId: record.room_id,
    title: record.course_name,
    source: record.test_data ? "DEMO TEST DATA" : "Published schedule",
    testData: record.test_data,
  };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getRoom(id) {
  return adminRooms.find((room) => room.id === id);
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function durationHours(start, end) {
  return (CampusBookingRules.toMinutes(end) - CampusBookingRules.toMinutes(start)) / 60;
}

function audit(action, detail) {
  const time = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
  auditEntries.unshift({ time, actor: "Demo Administrator", action, detail: `${detail} · local demo` });
  renderAudit();
  renderOverviewActivity();
}

function table(headers, rows) {
  const tableNode = el("table", "admin-table");
  const head = el("thead");
  const headerRow = el("tr");
  headers.forEach((header) => {
    const cell = el("th", "", header);
    cell.scope = "col";
    headerRow.append(cell);
  });
  head.append(headerRow);
  const body = el("tbody");
  rows.forEach((row) => body.append(row));
  tableNode.append(head, body);
  return tableNode;
}

function statusChip(status) {
  const normalized = status.toLowerCase().split(" ")[0];
  return el("span", `status-chip ${normalized}`, status);
}

function setView(viewName) {
  document.querySelectorAll(".admin-view").forEach((view) => {
    view.hidden = view.id !== `admin-view-${viewName}`;
  });
  document.querySelectorAll(".admin-nav-item").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const view = document.querySelector(`#admin-view-${viewName}`);
  if (view) {
    document.title = `${view.dataset.title} · Admin Demo | DDUGU Smart Campus`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelector("#admin-sidebar").classList.remove("is-open");
  document.querySelector(".admin-menu-toggle").setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".admin-nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.openView)));
const adminMenuToggle = document.querySelector(".admin-menu-toggle");
adminMenuToggle.addEventListener("click", () => {
  const open = document.querySelector("#admin-sidebar").classList.toggle("is-open");
  adminMenuToggle.setAttribute("aria-expanded", String(open));
  adminMenuToggle.setAttribute("aria-label", open ? "Close admin navigation" : "Open admin navigation");
});

function renderStatistics() {
  const stats = [
    ["BUILDINGS", "02", "IET + Deeksha Bhawan"],
    ["CONFIGURED ROOMS", adminRooms.filter((room) => room.enabled).length, "Demo room records"],
    ["ACTIVE BOOKINGS", adminBookings.filter((booking) => booking.status === "confirmed").length, "Across both buildings"],
    ["OPEN CONFLICTS", getScheduleConflicts().length, "Requires review"],
  ];
  const container = document.querySelector("#admin-statistics");
  container.replaceChildren();
  stats.forEach(([label, value, note], index) => {
    const card = el("div", "admin-stat");
    card.append(el("span", "", label));
    card.append(el("strong", index === 3 && value ? "stat-alert" : "", String(value)));
    card.append(el("small", "", note));
    container.append(card);
  });
}

function getScheduleConflicts() {
  const conflicts = [];
  for (let left = 0; left < scheduleEvents.length; left += 1) {
    for (let right = left + 1; right < scheduleEvents.length; right += 1) {
      const first = scheduleEvents[left];
      const second = scheduleEvents[right];
      if (first.date !== second.date || !CampusBookingRules.overlaps(first.start, first.end, second.start, second.end)) continue;
      const dimensions = [];
      if (first.group === second.group) dimensions.push("Student group clash");
      if (first.faculty === second.faculty) dimensions.push("Faculty clash");
      if (first.roomId === second.roomId) dimensions.push("Room clash");
      dimensions.forEach((type) => conflicts.push({ first, second, type }));
    }
  }
  return conflicts;
}

function renderOverviewConflicts() {
  const list = document.querySelector("#overview-conflicts");
  list.replaceChildren();
  const conflicts = getScheduleConflicts();
  if (!conflicts.length) list.append(el("p", "admin-empty", "No overlapping demo schedule records."));
  conflicts.slice(0, 4).forEach((conflict) => {
    const row = el("div", "overview-conflict-item");
    row.append(el("i", "conflict-dot"));
    const details = el("div");
    details.append(el("strong", "", conflict.type));
    details.append(el("small", "", `${conflict.first.title} ↔ ${conflict.second.title}`));
    row.append(details);
    const action = el("button", "", "Review");
    action.type = "button";
    action.addEventListener("click", () => setView("schedules"));
    row.append(action);
    list.append(row);
  });
}

function renderOverviewActivity() {
  const list = document.querySelector("#overview-activity");
  if (!list) return;
  list.replaceChildren();
  auditEntries.slice(0, 4).forEach((entry) => {
    const row = el("div", "overview-activity-item");
    row.append(el("i", "conflict-dot"));
    const details = el("div");
    details.append(el("strong", "", entry.action));
    details.append(el("small", "", `${entry.actor} · ${entry.time}`));
    row.append(details);
    list.append(row);
  });
}

function bookingRow(booking, includeActions = false) {
  const room = getRoom(booking.roomId);
  const row = el("tr");
  row.append(el("td", "", booking.title));
  row.append(el("td", "", `${room?.name || "Unknown room"}<small>${room?.building || ""} · ${room?.floor || ""} floor</small>`));
  row.append(el("td", "", `${booking.date}<small>${formatTime(booking.start)}–${formatTime(booking.end)}</small>`));
  row.append(el("td", "", booking.owner));
  row.append(el("td", "", purposeLabel(booking.purpose)));
  const stateCell = el("td");
  const stateLabel = { pending: "Pending · test", confirmed: "Confirmed · test", cancelled: "Cancelled · test", rejected: "Rejected · test" }[booking.status] || `${booking.status} · test`;
  stateCell.append(statusChip(stateLabel));
  row.append(stateCell);
  if (includeActions) {
    const actions = el("td");
    const group = el("div", "admin-row-actions");
    if (booking.status === "confirmed") {
      const reschedule = el("button", "", "Reschedule");
      reschedule.type = "button";
      reschedule.addEventListener("click", () => openBookingChange(booking));
      const cancel = el("button", "danger", "Cancel");
      cancel.type = "button";
      cancel.addEventListener("click", () => cancelBooking(booking));
      group.append(reschedule, cancel);
    } else if (booking.status === "pending") {
      const approve = el("button", "", "Approve");
      approve.type = "button";
      approve.addEventListener("click", () => reviewBooking(booking, true));
      const reject = el("button", "danger", "Reject");
      reject.type = "button";
      reject.addEventListener("click", () => reviewBooking(booking, false));
      group.append(approve, reject);
    }
    actions.append(group);
    row.append(actions);
  }
  return row;
}

function purposeLabel(purpose) {
  return { lecture: "Extra lecture", examination: "Examination", practical: "Practical", event: "Event" }[purpose] || purpose;
}

function renderOverviewBookings() {
  const container = document.querySelector("#overview-bookings");
  const recent = [...adminBookings].sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`)).slice(0, 4);
  container.replaceChildren(table(["BOOKING", "ROOM", "DATE / TIME", "OWNER", "PURPOSE", "STATUS"], recent.map((booking) => bookingRow(booking))));
}

function renderCampusBuildingTabs() {
  const container = document.querySelector("#campus-building-tabs");
  container.replaceChildren();
  ["IET", "Deeksha Bhawan"].forEach((building) => {
    const button = el("button", "", building);
    button.type = "button";
    button.setAttribute("aria-pressed", String(currentBuilding === building));
    button.addEventListener("click", () => {
      currentBuilding = building;
      currentFloor = "all";
      renderCampus();
    });
    container.append(button);
  });
}

function renderCampus() {
  renderCampusBuildingTabs();
  document.querySelector("#blueprint-building-title").textContent = currentBuilding;
  const buildingRooms = adminRooms.filter((room) => room.building === currentBuilding);
  const floors = [...new Set(buildingRooms.map((room) => room.floor))];
  const floorTabs = document.querySelector("#admin-floor-tabs");
  floorTabs.replaceChildren();
  [["all", "All floors"], ...floors.map((floor) => [floor, `${floor} floor`])].forEach(([value, label]) => {
    const button = el("button", "", label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(currentFloor === value));
    button.addEventListener("click", () => {
      currentFloor = value;
      renderCampus();
    });
    floorTabs.append(button);
  });
  const configured = buildingRooms.filter((room) => room.enabled).length;
  const summary = document.querySelector("#campus-summary");
  summary.replaceChildren();
  [["ROOM RECORDS", buildingRooms.length], ["ENABLED", configured], ["BUILDING", currentBuilding]].forEach(([label, value]) => {
    const item = el("div");
    item.append(el("span", "", label));
    item.append(el("strong", "", String(value)));
    summary.append(item);
  });
  const filtered = buildingRooms.filter((room) => currentFloor === "all" || room.floor === currentFloor);
  const rows = filtered.map((room) => {
    const row = el("tr");
    row.append(el("td", "", room.name));
    row.append(el("td", "", `${room.building}<small>${room.floor} floor</small>`));
    row.append(el("td", "", room.type));
    row.append(el("td", "", room.capacity ? `${room.capacity}<small>${room.capacitySource}</small>` : `Not configured<small>${room.capacitySource}</small>`));
    row.append(el("td", "", room.purposes.length ? room.purposes.map(purposeLabel).join(", ") : "Not configured"));
    const enabled = el("td");
    enabled.append(statusChip(room.enabled ? "Enabled" : "Restricted"));
    row.append(enabled);
    const actionCell = el("td");
    const edit = el("button", "", "Edit");
    edit.type = "button";
    edit.className = "admin-inline-edit";
    edit.addEventListener("click", () => openRoomEditor(room));
    actionCell.append(edit);

    const del = el("button", "", "Delete");
    del.type = "button";
    del.className = "admin-inline-delete";
    del.style.marginLeft = "6px";
    del.addEventListener("click", async () => {
      if (typeof window !== "undefined" && window.confirm && !window.confirm(`Delete or deactivate room ${room.name}?`)) return;
      if (liveMode) {
        try {
          const res = await CampusApi.delete(`/api/v1/admin/rooms/${room.id}`);
          if (typeof window !== "undefined" && window.alert) window.alert(res.detail || "Room updated.");
          await loadAdminData();
          renderCampus();
        } catch (err) {
          if (typeof window !== "undefined" && window.alert) window.alert(err.message || "Failed to delete room.");
        }
      } else {
        const idx = adminRooms.findIndex((r) => r.id === room.id);
        if (idx >= 0) adminRooms.splice(idx, 1);
        renderCampus();
      }
    });
    actionCell.append(del);
    row.append(actionCell);
    return row;
  });
  document.querySelector("#campus-room-table").replaceChildren(table(["ROOM", "BUILDING", "TYPE", "CAPACITY", "PERMITTED USE", "STATE", ""], rows));
}

const roomDialog = document.querySelector("#room-dialog");
const roomForm = document.querySelector("#room-form");
function openRoomEditor(room = null) {
  roomForm.reset();
  roomForm.elements.id.value = room?.id || "";
  roomForm.elements.name.value = room?.name.replace("†", "") || "";
  roomForm.elements.building.value = room?.building || currentBuilding;
  roomForm.elements.floor.value = room?.floor || "First";
  roomForm.elements.type.value = room?.type === "Unverified label" ? "Classroom" : room?.type || "Classroom";
  roomForm.elements.capacity.value = room?.capacity || "";
  roomForm.elements.enabled.checked = room?.enabled ?? true;
  roomForm.elements.verified.checked = room?.verified ?? false;
  [...roomForm.elements.purposes.options].forEach((option) => { option.selected = room?.purposes.includes(option.value) || false; });
  document.querySelector("#room-dialog-title").textContent = room ? "Edit room record" : "Add room";
  document.querySelector("#room-form-status").textContent = liveMode
    ? "New rooms stay unverified and unavailable until an administrator checks the official room register."
    : "Unknown capacities and policies are demo configuration only.";
  roomDialog.showModal();
}

document.querySelector("#add-room-button").addEventListener("click", () => openRoomEditor());
roomForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!roomForm.reportValidity()) return;
  const id = roomForm.elements.id.value || `demo-room-${nextRoomNumber++}`;
  const selectedPurposes = [...roomForm.elements.purposes.selectedOptions].map((option) => option.value);
  const record = {
    id,
    name: roomForm.elements.name.value.trim(),
    building: roomForm.elements.building.value,
    floor: roomForm.elements.floor.value,
    type: roomForm.elements.type.value,
    capacity: Number(roomForm.elements.capacity.value) || null,
    capacitySource: Number(roomForm.elements.capacity.value) ? "Demo configured" : "Not configured",
    purposes: selectedPurposes,
    enabled: roomForm.elements.enabled.checked,
    verified: roomForm.elements.verified.checked,
  };
  const index = adminRooms.findIndex((room) => room.id === id);
  const submitBtn = roomForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  if (liveMode) {
    const status = document.querySelector("#room-form-status");
    try {
      const body = {
        room_number: record.name,
        name: record.name,
        room_type: ({ Classroom: "classroom", Laboratory: "laboratory", "Seminar Hall": "seminar_hall", Library: "library", Office: "office" })[record.type] || "classroom",
        capacity: record.capacity,
        permitted_uses: record.purposes,
        is_active: record.enabled,
        is_verified: record.verified,
      };
      if (index >= 0) {
        await CampusApi.patch(`/api/v1/admin/rooms/${record.id}`, body);
      } else {
        const buildingCode = record.building === "Deeksha Bhawan" ? "DEEKSHA" : "IET";
        const building = liveBuildings.find((item) => item.code === buildingCode);
        const floor = building?.floors.find((item) => item.label.toLowerCase().startsWith(record.floor.toLowerCase()));
        if (!floor) throw new Error("Select a configured building floor before creating a room.");
        await CampusApi.post("/api/v1/admin/rooms", {
          floor_id: floor.id,
          ...body,
          capacity_source: record.capacitySource,
        });
      }
      currentBuilding = record.building;
      currentFloor = record.floor;
      await loadAdminData();
      renderCampus();
      renderAllBookings();
      renderOverview();
      roomDialog.close();
    } catch (error) {
      status.textContent = error.message || "The room record could not be saved.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
    return;
  }
  if (submitBtn) submitBtn.disabled = false;
  if (index >= 0) adminRooms[index] = record;
  else adminRooms.push(record);
  currentBuilding = record.building;
  currentFloor = record.floor;
  audit(`${index >= 0 ? "Updated" : "Added"} room ${record.name}`, `${record.building} · ${record.floor} · demo config`);
  renderCampus();
  renderAllBookings();
  renderOverview();
  roomDialog.close();
});
document.querySelector(".admin-dialog-close").addEventListener("click", () => roomDialog.close());
roomDialog.addEventListener("click", (event) => { if (event.target === roomDialog) roomDialog.close(); });

document.querySelector("#blueprint-file").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  const status = document.querySelector("#blueprint-file-status");
  if (!file) return;
  const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
    status.textContent = "Choose a PNG, JPEG, WebP, or PDF under 10 MB. File was not uploaded.";
    event.target.value = "";
    return;
  }
  status.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB · preview only, not uploaded.`;
});

function studentRows() {
  return studentImportRows || demoStudents;
}

function renderStudents() {
  const rows = studentRows();
  const bodyRows = rows.slice(0, 30).map((record) => {
    const row = el("tr");
    row.append(el("td", "", record.student || record.name || "Demo row"));
    row.append(el("td", "", record.branch || "—"));
    row.append(el("td", "", record.year || "—"));
    row.append(el("td", "", record.batch || "—"));
    row.append(el("td", "", record.section || "—"));
    row.append(el("td", "", "DEMO / PREVIEW"));
    return row;
  });
  document.querySelector("#student-table").replaceChildren(table(["STUDENT", "BRANCH", "YEAR", "BATCH", "SECTION", "SOURCE"], bodyRows));
  const branchCounts = new Map();
  rows.forEach((row) => branchCounts.set(row.branch || "Unmapped", (branchCounts.get(row.branch || "Unmapped") || 0) + 1));
  const max = Math.max(...branchCounts.values(), 1);
  const mix = document.querySelector("#branch-mix");
  mix.replaceChildren();
  branchCounts.forEach((count, branch) => {
    const row = el("div", "branch-mix-row");
    row.append(el("span", "", branch));
    const bar = el("div", "branch-mix-bar");
    const fill = el("i");
    fill.style.width = `${Math.max(4, count / max * 100)}%`;
    bar.append(fill);
    row.append(bar, el("strong", "", String(count)));
    mix.append(row);
  });
}

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && inQuotes && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') inQuotes = !inQuotes;
    else if (character === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) records.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) records.push(row);
  }
  if (inQuotes) throw new Error("CSV has an unclosed quoted field.");
  if (records.length < 2) throw new Error("CSV needs a header row and at least one data row.");
  const headers = records[0];
  return records.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function renderColumnMapping(headers) {
  const container = document.querySelector("#student-column-mapping");
  container.replaceChildren();
  const mappings = [
    ["student", "Student name or ID", ["student", "name", "roll", "id"]],
    ["branch", "Branch", ["branch"]],
    ["year", "Academic year", ["year", "academic"]],
    ["batch", "Batch", ["batch"]],
    ["section", "Section", ["section"]],
  ];
  mappings.forEach(([key, label, aliases]) => {
    const field = el("label", "", label);
    const select = el("select");
    select.dataset.mapping = key;
    const emptyOption = el("option", "", "Choose a column");
    emptyOption.value = "";
    select.append(emptyOption);
    headers.forEach((header) => {
      const option = el("option", "", header);
      option.value = header;
      select.append(option);
    });
    const match = headers.find((header) => aliases.some((alias) => header.toLowerCase().includes(alias)));
    if (match) select.value = match;
    select.addEventListener("change", applyStudentMappings);
    field.append(select);
    container.append(field);
  });
}

let rawStudentRows = null;
function applyStudentMappings() {
  if (!rawStudentRows) return;
  const mapping = Object.fromEntries([...document.querySelectorAll("[data-mapping]")].map((select) => [select.dataset.mapping, select.value]));
  studentImportRows = rawStudentRows.map((row, index) => ({
    student: row[mapping.student] || row.name || row.student || `Demo imported row ${index + 1}`,
    branch: row[mapping.branch] || "Unmapped",
    year: row[mapping.year] || "Unmapped",
    batch: row[mapping.batch] || "Unmapped",
    section: row[mapping.section] || "Unmapped",
  }));
  document.querySelector("#student-import-status").textContent = `${studentImportRows.length} rows mapped for local preview only. Nothing was imported.`;
  const importBtn = document.querySelector("#import-students-database-btn");
  if (importBtn) {
    importBtn.disabled = !studentImportRows.length;
  }
  renderStudents();
}

document.querySelector("#student-csv-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    document.querySelector("#student-import-status").textContent = "CSV must be under 2 MB. No file was uploaded.";
    event.target.value = "";
    return;
  }
  try {
    rawStudentRows = parseCsv(await file.text());
    const headers = Object.keys(rawStudentRows[0]);
    renderColumnMapping(headers);
    applyStudentMappings();
  } catch (error) {
    rawStudentRows = null;
    studentImportRows = null;
    document.querySelector("#student-column-mapping").replaceChildren();
    document.querySelector("#student-import-status").textContent = `${error.message} No data was imported.`;
    const importBtn = document.querySelector("#import-students-database-btn");
    if (importBtn) importBtn.disabled = true;
    renderStudents();
  }
});

const importDbBtn = document.querySelector("#import-students-database-btn");
if (importDbBtn) {
  importDbBtn.addEventListener("click", async () => {
    if (!studentImportRows || !studentImportRows.length || !rawStudentRows) return;
    const statusEl = document.querySelector("#student-import-status");
    importDbBtn.disabled = true;
    statusEl.textContent = `Importing ${studentImportRows.length} student records into database…`;

    const mapping = Object.fromEntries([...document.querySelectorAll("[data-mapping]")].map((select) => [select.dataset.mapping, select.value]));
    const studentsPayload = rawStudentRows.map((row, idx) => {
      const roll = (row.roll_number || row.roll || row.id || `STU${idx + 1}`).trim();
      const name = (row[mapping.student] || row.name || row.student || `Student ${idx + 1}`).trim();
      const email = (row.email || `${roll.toLowerCase()}@ddugu.ac.in`).trim();
      const branch = (row[mapping.branch] || "CSE").trim();
      const yr = Number(row[mapping.year]) || 1;
      const bch = Number(row[mapping.batch]) || 2024;
      const sec = (row[mapping.section] || "").trim() || null;
      return {
        roll_number: roll,
        display_name: name,
        email: email,
        branch_code: branch,
        academic_year: Math.min(Math.max(yr, 1), 4),
        batch_year: bch,
        section: sec,
      };
    });

    if (liveMode) {
      try {
        const res = await CampusApi.post("/api/v1/admin/students/import", { students: studentsPayload });
        statusEl.textContent = `Successfully imported ${res.imported} students into the database (${res.skipped} skipped).`;
        await loadAdminData();
        renderStudents();
      } catch (err) {
        statusEl.textContent = err.message || "Failed to import students to the database.";
        importDbBtn.disabled = false;
      }
    } else {
      statusEl.textContent = `Demo: simulated import of ${studentsPayload.length} rows in local browser.`;
      importDbBtn.disabled = false;
    }
  });
}

function renderFaculty() {
  const rows = demoFaculty.map((faculty) => {
    const row = el("tr");
    row.append(el("td", "", faculty.name));
    row.append(el("td", "", faculty.department));
    ["access", "booking", "schedule"].forEach((permission) => {
      const cell = el("td");
      const checkbox = el("input", "permission-switch");
      checkbox.type = "checkbox";
      checkbox.checked = faculty[permission];
      checkbox.setAttribute("aria-label", `${permission} access for ${faculty.name} (demo)`);
      checkbox.addEventListener("change", async () => {
        const previous = !checkbox.checked;
        faculty[permission] = checkbox.checked;
        if (liveMode) {
          const field = { access: "is_active", booking: "can_book", schedule: "can_view_schedule" }[permission];
          try {
            const result = await CampusApi.patch(`/api/v1/admin/faculty/${faculty.id}/permissions`, { [field]: checkbox.checked });
            faculty.access = result.is_active;
            faculty.booking = result.can_book;
            faculty.schedule = result.can_view_schedule;
          } catch (error) {
            faculty[permission] = previous;
            checkbox.checked = previous;
            window.alert(error.message || "Permission could not be updated.");
            return;
          }
          return;
        }
        audit(`Changed ${permission} permission`, `${faculty.name} · ${checkbox.checked ? "enabled" : "disabled"}`);
      });
      cell.append(checkbox);
      row.append(cell);
    });
    row.append(el("td", "", "DEMO ACCOUNT"));
    return row;
  });
  const tableNode = table(["FACULTY", "DEPARTMENT", "PORTAL ACCESS", "BOOKING", "SCHEDULE", "SOURCE"], rows);
  document.querySelector("#faculty-table").replaceChildren(tableNode);
}

function renderAllBookings() {
  const status = document.querySelector("#booking-status-filter").value;
  const building = document.querySelector("#booking-building-filter").value;
  const purpose = document.querySelector("#booking-purpose-filter").value;
  const filtered = adminBookings.filter((booking) => {
    const room = getRoom(booking.roomId);
    return (status === "all" || booking.status === status)
      && (building === "all" || room?.building === building)
      && (purpose === "all" || booking.purpose === purpose);
  }).sort((left, right) => `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`));
  const rows = filtered.map((booking) => bookingRow(booking, true));
  if (!rows.length) {
    const row = el("tr");
    const cell = el("td", "admin-empty", "No bookings match the selected filters.");
    cell.colSpan = 7;
    row.append(cell);
    rows.push(row);
  }
  document.querySelector("#all-bookings-table").replaceChildren(table(["BOOKING", "ROOM", "DATE / TIME", "OWNER", "PURPOSE", "STATUS", "ACTIONS"], rows));
}

document.querySelectorAll("#booking-status-filter, #booking-building-filter, #booking-purpose-filter").forEach((select) => select.addEventListener("change", renderAllBookings));

async function reloadAdminViews() {
  await loadAdminData();
  renderOverview();
  renderCampus();
  renderFaculty();
  renderAllBookings();
  renderScheduleConflicts();
  renderAnnouncements();
  renderIssues();
  renderAnalytics();
  renderAudit();
}

async function cancelBooking(booking) {
  if (liveMode) {
    if (!window.confirm(`Cancel booking ${booking.id}?`)) return;
    try {
      await CampusApi.post(`/api/v1/bookings/${booking.id}/cancel`, {});
      await reloadAdminViews();
    } catch (error) {
      document.querySelector("#booking-action-status").textContent = error.message || "The booking could not be cancelled.";
    }
    return;
  }
  if (!window.confirm(`Cancel demo booking ${booking.id}?`)) return;
  booking.status = "cancelled";
  audit(`Cancelled booking ${booking.id}`, `${booking.title} · ${getRoom(booking.roomId)?.name || "room"}`);
  renderAllBookings();
  renderOverview();
  renderAnalytics();
}

async function reviewBooking(booking, approved) {
  const status = document.querySelector("#booking-action-status");
  if (liveMode) {
    if (!window.confirm(`${approved ? "Approve" : "Reject"} booking ${booking.id}?`)) return;
    try {
      await CampusApi.post(`/api/v1/admin/bookings/${booking.id}/review`, { decision: approved ? "approve" : "reject" });
      status.textContent = `Booking ${booking.id} ${approved ? "approved" : "rejected"}.`;
      await reloadAdminViews();
    } catch (error) {
      status.textContent = error.message || "The booking could not be reviewed.";
    }
    return;
  }
  if (approved) {
    const room = getRoom(booking.roomId);
    let blocker = null;
    if (!room || !room.enabled) blocker = "Approval blocked: this room is not enabled.";
    else if (!room.purposes.includes(booking.purpose)) blocker = `Approval blocked: ${purposeLabel(booking.purpose)} is not permitted in ${room.name}.`;
    else if (CampusBookingRules.findRoomConflicts(adminBookings, {
      roomId: booking.roomId,
      date: booking.date,
      start: booking.start,
      end: booking.end,
      ignoreBookingId: booking.id,
    }).length) blocker = `Approval blocked: ${room.name} has an overlapping booking.`;
    else if (scheduleEvents.some((entry) => entry.date === booking.date
      && (entry.faculty === booking.owner || entry.roomId === booking.roomId)
      && CampusBookingRules.overlaps(booking.start, booking.end, entry.start, entry.end))) {
      blocker = "Approval blocked: the request conflicts with a faculty schedule or room timetable.";
    }
    if (blocker) {
      status.textContent = blocker;
      audit(`Blocked approval for booking ${booking.id}`, blocker);
      return;
    }
  }
  if (!window.confirm(`${approved ? "Approve" : "Reject"} demo booking ${booking.id}?`)) return;
  booking.status = approved ? "confirmed" : "rejected";
  status.textContent = `Booking ${booking.id} ${approved ? "approved" : "rejected"} in the local demo.`;
  audit(`${approved ? "Approved" : "Rejected"} booking ${booking.id}`, `${booking.title} · ${getRoom(booking.roomId)?.name || "room"}`);
  renderAllBookings();
  renderOverview();
  renderAnalytics();
}

const bookingChangeDialog = document.querySelector("#booking-change-dialog");
function openBookingChange(booking) {
  activeBookingChangeId = booking.id;
  const form = document.querySelector("#booking-change-form");
  form.elements.id.value = booking.id;
  form.elements.date.value = booking.date;
  form.elements.start.value = booking.start;
  form.elements.end.value = booking.end;
  document.querySelector("#booking-change-record").textContent = `${booking.id} · ${booking.title} · ${getRoom(booking.roomId)?.name || "room"}`;
  document.querySelector("#booking-change-status").textContent = "Recheck room and schedule conflicts before saving.";
  bookingChangeDialog.showModal();
}
document.querySelector(".booking-change-close").addEventListener("click", () => bookingChangeDialog.close());
bookingChangeDialog.addEventListener("click", (event) => { if (event.target === bookingChangeDialog) bookingChangeDialog.close(); });
document.querySelector("#booking-change-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const booking = adminBookings.find((item) => item.id === activeBookingChangeId && item.status === "confirmed");
  if (!booking) return;
  const date = form.elements.date.value;
  const start = form.elements.start.value;
  const end = form.elements.end.value;
  const status = document.querySelector("#booking-change-status");
  if (CampusBookingRules.toMinutes(start) >= CampusBookingRules.toMinutes(end)) {
    status.textContent = "End time must be after start time.";
    return;
  }
  if (liveMode) {
    status.textContent = "Revalidating booking against the database…";
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      await CampusApi.patch(`/api/v1/admin/bookings/${booking.id}/reschedule`, {
        start_time: `${date}T${start}:00+05:30`,
        end_time: `${date}T${end}:00+05:30`,
      });
      bookingChangeDialog.close();
      await reloadAdminViews();
    } catch (error) {
      status.textContent = error.message || "The booking could not be rescheduled.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
    return;
  }
  if (CampusBookingRules.findRoomConflicts(adminBookings, { roomId: booking.roomId, date, start, end, ignoreBookingId: booking.id }).length) {
    status.textContent = "Room conflict detected. No change was saved.";
    return;
  }
  const next = { ...booking, date, start, end };
  const events = scheduleEvents.filter((item) => item.faculty === booking.owner || item.roomId === booking.roomId);
  if (events.some((item) => item.date === date && CampusBookingRules.overlaps(start, end, item.start, item.end))) {
    status.textContent = "Schedule conflict detected. No change was saved.";
    return;
  }
  Object.assign(booking, next);
  audit(`Rescheduled booking ${booking.id}`, `${date} · ${formatTime(start)}–${formatTime(end)}`);
  bookingChangeDialog.close();
  renderAllBookings();
  renderOverview();
  renderAnalytics();
});

function renderScheduleConflicts() {
  const conflicts = getScheduleConflicts();
  const summary = document.querySelector("#conflict-summary");
  summary.replaceChildren();
  const counts = new Map();
  conflicts.forEach((conflict) => counts.set(conflict.type, (counts.get(conflict.type) || 0) + 1));
  if (!conflicts.length) summary.append(el("span", "", "No active overlaps detected"));
  counts.forEach((count, label) => summary.append(el("span", "", `${label}: ${count}`)));
  const list = document.querySelector("#schedule-conflict-list");
  list.replaceChildren();
  conflicts.forEach((conflict) => {
    const card = el("article", "schedule-conflict-card");
    card.append(el("time", "", `${conflict.first.date}<br>${formatTime(conflict.first.start)}–${formatTime(conflict.first.end)}`));
    const details = el("div");
    details.append(el("h2", "", `${conflict.type} · ${conflict.first.title} ↔ ${conflict.second.title}`));
    details.append(el("p", "", `${conflict.first.group} / ${conflict.second.group} · ${conflict.first.faculty} / ${conflict.second.faculty} · ${getRoom(conflict.first.roomId)?.name} / ${getRoom(conflict.second.roomId)?.name} · ${conflict.first.source}`));
    card.append(details);
    const resolve = el("button", "", "Shift later item +30 min");
    resolve.type = "button";
    resolve.addEventListener("click", () => resolveScheduleConflict(conflict));
    card.append(resolve);
    list.append(card);
  });
  renderMasterScheduleTable();
  renderStatistics();
}

function renderMasterScheduleTable() {
  const container = document.querySelector("#master-schedule-table");
  if (!container) return;
  const rows = scheduleEvents.map((event) => {
    const row = el("tr");
    row.append(el("td", "", event.title));
    row.append(el("td", "", event.group || "—"));
    row.append(el("td", "", event.faculty || "—"));
    row.append(el("td", "", getRoom(event.roomId)?.name || event.roomId));
    row.append(el("td", "", `${event.date || ''} (${formatTime(event.start)}–${formatTime(event.end)})`));
    const actionCell = el("td");
    const delBtn = el("button", "admin-inline-delete", "Delete");
    delBtn.type = "button";
    delBtn.addEventListener("click", async () => {
      if (typeof window !== "undefined" && window.confirm && !window.confirm(`Delete schedule entry "${event.title}"?`)) return;
      if (liveMode && event.id) {
        try {
          await CampusApi.delete(`/api/v1/admin/schedule/${event.id}`);
          await loadAdminData();
          renderScheduleConflicts();
        } catch (err) {
          if (typeof window !== "undefined" && window.alert) window.alert(err.message || "Failed to delete schedule entry.");
        }
      } else {
        const idx = scheduleEvents.findIndex((s) => s.id === event.id);
        if (idx >= 0) scheduleEvents.splice(idx, 1);
        renderScheduleConflicts();
      }
    });
    actionCell.append(delBtn);
    row.append(actionCell);
    return row;
  });
  container.replaceChildren(table(["COURSE", "GROUP", "FACULTY", "ROOM", "WHEN", ""], rows));
}

const scheduleDialog = document.querySelector("#schedule-dialog");
const scheduleForm = document.querySelector("#schedule-form");
const addScheduleBtn = document.querySelector("#add-schedule-button");

if (addScheduleBtn) {
  addScheduleBtn.addEventListener("click", () => {
    if (!scheduleDialog || !scheduleForm) return;
    scheduleForm.reset();
    const roomSelect = document.querySelector("#schedule-room-select");
    if (roomSelect) {
      roomSelect.innerHTML = adminRooms.map((r) => `<option value="${r.id}">${r.name} (${r.building})</option>`).join("");
    }
    const facultySelect = document.querySelector("#schedule-faculty-select");
    if (facultySelect) {
      facultySelect.innerHTML = demoFaculty.map((f) => `<option value="${f.id}">${f.name} (${f.department})</option>`).join("");
    }
    const status = document.querySelector("#schedule-form-status");
    if (status) status.textContent = "";
    scheduleDialog.showModal();
  });
}

document.querySelector(".schedule-dialog-close")?.addEventListener("click", () => {
  scheduleDialog?.close();
});

if (scheduleForm) {
  scheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!scheduleForm.reportValidity()) return;
    const status = document.querySelector("#schedule-form-status");
    status.textContent = "Saving schedule entry…";

    const payload = {
      course_code: scheduleForm.elements.course_code.value.trim(),
      course_name: scheduleForm.elements.course_name.value.trim(),
      branch_code: scheduleForm.elements.branch_code.value,
      academic_year: Number(scheduleForm.elements.academic_year.value),
      section: scheduleForm.elements.section.value.trim() || null,
      day_of_week: Number(scheduleForm.elements.day_of_week.value),
      start_time: scheduleForm.elements.start_time.value,
      end_time: scheduleForm.elements.end_time.value,
      room_id: scheduleForm.elements.room_id.value,
      faculty_id: scheduleForm.elements.faculty_id.value,
    };

    if (payload.start_time >= payload.end_time) {
      status.textContent = "Start time must precede end time.";
      return;
    }

    if (liveMode) {
      try {
        await CampusApi.post("/api/v1/admin/schedule", payload);
        status.textContent = "Schedule entry saved to database.";
        await loadAdminData();
        renderScheduleConflicts();
        scheduleDialog?.close();
      } catch (err) {
        status.textContent = err.message || "Failed to save schedule entry.";
      }
    } else {
      const room = getRoom(payload.room_id);
      const faculty = demoFaculty.find((f) => f.id === payload.faculty_id);
      scheduleEvents.push({
        id: `demo-sch-${Date.now()}`,
        title: payload.course_name,
        group: `${payload.branch_code}-${payload.academic_year}-${payload.section || ''}`,
        faculty: faculty?.name || "Demo Faculty",
        roomId: payload.room_id,
        date: currentCampusDate(),
        start: payload.start_time,
        end: payload.end_time,
        source: "DEMO SCHEDULE",
      });
      status.textContent = "Saved to demo schedule.";
      renderScheduleConflicts();
      scheduleDialog?.close();
    }
  });
}

function resolveScheduleConflict(conflict) {
  const target = conflict.second;
  const duration = CampusBookingRules.toMinutes(target.end) - CampusBookingRules.toMinutes(target.start);
  let found = null;
  for (let startMinute = CampusBookingRules.toMinutes(target.end); startMinute + duration <= 19 * 60; startMinute += 30) {
    const start = `${String(Math.floor(startMinute / 60)).padStart(2, "0")}:${String(startMinute % 60).padStart(2, "0")}`;
    const endMinute = startMinute + duration;
    const end = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
    const conflictsWithOthers = scheduleEvents.some((other) => other.id !== target.id
      && other.date === target.date
      && (other.group === target.group || other.faculty === target.faculty || other.roomId === target.roomId)
      && CampusBookingRules.overlaps(start, end, other.start, other.end));
    if (!conflictsWithOthers) { found = { start, end }; break; }
  }
  if (!found) {
    window.alert("No open demo slot was found for this record.");
    return;
  }
  const previous = `${target.start}–${target.end}`;
  Object.assign(target, found);
  audit(`Resolved schedule conflict ${target.id}`, `${previous} → ${found.start}–${found.end}`);
  renderScheduleConflicts();
  renderOverviewConflicts();
}

function renderAnnouncements() {
  const queue = document.querySelector("#announcement-queue");
  queue.replaceChildren();
  const pending = announcements.filter((notice) => notice.status === "Draft" || notice.status === "Review required");
  document.querySelector("#announcement-queue-count").textContent = `${pending.length} awaiting review · ${announcements.length} total`;
  announcements.forEach((notice) => {
    const item = el("article", "announcement-queue-item");
    const body = el("div");
    body.append(el("h3", "", notice.title));
    body.append(el("p", "", notice.body));
    body.append(el("small", "", `${notice.audience === "public" ? "Public audience" : `Targeted: ${notice.audience}`} · ${notice.created} · ${notice.isPublic ? "Public" : "Not public"}`));
    item.append(body);
    const actions = el("div", "announcement-queue-actions");
    actions.append(statusChip(notice.status));
    if (notice.status === "Draft" || notice.status === "Review required") {
      const publish = el("button", "", "Review & publish");
      publish.type = "button";
      publish.addEventListener("click", () => publishAnnouncement(notice));
      const discard = el("button", "", "Discard");
      discard.type = "button";
      discard.addEventListener("click", () => {
        if (liveMode) {
          CampusApi.delete(`/api/v1/admin/announcements/${notice.id}`)
            .then(reloadAdminViews)
            .catch((error) => window.alert(error.message || "Draft could not be discarded."));
          return;
        }
        announcements = announcements.filter((item) => item.id !== notice.id);
        audit(`Discarded notice ${notice.id}`, notice.title);
        renderAnnouncements();
      });
      actions.append(publish, discard);
    }
    item.append(actions);
    queue.append(item);
  });
}

async function publishAnnouncement(notice) {
  if (!window.confirm(`Publish this reviewed notice to ${notice.audience === "public" ? "public" : notice.audience}?`)) return;
  if (liveMode) {
    try {
      await CampusApi.post(`/api/v1/admin/announcements/${notice.id}/publish`, {});
      await reloadAdminViews();
    } catch (error) {
      window.alert(error.message || "The notice could not be published.");
    }
    return;
  }
  notice.status = "Published · demo";
  notice.isPublic = notice.audience === "public";
  audit(`Published notice ${notice.id}`, `${notice.title} · ${notice.isPublic ? "public" : `targeted ${notice.audience}`}`);
  renderAnnouncements();
}

document.querySelector("#draft-announcement").addEventListener("click", () => {
  const title = document.querySelector("#announcement-title").value.trim();
  const body = document.querySelector("#announcement-body");
  if (!title) {
    document.querySelector("#announcement-form-status").textContent = "Add a title to prepare a wording suggestion.";
    return;
  }
  body.value = body.value.trim() || `Please note: ${title}. Check the official university schedule for confirmed date, time, venue, and applicable student groups. This is a draft for administrator review.`;
  document.querySelector("#announcement-form-status").textContent = "Local wording suggestion only; no AI service is connected. Review all details before saving.";
});

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const audience = form.elements.audience.value;
  if (liveMode) {
    const targetMatch = audience.match(/^([A-Z]+)-(\d+)-([A-Z])$/);
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const notice = await CampusApi.post("/api/v1/admin/announcements", {
        title: form.elements.title.value.trim(),
        body: form.elements.body.value.trim(),
        category: /exam|nss/i.test(form.elements.title.value) ? "examination" : "general",
        is_public: audience === "public",
        target_branch_code: targetMatch?.[1] || null,
        target_year: targetMatch ? Number(targetMatch[2]) : null,
        target_section: targetMatch?.[3] || null,
      });
      form.reset();
      document.querySelector("#announcement-form-status").textContent = `Draft ${notice.id} saved. It is not public until reviewed and explicitly published.`;
      await reloadAdminViews();
    } catch (error) {
      document.querySelector("#announcement-form-status").textContent = error.message || "The draft could not be saved.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
    return;
  }
  const notice = {
    id: `N-${String(announcements.length + 1).padStart(2, "0")}`,
    title: form.elements.title.value.trim(),
    body: form.elements.body.value.trim(),
    audience,
    isPublic: false,
    status: "Draft",
    created: "5 Nov 2026",
  };
  announcements.unshift(notice);
  audit(`Saved notice ${notice.id} as draft`, `${notice.title} · ${audience}`);
  form.reset();
  document.querySelector("#announcement-form-status").textContent = "Saved as draft. It is not public until reviewed and explicitly published.";
  renderAnnouncements();
});

function renderIssues() {
  const list = document.querySelector("#issue-list");
  list.replaceChildren();
  const filtered = issueReports.filter((issue) => issueFilter === "all" || issue.status === issueFilter);
  document.querySelector("#issue-nav-count").textContent = String(issueReports.filter((issue) => issue.status !== "resolved").length);
  if (!filtered.length) {
    list.append(el("p", "admin-empty", "No reports match this filter."));
    return;
  }
  filtered.forEach((issue) => {
    const card = el("article", "issue-card");
    const header = el("div", "issue-card-header");
    header.append(el("h2", "", `${issue.id} · ${issue.title}`));
    header.append(statusChip(issue.status));
    card.append(header);
    card.append(el("p", "", issue.body));
    card.append(el("div", "issue-card-meta", `${issue.category} · ${issue.location} · ${issue.reporter} · ${issue.created}`));
    const form = el("form", "issue-resolution");
    const textarea = el("textarea");
    textarea.name = "resolution";
    textarea.required = true;
    textarea.minLength = 5;
    textarea.maxLength = 500;
    textarea.value = issue.resolution;
    textarea.placeholder = "Investigation or resolution note";
    textarea.setAttribute("aria-label", `Resolution notes for ${issue.id}`);
    const button = el("button", "", issue.status === "resolved" ? "Update resolution" : "Save resolution");
    button.type = "submit";
    form.append(textarea, button);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (liveMode) {
        try {
          await CampusApi.patch(`/api/v1/admin/issues/${issue.id}`, { status: "resolved", resolution_notes: textarea.value.trim() });
          await reloadAdminViews();
        } catch (error) {
          textarea.setCustomValidity(error.message || "Could not save issue resolution.");
          textarea.reportValidity();
          textarea.setCustomValidity("");
        }
        return;
      }
      issue.resolution = textarea.value.trim();
      issue.status = "resolved";
      audit(`Resolved issue ${issue.id}`, issue.resolution);
      renderIssues();
    });
    if (issue.status !== "resolved") {
      const investigate = el("button", "", "Mark investigating");
      investigate.type = "button";
      investigate.addEventListener("click", async () => {
        if (liveMode) {
          try {
            await CampusApi.patch(`/api/v1/admin/issues/${issue.id}`, { status: "investigating", resolution_notes: issue.resolution || null });
            await reloadAdminViews();
          } catch (error) {
            window.alert(error.message || "Issue status could not be updated.");
          }
          return;
        }
        issue.status = "investigating";
        audit(`Started investigating issue ${issue.id}`, issue.title);
        renderIssues();
      });
      form.append(investigate);
    }
    card.append(form);
    list.append(card);
  });
}

document.querySelectorAll("[data-issue-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    issueFilter = button.dataset.issueFilter;
    document.querySelectorAll("[data-issue-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderIssues();
  });
});

function renderChart(containerId, values) {
  const container = document.querySelector(containerId);
  container.replaceChildren();
  const max = Math.max(...values.map((item) => item.value), 1);
  values.forEach((item) => {
    const row = el("div", "chart-row");
    row.append(el("span", "", item.label));
    const track = el("div", "chart-track");
    const bar = el("i");
    bar.style.width = `${Math.max(2, item.value / max * 100)}%`;
    track.append(bar);
    row.append(track, el("strong", "", String(item.value)));
    container.append(row);
  });
}

function renderAnalytics() {
  const confirmed = adminBookings.filter((booking) => booking.status === "confirmed");
  const cancelled = adminBookings.filter((booking) => booking.status === "cancelled");
  const totalHours = confirmed.reduce((sum, booking) => sum + durationHours(booking.start, booking.end), 0);
  const uniqueRooms = new Set(confirmed.map((booking) => booking.roomId)).size;
  const utilization = uniqueRooms ? (totalHours / (uniqueRooms * 10) * 100).toFixed(0) : "0";
  const stats = [["CONFIRMED HOURS", `${totalHours.toFixed(1)}h`], ["CANCELLATIONS", cancelled.length], ["ROOMS USED", uniqueRooms], ["DEMO UTILISATION", `${utilization}%`]];
  const summary = document.querySelector("#analytics-summary");
  summary.replaceChildren();
  stats.forEach(([label, value]) => {
    const item = el("div");
    item.append(el("span", "", label));
    item.append(el("strong", "", String(value)));
    summary.append(item);
  });
  const hoursByRoom = new Map();
  confirmed.forEach((booking) => hoursByRoom.set(booking.roomId, (hoursByRoom.get(booking.roomId) || 0) + durationHours(booking.start, booking.end)));
  renderChart("#utilisation-chart", [...hoursByRoom].map(([roomId, value]) => ({ label: getRoom(roomId)?.name || roomId, value })));
  const peak = new Map();
  confirmed.forEach((booking) => {
    const hour = `${String(Number(booking.start.slice(0, 2))).padStart(2, "0")}:00`;
    peak.set(hour, (peak.get(hour) || 0) + 1);
  });
  renderChart("#peak-hours-chart", [...peak].map(([label, value]) => ({ label, value })));
}

function renderAudit() {
  const rows = auditEntries.map((entry) => {
    const row = el("tr");
    row.append(el("td", "", entry.time));
    row.append(el("td", "", entry.actor));
    row.append(el("td", "", entry.action));
    row.append(el("td", "", entry.detail));
    row.append(el("td", "", "DEMO SESSION"));
    return row;
  });
  document.querySelector("#audit-table").replaceChildren(table(["WHEN", "WHO", "WHAT", "DETAIL", "SOURCE"], rows));
}

document.querySelector("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const updatedRules = {
    examApproval: form.elements.examApproval.checked,
    eventApproval: form.elements.eventApproval.checked,
    advanceDays: Number(form.elements.advanceDays.value),
    cancelHours: Number(form.elements.cancelHours.value),
  };
  if (liveMode) {
    try {
      bookingRules = await CampusApi.patch("/api/v1/admin/settings", {
        require_exam_approval: updatedRules.examApproval,
        require_event_approval: updatedRules.eventApproval,
        advance_booking_days: updatedRules.advanceDays,
        cancellation_notice_hours: updatedRules.cancelHours,
      });
      document.querySelector("#settings-status").textContent = "Booking policy saved to the database.";
    } catch (error) {
      document.querySelector("#settings-status").textContent = error.message || "Settings could not be saved.";
    }
    return;
  }
  bookingRules = updatedRules;
  audit("Updated booking policy settings", `Advance ${bookingRules.advanceDays} days · cancel notice ${bookingRules.cancelHours}h`);
  document.querySelector("#settings-status").textContent = "Demo policy values updated in this page session only.";
});

function downloadCsvBlob(filename, csvContent) {
  if (typeof Blob === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

document.querySelector("#export-students-button")?.addEventListener("click", () => {
  if (liveMode) {
    window.location.href = "/api/v1/admin/students/export";
  } else {
    const rows = studentRows();
    const csv = ["Student,Branch,Year,Batch,Section", ...rows.map((r) => `"${r.student || ''}","${r.branch || ''}","${r.year || ''}","${r.batch || ''}","${r.section || ''}"`)].join("\n");
    downloadCsvBlob("students.csv", csv);
  }
});

document.querySelector("#export-bookings-button")?.addEventListener("click", () => {
  if (liveMode) {
    window.location.href = "/api/v1/admin/bookings/export";
  } else {
    const csv = ["ID,Title,Room,Faculty,Date,Start,End,Status", ...adminBookings.map((b) => `"${b.id}","${b.title}","${getRoom(b.roomId)?.name || b.roomId}","${b.faculty}","${b.date}","${b.start}","${b.end}","${b.status}"`)].join("\n");
    downloadCsvBlob("bookings.csv", csv);
  }
});

document.querySelector("#export-rooms-button")?.addEventListener("click", () => {
  if (liveMode) {
    window.location.href = "/api/v1/admin/rooms/export";
  } else {
    const csv = ["Room,Building,Floor,Type,Capacity,PermittedUses,Enabled,Verified", ...adminRooms.map((r) => `"${r.name}","${r.building}","${r.floor}","${r.type}","${r.capacity || ''}","${(r.purposes || []).join('; ')}","${r.enabled}","${r.verified}"`)].join("\n");
    downloadCsvBlob("rooms.csv", csv);
  }
});

document.querySelector("#export-audit-button")?.addEventListener("click", () => {
  if (liveMode) {
    window.location.href = "/api/v1/admin/audit/export";
  } else {
    const csv = ["Time,Actor,Action,Detail", ...auditEntries.map((a) => `"${a.time}","${a.actor}","${a.action}","${a.detail}"`)].join("\n");
    downloadCsvBlob("audit_logs.csv", csv);
  }
});

const provisionRoleSelect = document.querySelector("#provision-role-select");
const provisionStudentExtra = document.querySelector("#provision-student-extra");
const provisionUserForm = document.querySelector("#provision-user-form");
const provisionUserStatus = document.querySelector("#provision-user-status");

if (provisionRoleSelect && provisionStudentExtra) {
  provisionRoleSelect.addEventListener("change", () => {
    provisionStudentExtra.hidden = provisionRoleSelect.value !== "student";
  });
}

if (provisionUserForm) {
  provisionUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!provisionUserForm.reportValidity()) return;
    const role = provisionUserForm.elements.role.value;
    const displayName = provisionUserForm.elements.display_name.value.trim();
    const email = provisionUserForm.elements.email.value.trim();
    const password = provisionUserForm.elements.password.value;

    const payload = { role, display_name: displayName, email, password };
    if (role === "student") {
      payload.roll_number = provisionUserForm.elements.roll_number.value.trim();
      payload.branch_code = provisionUserForm.elements.branch_code.value;
      if (!payload.roll_number) {
        if (provisionUserStatus) provisionUserStatus.textContent = "Roll number is required for students.";
        return;
      }
    }

    if (provisionUserStatus) provisionUserStatus.textContent = "Provisioning account on server…";
    if (liveMode) {
      try {
        const res = await CampusApi.post("/api/v1/admin/users", payload);
        if (provisionUserStatus) provisionUserStatus.textContent = `User ${res.email} successfully created as ${res.role}.`;
        provisionUserForm.reset();
        await loadAdminData();
      } catch (err) {
        if (provisionUserStatus) provisionUserStatus.textContent = err.message || "Failed to create user account.";
      }
    } else {
      if (provisionUserStatus) provisionUserStatus.textContent = `Demo: account for ${email} (${role}) simulated in browser session.`;
      provisionUserForm.reset();
    }
  });
}

document.querySelectorAll("#admin-sidebar").forEach((sidebar) => sidebar.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    sidebar.classList.remove("is-open");
    adminMenuToggle.setAttribute("aria-expanded", "false");
  }
}));

function renderOverview() {
  renderStatistics();
  renderOverviewConflicts();
  renderOverviewActivity();
  renderOverviewBookings();
}

function initialRender() {
  renderOverview();
  renderCampus();
  renderStudents();
  renderFaculty();
  renderAllBookings();
  renderScheduleConflicts();
  renderAnnouncements();
  renderIssues();
  renderAnalytics();
  renderAudit();
}

function currentCampusDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function scheduleOccurrenceDate(dayOfWeek, todayIso, todayIndex) {
  const date = new Date(`${todayIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + ((dayOfWeek - 1 - todayIndex + 7) % 7));
  return date.toISOString().slice(0, 10);
}

async function loadAdminData() {
  const [buildings, rooms, students, faculty, bookings, schedule, notices, issues, analytics, audit, settings] = await Promise.all([
    CampusApi.get("/api/v1/campus/buildings"),
    CampusApi.get("/api/v1/admin/rooms"),
    CampusApi.get("/api/v1/admin/students"),
    CampusApi.get("/api/v1/admin/faculty"),
    CampusApi.get("/api/v1/admin/bookings"),
    CampusApi.get("/api/v1/admin/schedule"),
    CampusApi.get("/api/v1/admin/announcements"),
    CampusApi.get("/api/v1/admin/issues"),
    CampusApi.get("/api/v1/admin/analytics"),
    CampusApi.get("/api/v1/admin/audit"),
    CampusApi.get("/api/v1/admin/settings"),
  ]);
  liveBuildings = buildings;
  adminRooms.splice(0, adminRooms.length, ...rooms.map(fromApiAdminRoom));
  liveStudents = students.map((student) => ({
    student: student.display_name,
    branch: student.branch_code,
    year: String(student.academic_year),
    batch: String(student.batch_year),
    section: student.section || "—",
  }));
  demoFaculty.splice(0, demoFaculty.length, ...faculty.map((member) => ({
    id: member.id,
    name: member.display_name,
    email: member.email,
    department: member.department_code || "Unassigned",
    access: member.is_active,
    booking: member.can_book,
    schedule: member.can_view_schedule,
  })));
  adminBookings = bookings.map(fromApiAdminBooking);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }).format(new Date());
  const dayIndex = Math.max(0, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday));
  const todayIso = currentCampusDate();
  scheduleEvents.splice(0, scheduleEvents.length, ...schedule.map((record) =>
    fromApiSchedule(record, scheduleOccurrenceDate(record.day_of_week, todayIso, dayIndex)),
  ));
  announcements = notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    audience: notice.is_public ? "public" : [notice.target_branch_code, notice.target_year, notice.target_section].filter(Boolean).join("-"),
    isPublic: notice.is_public,
    status: notice.status === "published" ? (notice.test_data ? "Published · demo" : "Published") : notice.status === "draft" ? "Draft" : notice.status,
    created: notice.created_at,
    testData: notice.test_data,
  }));
  issueReports = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    body: issue.description,
    category: "Reported issue",
    location: issue.room_number || "Campus",
    reporter: issue.reporter || "Faculty report",
    created: issue.created_at,
    status: issue.status,
    resolution: issue.resolution_notes || "",
    testData: issue.test_data,
  }));
  auditEntries = audit.map((entry) => ({
    time: entry.created_at,
    actor: entry.actor_email || "System",
    action: entry.action,
    detail: `${entry.entity_type} · ${entry.test_data ? "demo" : "record"}`,
  }));
  bookingRules = settings;
  const settingsForm = document.querySelector("#settings-form");
  settingsForm.elements.examApproval.checked = settings.require_exam_approval;
  settingsForm.elements.eventApproval.checked = settings.require_event_approval;
  settingsForm.elements.advanceDays.value = settings.advance_booking_days;
  settingsForm.elements.cancelHours.value = settings.cancellation_notice_hours;
  return analytics;
}

async function initializeAdminPortal() {
  if (demoMode) {
    document.body.classList.remove("auth-checking");
    initialRender();
    return;
  }
  try {
    const session = await CampusApi.session();
    if (session.user.role !== "admin") throw new Error("This session is not authorized for the Admin portal.");
    await loadAdminData();
    liveMode = true;
    document.title = "Admin Portal | DDUGU Smart Campus";
    document.querySelector("#admin-actor-name").textContent = session.user.email;
    document.querySelector("#admin-actor-mode").textContent = "AUTHENTICATED SESSION";
    document.querySelector("#admin-mode-flag").hidden = true;
    document.querySelector("#admin-environment-stamp").textContent = "LIVE DATABASE";
    document.querySelector("#admin-demo-alert").hidden = true;
    document.querySelector("[data-admin-logout]").textContent = "Sign out";
    document.body.classList.remove("auth-checking");
    document.body.classList.add("authenticated-portal");
    initialRender();
  } catch (error) {
    window.location.replace(`admin/login/?reason=${encodeURIComponent(error.message || "session")}`);
  }
}

document.querySelector("[data-admin-logout]").addEventListener("click", async (event) => {
  if (!liveMode) return;
  event.preventDefault();
  try { await CampusApi.logout(); }
  finally { window.location.href = "admin/login/"; }
});

initializeAdminPortal();