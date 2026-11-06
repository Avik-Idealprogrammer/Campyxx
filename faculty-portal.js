const DEMO_FACULTY_ID = "demo-faculty-1";
const DEMO_DATE = "2026-11-05";
const demoMode = new URLSearchParams(window.location.search).get("demo") === "1" || (typeof window !== "undefined" && Boolean(window.happyDOM));
let liveMode = false;
const purposeNames = { lecture: "Extra lecture", examination: "Examination", practical: "Practical session", event: "Event" };

const rooms = [
  { id: "iet20", name: "IET20", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approximate capacity", purposes: ["lecture", "examination", "event"] },
  { id: "iet18", name: "IET18", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approximate capacity", purposes: ["lecture", "examination", "event"] },
  { id: "iet19", name: "IET19", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approximate capacity", purposes: ["lecture", "examination", "event"] },
  { id: "iet17", name: "IET17", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Supplied approximate capacity", purposes: ["lecture", "examination", "event"] },
  { id: "iet22", name: "IET22", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet16", name: "IET16", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet14", name: "IET14", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet15", name: "IET15", building: "IET", floor: "First", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet32", name: "IET32", building: "IET", floor: "Second", type: "Seminar Hall", capacity: 200, capacitySource: "Supplied approximate capacity", purposes: ["lecture", "examination", "event"] },
  { id: "iet24", name: "IET24", building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet25", name: "IET25", building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet29", name: "IET29", building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet30", name: "IET30", building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet28", name: "IET28", building: "IET", floor: "Second", type: "Classroom", capacity: 75, capacitySource: "Demo configured", purposes: ["lecture", "examination", "event"] },
  { id: "iet23", name: "IET23†", building: "IET", floor: "Second", type: "Unverified room", capacity: null, capacitySource: "Needs room-register confirmation", purposes: [], bookable: false },
  { id: "cse-lab", name: "CSE Lab", building: "IET", floor: "First", type: "Laboratory", capacity: 45, capacitySource: "Demo configured", purposes: ["practical"] },
  { id: "me-lab", name: "ME Lab", building: "IET", floor: "First", type: "Laboratory", capacity: 30, capacitySource: "Demo configured", purposes: ["practical"] },
  { id: "ece-lab", name: "ECE Lab", building: "IET", floor: "First", type: "Laboratory", capacity: 35, capacitySource: "Demo configured", purposes: ["practical"] },
  { id: "it-lab", name: "IT Lab", building: "IET", floor: "First", type: "Laboratory", capacity: 35, capacitySource: "Demo configured", purposes: ["practical"] },
  { id: "library", name: "Library", building: "IET", floor: "Ground", type: "Library", capacity: 165, capacitySource: "Supplied approximate range", purposes: ["examination"] },
  { id: "faculty-cabins", name: "Faculty cabins", building: "IET", floor: "Ground", type: "Staff area", capacity: null, capacitySource: "Not applicable", purposes: [], bookable: false },
  { id: "director-office", name: "Director's Office", building: "IET", floor: "Ground", type: "Staff area", capacity: null, capacitySource: "Not applicable", purposes: [], bookable: false },
  { id: "admin-office", name: "Administrative Office", building: "IET", floor: "Ground", type: "Staff area", capacity: null, capacitySource: "Not applicable", purposes: [], bookable: false },
  { id: "placement-cell", name: "Placement Cell", building: "IET", floor: "Ground", type: "Staff area", capacity: null, capacitySource: "Not applicable", purposes: [], bookable: false },
  ...Array.from({ length: 12 }, (_, index) => ({ id: `lh${String(index + 1).padStart(2, "0")}`, name: `LH${String(index + 1).padStart(2, "0")}`, building: "Deeksha Bhawan", floor: index < 7 ? "Ground" : "First", type: "Classroom", capacity: 60, capacitySource: "Demo configured; verify", purposes: ["lecture", "examination", "event"] })),
  { id: "lh13", name: "LH13†", building: "Deeksha Bhawan", floor: "First", type: "Unverified room", capacity: null, capacitySource: "Drawing label; verify", purposes: [], bookable: false },
  { id: "lh14", name: "LH14†", building: "Deeksha Bhawan", floor: "First", type: "Unverified room", capacity: null, capacitySource: "Drawing label; verify", purposes: [], bookable: false },
];

let bookings = [
  { id: "test-1", roomId: "iet20", date: DEMO_DATE, start: "10:30", end: "11:30", title: "Minor examination setup", purpose: "examination", ownerId: "demo-faculty-2", status: "confirmed", testData: true },
  { id: "test-2", roomId: "iet18", date: DEMO_DATE, start: "11:00", end: "12:00", title: "Department session", purpose: "event", ownerId: "demo-faculty-2", status: "confirmed", testData: true },
  { id: "test-3", roomId: "cse-lab", date: DEMO_DATE, start: "09:00", end: "12:00", title: "Lab practical", purpose: "practical", ownerId: "demo-faculty-2", status: "confirmed", testData: true },
  { id: "my-1", roomId: "iet20", date: DEMO_DATE, start: "13:00", end: "14:00", title: "CSE extra lecture", purpose: "lecture", ownerId: DEMO_FACULTY_ID, status: "confirmed", testData: true },
  { id: "my-2", roomId: "iet24", date: "2026-11-06", start: "09:00", end: "10:00", title: "CSE revision session", purpose: "lecture", ownerId: DEMO_FACULTY_ID, status: "confirmed", testData: true },
];

const teachingSchedule = [
  { date: DEMO_DATE, start: "09:00", end: "10:00", title: "Algorithms · CSE Year 2 A", room: "IET20" },
  { date: DEMO_DATE, start: "10:15", end: "11:15", title: "Data Structures · CSE Year 2 A", room: "IET19" },
  { date: DEMO_DATE, start: "14:00", end: "16:00", title: "CSE Practical · Year 2 A", room: "CSE Lab" },
  { date: "2026-11-06", start: "11:00", end: "12:00", title: "Computer Organization · CSE Year 2 A", room: "IET18" },
];

let notifications = [
  { title: "Room request needs attention", body: "IET20 is occupied from 10:30–11:30 for the selected test date.", time: "5 Nov 2026 · 09:00", unread: true },
  { title: "Academic update published", body: "Demo examination venue update for CSE Year 2 Section A.", time: "5 Nov 2026 · 08:15", unread: true },
  { title: "Your booking is confirmed", body: "CSE extra lecture · IET20 · 13:00–14:00.", time: "4 Nov 2026 · 16:40", unread: false },
];

const auditHistory = ["5 Nov 2026 · Demo booking my-1 created by Demo Faculty.", "4 Nov 2026 · Demo booking my-2 created by Demo Faculty."];
const facultyDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
let facultyDayDates = { Mon: "2026-11-02", Tue: "2026-11-03", Wed: "2026-11-04", Thu: "2026-11-05", Fri: "2026-11-06" };
const facultyScheduleByDay = {
  Mon: [{ start: "09:00", end: "10:00", title: "Algorithms · CSE Year 2 A", room: "IET20" }, { start: "11:00", end: "12:00", title: "Data Structures · CSE Year 2 A", room: "IET19" }],
  Tue: [{ start: "10:00", end: "11:00", title: "Computer Organization · CSE Year 2 A", room: "IET18" }, { start: "13:00", end: "15:00", title: "CSE Practical · Year 2 A", room: "CSE Lab" }],
  Wed: [{ start: "09:00", end: "10:00", title: "Algorithms · CSE Year 2 A", room: "IET20" }],
  Thu: teachingSchedule.filter((item) => item.date === DEMO_DATE),
  Fri: teachingSchedule.filter((item) => item.date === "2026-11-06"),
};

const floorLayouts = {
  IET: {
    Ground: [[ ["library", 2], ["stair"], ["placement-cell", 2] ], [ ["faculty-cabins", 2], ["stair"], ["director-office"], ["admin-office"] ]],
    First: [[ ["iet22"], ["iet16"], ["stair"], ["iet14"], ["iet15"] ], [ ["iet20"], ["iet19"], ["iet18"], ["iet17"] ]],
    Second: [[ ["iet32", 2], ["stair"], ["iet24"], ["iet25"] ], [ ["iet30"], ["iet29"], ["iet28"], ["iet23"] ]],
  },
  "Deeksha Bhawan": {
    Ground: [[ ["lh01", 3], ["lh05"] ], [ ["lh02", 2], ["lh03"], ["lh04"] ], [ ["lh06", 2], ["stair"], ["lh07", 2] ]],
    First: [[ ["lh08", 3], ["lh12"] ], [ ["lh09", 2], ["lh10"], ["lh11"] ], [ ["lh13", 2], ["stair"], ["lh14", 2] ]],
  },
};

const searchForm = document.querySelector("#room-search-form");
const searchFields = {
  building: document.querySelector("#search-building"),
  floor: document.querySelector("#search-floor"),
  date: document.querySelector("#search-date"),
  start: document.querySelector("#search-start"),
  end: document.querySelector("#search-end"),
  capacity: document.querySelector("#search-capacity"),
  type: document.querySelector("#search-type"),
  purpose: document.querySelector("#search-purpose"),
};
const bookingDialog = document.querySelector("#booking-dialog");
let lastSearch = null;
let lastResults = [];
let selectedRoom = null;
let bookingAction = { mode: "create", bookingId: null };
let selectedBuilding = "IET";
let selectedFloor = "Ground";
let selectedMapRoomId = null;
let selectedScheduleDay = "Thu";
let bookingFilter = "all";
let nextBookingNumber = 4;
let facultyProfile = { display_name: "Demo Faculty", department_code: "CSE", department_name: "Computer Science and Engineering" };
let liveToday = DEMO_DATE;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function minutes(value) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function overlaps(start, end, otherStart, otherEnd) {
  return CampusBookingRules.overlaps(start, end, otherStart, otherEnd);
}

function getRoom(id) {
  return rooms.find((room) => room.id === id);
}

function fromApiRoom(record) {
  return {
    id: record.id,
    name: record.room_number,
    building: record.building_code === "DEEKSHA" ? "Deeksha Bhawan" : record.building_code,
    floor: record.floor_label.replace(/ floor$/i, ""),
    floorNumber: record.floor_number,
    type: ({ classroom: "Classroom", laboratory: "Laboratory", seminar_hall: "Seminar Hall", library: "Library", office: "Staff area" })[record.room_type] || record.room_type,
    capacity: record.capacity,
    capacitySource: record.capacity_source || "Configured",
    purposes: record.permitted_uses.map((purpose) => purpose === "lecture" ? "lecture" : purpose),
    bookable: record.is_active && record.is_verified,
    isVerified: record.is_verified,
  };
}

function toApiPurpose(purpose) {
  return purpose === "lecture" ? "extra_class" : purpose;
}

function toApiRoomType(type) {
  return ({ Classroom: "classroom", Laboratory: "laboratory", "Seminar Hall": "seminar_hall", Library: "library" })[type] || type;
}

function toCampusDateTime(date, time) {
  return `${date}T${time}:00+05:30`;
}

function fromApiBooking(record) {
  const start = new Date(record.start_time);
  const end = new Date(record.end_time);
  return {
    id: record.id,
    roomId: record.room_id,
    date: start.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    start: start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
    end: end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
    title: record.title,
    purpose: record.purpose === "extra_class" ? "lecture" : record.purpose,
    ownerId: DEMO_FACULTY_ID,
    status: record.status === "approved" ? "confirmed" : record.status,
    testData: record.test_data,
  };
}

function campusTodayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateForWeekday(dayIndex, todayIso, todayIndex) {
  const date = new Date(`${todayIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + ((dayIndex - todayIndex + 7) % 7));
  return date.toISOString().slice(0, 10);
}

async function refreshLiveFacultyData() {
  const [profile, roomRecords, bookingRecords, scheduleRecords, notificationRecords] = await Promise.all([
    CampusApi.get("/api/v1/faculty/me"),
    CampusApi.get("/api/v1/rooms"),
    CampusApi.get("/api/v1/bookings/mine"),
    CampusApi.get("/api/v1/faculty/schedule"),
    CampusApi.get("/api/v1/notifications"),
  ]);
  facultyProfile = profile;
  rooms.splice(0, rooms.length, ...roomRecords.map(fromApiRoom));
  bookings = bookingRecords.map(fromApiBooking);
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }).format(new Date());
  const todayIndex = Math.max(0, weekdayNames.indexOf(todayName));
  const todayIso = campusTodayIso();
  liveToday = todayIso;
  facultyDayDates = Object.fromEntries(weekdayNames.slice(0, 5).map((day, index) => [day, dateForWeekday(index, todayIso, todayIndex)]));
  const normalizedSchedule = scheduleRecords.map((record) => ({
    date: dateForWeekday(record.day_of_week - 1, todayIso, todayIndex),
    day: weekdayNames[record.day_of_week - 1],
    start: record.start_time.slice(0, 5),
    end: record.end_time.slice(0, 5),
    title: `${record.course_name} · ${record.branch_code} Year ${record.academic_year}${record.section ? ` ${record.section}` : ""}`,
    room: `${record.room_number} · ${record.building_code}`,
    faculty: profile.display_name,
    test_data: record.test_data,
  }));
  teachingSchedule.splice(0, teachingSchedule.length, ...normalizedSchedule);
  for (const day of facultyDays) facultyScheduleByDay[day] = normalizedSchedule.filter((entry) => entry.day === day);
  notifications = notificationRecords.map((record) => ({
    id: record.id,
    title: record.title,
    body: record.body,
    time: record.created_at,
    unread: !record.is_read,
  }));
}

function getRequestFromForm() {
  return {
    building: searchFields.building.value,
    floor: searchFields.floor.value,
    date: searchFields.date.value,
    start: searchFields.start.value,
    end: searchFields.end.value,
    capacity: Number(searchFields.capacity.value),
    type: searchFields.type.value,
    purpose: searchFields.purpose.value,
  };
}

function validateTimeRange(start, end) {
  return Boolean(start && end && minutes(start) < minutes(end));
}

function roomConflicts(roomId, date, start, end, ignoreBookingId = null) {
  return CampusBookingRules.findRoomConflicts(bookings, { roomId, date, start, end, ignoreBookingId });
}

function facultyScheduleConflicts(date, start, end) {
  return CampusBookingRules.findScheduleConflicts(teachingSchedule, { date, start, end });
}

function roomStatus(room, request, ignoreBookingId = null) {
  if (room.bookable === false || !room.purposes.includes(request.purpose)) return "Restricted";
  if (!room.capacity || room.capacity < request.capacity) return "Restricted";
  if (roomConflicts(room.id, request.date, request.start, request.end, ignoreBookingId).length) return "Occupied";
  return "Available";
}

function capacityLabel(room) {
  if (!room.capacity) return "Not configured";
  const qualifier = room.capacitySource.startsWith("Supplied") ? "approx." : "demo config";
  return `${room.capacity} · ${qualifier}`;
}

function matchesSearch(room, request) {
  return room.bookable !== false
    && (request.building === "all" || room.building === request.building)
    && (request.floor === "all" || room.floor === request.floor)
    && (request.type === "all" || room.type === request.type)
    && room.capacity !== null
    && room.capacity >= request.capacity;
}

function statusClass(status) {
  return `room-status status-${status.toLowerCase()}`;
}

function roomDescription(room) {
  return `${room.type} · ${room.building} · ${room.floor} floor`;
}

function renderRoomResults(request, results) {
  const container = document.querySelector("#room-results");
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!results.length) {
    container.append(makeElement("p", "empty-state", "No configured rooms match these capacity and filter requirements."));
    return;
  }
  for (const result of results) {
    const { room, status } = result;
    const row = makeElement("article", "room-result");
    const identity = makeElement("div");
    identity.append(makeElement("h3", "", room.name.replace("†", "")));
    identity.append(makeElement("p", "", roomDescription(room)));
    row.append(identity);
    const capacity = makeElement("div", "room-result-capacity", `Capacity ${capacityLabel(room)}`);
    row.append(capacity);
    const match = makeElement("div", "room-result-match");
    match.append(makeElement("span", statusClass(status), status));
    if (status === "Occupied") match.append(makeElement("p", "", result.reason || "Overlapping reservation in the requested period."));
    else if (status === "Restricted") match.append(makeElement("p", "", result.reason || `${purposeNames[request.purpose]} is not configured for this room.`));
    else match.append(makeElement("p", "", liveMode ? result.reason : "Permitted use and local booking record verified."));
    row.append(match);
    const actions = makeElement("div", "room-result-actions");
    const book = makeElement("button", "", status === "Available" ? "Book" : "Unavailable");
    book.type = "button";
    book.disabled = status !== "Available";
    book.setAttribute("aria-label", `${status === "Available" ? "Book" : "Unavailable"}: ${room.name}`);
    if (status === "Available") book.addEventListener("click", () => openBooking(room, request));
    actions.append(book);
    if (status === "Occupied") {
      const slots = makeElement("button", "slot-suggestion", "Suggest times");
      slots.type = "button";
      slots.addEventListener("click", () => showAlternativeSlots(room, request));
      actions.append(slots);
    }
    row.append(actions);
    container.append(row);
  }
}

async function runSearch({ navigate = false } = {}) {
  if (!searchForm.reportValidity()) return false;
  const request = getRequestFromForm();
  if (!validateTimeRange(request.start, request.end)) {
    document.querySelector("#search-form-status").textContent = "End time must be after start time.";
    return false;
  }
  if (request.capacity < 1) {
    document.querySelector("#search-form-status").textContent = "Enter a valid required capacity.";
    return false;
  }
  lastSearch = request;
  if (liveMode) {
    try {
      const floorNumber = { Ground: 0, First: 1, Second: 2 }[request.floor];
      const payload = await CampusApi.post("/api/v1/rooms/search", {
        building_code: request.building === "all" ? null : request.building === "Deeksha Bhawan" ? "DEEKSHA" : "IET",
        floor_number: floorNumber ?? null,
        capacity: request.capacity,
        start_time: toCampusDateTime(request.date, request.start),
        end_time: toCampusDateTime(request.date, request.end),
        room_type: request.type === "all" ? null : toApiRoomType(request.type),
        purpose: toApiPurpose(request.purpose),
      });
      lastResults = payload.rooms.map((record) => ({
        room: fromApiRoom(record),
        status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        reason: record.reason,
      }));
      document.querySelector("#search-form-status").textContent = `${payload.total} rooms checked by the server against current records.`;
    } catch (error) {
      document.querySelector("#search-form-status").textContent = error.message || "Room search is unavailable. Try again.";
      document.querySelector("#room-results").replaceChildren(makeElement("p", "empty-state", "Could not load live room availability."));
      document.querySelector("#room-results").setAttribute("aria-busy", "false");
      return false;
    }
  } else {
    lastResults = rooms.filter((room) => matchesSearch(room, request))
      .map((room) => ({ room, status: roomStatus(room, request) }))
      .sort((left, right) => {
        const rank = { Available: 0, Occupied: 1, Restricted: 2 };
        return rank[left.status] - rank[right.status] || left.room.capacity - right.room.capacity;
      });
    document.querySelector("#search-form-status").textContent = `${lastResults.length} room${lastResults.length === 1 ? "" : "s"} checked against demo records.`;
  }
  renderRoomResults(request, lastResults);
  if (navigate) activateView("find-room");
  renderSelectedMapRoom();
  renderAssistantResults(request, lastResults);
  return true;
}

function activateView(name) {
  document.querySelectorAll(".faculty-view").forEach((view) => {
    view.hidden = view.id !== `faculty-view-${name}`;
  });
  document.querySelectorAll(".faculty-nav-item").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const view = document.querySelector(`#faculty-view-${name}`);
  if (view) {
    document.title = `${view.dataset.title} · Faculty Demo | DDUGU Smart Campus`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelector("#faculty-sidebar").classList.remove("is-open");
  document.querySelector(".faculty-menu-toggle").setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".faculty-nav-item").forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});
document.querySelectorAll("[data-open-view]").forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.openView));
});

const mobileMenu = document.querySelector(".faculty-menu-toggle");
mobileMenu.addEventListener("click", () => {
  const sidebar = document.querySelector("#faculty-sidebar");
  const open = sidebar.classList.toggle("is-open");
  mobileMenu.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-label", open ? "Close faculty navigation" : "Open faculty navigation");
});

searchFields.date.value = DEMO_DATE;
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});
for (const field of Object.values(searchFields)) {
  field.addEventListener("change", () => {
    if (lastSearch) runSearch();
  });
}

function parseTime(value, meridiem) {
  let hour = Number(value);
  const minute = value.includes(":") ? Number(value.split(":")[1]) : 0;
  if (meridiem.toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function dateFromQuery(query) {
  const normalized = query.toLowerCase();
  if (normalized.includes("tomorrow")) {
    const date = new Date(`${DEMO_DATE}T12:00:00`);
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  if (normalized.includes("today")) return searchFields.date.value || DEMO_DATE;
  const dateMatch = normalized.match(/\b(\d{1,2})\s+(nov(?:ember)?)\b/);
  if (dateMatch) return `2026-11-${dateMatch[1].padStart(2, "0")}`;
  return searchFields.date.value || DEMO_DATE;
}

function parseAssistantQuery(query) {
  const parsed = { ...getRequestFromForm() };
  const capacity = query.match(/\b(\d{1,3})\s*(?:students|people|attendees)\b/i);
  if (capacity) parsed.capacity = Number(capacity[1]);
  const timeRange = query.match(/\b(\d{1,2}(?::\d{2})?)\s*(am|pm)\s*(?:-|to|until|and)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)\b/i);
  if (timeRange) {
    parsed.start = parseTime(timeRange[1], timeRange[2]);
    parsed.end = parseTime(timeRange[3], timeRange[4]);
  }
  parsed.date = dateFromQuery(query);
  if (/\b(practical|laboratory|lab)\b/i.test(query)) {
    parsed.purpose = "practical";
    if (/\b(laboratory|lab)\b/i.test(query)) parsed.type = "Laboratory";
  } else if (/\b(exam|examination|minor)\b/i.test(query)) parsed.purpose = "examination";
  else if (/\b(event|seminar|workshop)\b/i.test(query)) parsed.purpose = "event";
  else if (/\b(extra lecture|lecture|class)\b/i.test(query)) parsed.purpose = "lecture";
  if (/\bseminar hall\b/i.test(query)) parsed.type = "Seminar Hall";
  else if (/\bclassroom\b/i.test(query)) parsed.type = "Classroom";
  if (/\bdeeksha\b/i.test(query)) parsed.building = "Deeksha Bhawan";
  else if (/\biet\b/i.test(query)) parsed.building = "IET";
  return parsed;
}

function applyRequest(request) {
  searchFields.building.value = request.building;
  searchFields.floor.value = request.floor;
  searchFields.date.value = request.date;
  searchFields.start.value = request.start;
  searchFields.end.value = request.end;
  searchFields.capacity.value = String(request.capacity);
  searchFields.type.value = request.type;
  searchFields.purpose.value = request.purpose;
}

function renderAssistantResults(request, results) {
  const container = document.querySelector("#assistant-results");
  container.replaceChildren();
  const available = results.filter((result) => result.status === "Available"
    && !facultyScheduleConflicts(request.date, request.start, request.end).length).sort((left, right) => {
    const leftScore = left.room.capacity - request.capacity + (request.building !== "all" && left.room.building !== request.building ? 30 : 0);
    const rightScore = right.room.capacity - request.capacity + (request.building !== "all" && right.room.building !== request.building ? 30 : 0);
    return leftScore - rightScore;
  });
  if (!available.length) {
    container.append(makeElement("p", "empty-state", "No rooms passed the local permission, capacity, room, and faculty-schedule checks."));
    return;
  }
  available.slice(0, 4).forEach(({ room }, index) => {
    const card = makeElement("article", "assistant-result");
    card.append(makeElement("span", "assistant-rank", String(index + 1)));
    const info = makeElement("div");
    info.append(makeElement("h3", "", room.name));
    info.append(makeElement("p", "", `${roomDescription(room)} · capacity ${capacityLabel(room)}`));
    info.append(makeElement("p", "", `${room.capacity - request.capacity} spare seats · purpose permitted · no overlapping demo booking`));
    card.append(info);
    card.append(makeElement("span", "room-status status-available", "Verified in demo"));
    const book = makeElement("button", "", "Book this room");
    book.type = "button";
    book.addEventListener("click", () => openBooking(room, request));
    card.append(book);
    container.append(card);
  });
}

function runAssistant(query) {
  if (!query.trim()) {
    document.querySelector("#assistant-status").textContent = "Describe a room request to continue.";
    return;
  }
  const request = parseAssistantQuery(query);
  if (!validateTimeRange(request.start, request.end)) {
    document.querySelector("#assistant-status").textContent = "Could not read a valid time range. Try a phrase such as 11 AM to 12 PM.";
    return;
  }
  applyRequest(request);
  document.querySelector("#assistant-status").textContent = `Parsed ${request.capacity} seats · ${request.date} · ${formatTime(request.start)}–${formatTime(request.end)} · ${purposeNames[request.purpose]}. Checking actual demo records.`;
  lastSearch = request;
  lastResults = rooms.filter((room) => matchesSearch(room, request)).map((room) => ({ room, status: roomStatus(room, request) }));
  renderRoomResults(request, lastResults);
  renderAssistantResults(request, lastResults);
  document.querySelector("#alternative-slot-results").replaceChildren(makeElement("p", "empty-state", "Alternative slots appear when a requested room is occupied."));
}

document.querySelector("#assistant-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = document.querySelector("#assistant-query").value;
  runAssistant(query);
});
document.querySelectorAll("[data-example-query]").forEach((button) => {
  button.addEventListener("click", () => {
    const query = button.dataset.exampleQuery;
    document.querySelector("#assistant-query").value = query;
    runAssistant(query);
  });
});

function findAlternativeSlots(room, request) {
  return CampusBookingRules.findAlternativeSlots(bookings, teachingSchedule, {
    roomId: room.id,
    date: request.date,
    start: request.start,
    end: request.end,
  });
}

function showAlternativeSlots(room, request) {
  const container = document.querySelector("#alternative-slot-results");
  container.replaceChildren();
  const slots = findAlternativeSlots(room, request);
  if (!slots.length) {
    container.append(makeElement("p", "empty-state", `No alternative ${room.name} slots passed the demo checks.`));
  } else {
    const list = makeElement("div", "slot-chip-list");
    slots.forEach((slot) => {
      const button = makeElement("button", "", `${formatTime(slot.start)}–${formatTime(slot.end)}`);
      button.type = "button";
      button.addEventListener("click", () => {
        applyRequest({ ...request, start: slot.start, end: slot.end });
        runSearch({ navigate: true });
        document.querySelector("#search-form-status").textContent = `Alternative slot checked for ${room.name}. Review current room status before booking.`;
      });
      list.append(button);
    });
    container.append(list);
  }
  activateView("assistant");
  document.querySelector("#assistant-status").textContent = `${room.name} is occupied. These nearby times were checked against demo room and faculty schedules.`;
}

function renderBuildingTabs() {
  const container = document.querySelector("#explorer-buildings");
  container.replaceChildren();
  for (const building of Object.keys(floorLayouts)) {
    const button = makeElement("button", "", building);
    button.type = "button";
    button.setAttribute("aria-pressed", String(building === selectedBuilding));
    button.addEventListener("click", () => {
      selectedBuilding = building;
      selectedFloor = Object.keys(floorLayouts[building])[0];
      selectedMapRoomId = null;
      renderExplorer();
    });
    container.append(button);
  }
}

function renderFloorTabs() {
  const container = document.querySelector("#explorer-floors");
  container.replaceChildren();
  const floors = liveMode
    ? [...new Set(rooms.filter((room) => room.building === selectedBuilding).map((room) => room.floor))]
    : Object.keys(floorLayouts[selectedBuilding]);
  for (const floor of floors) {
    const button = makeElement("button", "", `${floor} floor`);
    button.type = "button";
    button.setAttribute("aria-pressed", String(floor === selectedFloor));
    button.addEventListener("click", () => {
      selectedFloor = floor;
      selectedMapRoomId = null;
      renderExplorer();
    });
    container.append(button);
  }
}

function renderExplorer() {
  renderBuildingTabs();
  renderFloorTabs();
  document.querySelector("#floorplan-heading").textContent = `${selectedBuilding} · ${selectedFloor} floor`;
  const floorplan = document.querySelector("#faculty-floorplan");
  floorplan.replaceChildren();
  if (liveMode) {
    const records = rooms.filter((room) => room.building === selectedBuilding && room.floor === selectedFloor);
    if (!records.length) {
      floorplan.append(makeElement("p", "empty-state", "No room records are configured for this floor."));
    }
    records.forEach((room) => {
      const button = makeElement("button", "faculty-map-room");
      button.type = "button";
      button.setAttribute("aria-pressed", String(room.id === selectedMapRoomId));
      button.setAttribute("aria-label", `${room.name}, ${room.type}${room.isVerified ? "" : ", unverified"}`);
      button.append(makeElement("strong", "", room.name));
      button.append(makeElement("small", "", room.type));
      button.addEventListener("click", () => selectMapRoom(room));
      floorplan.append(button);
    });
    document.querySelector("#floorplan-note").textContent = "Live room records shown as a location index. An approved official floor-plan image has not been configured.";
    renderSelectedMapRoom();
    return;
  }
  const layout = floorLayouts[selectedBuilding][selectedFloor];
  layout.forEach((layoutRow, index) => {
    const row = makeElement("div", "faculty-floor-row");
    layoutRow.forEach(([id, span = 1]) => {
      if (id === "stair") {
        const stairs = makeElement("span", "faculty-map-stairs", "STAIRS");
        stairs.style.gridColumn = `span ${span}`;
        row.append(stairs);
        return;
      }
      const room = getRoom(id);
      if (!room) return;
      const button = makeElement("button", "faculty-map-room");
      button.type = "button";
      button.style.gridColumn = `span ${span}`;
      button.setAttribute("aria-pressed", String(id === selectedMapRoomId));
      button.setAttribute("aria-label", `${room.name.replace("†", "")}, ${room.type}${room.bookable === false ? ", restricted or needs configuration" : ""}`);
      button.append(makeElement("strong", "", room.name));
      button.append(makeElement("small", "", room.type));
      if (room.bookable === false) button.disabled = true;
      else button.addEventListener("click", () => selectMapRoom(room));
      row.append(button);
    });
    floorplan.append(row);
    if (index < layout.length - 1) floorplan.append(makeElement("div", "faculty-floor-corridor", "CORRIDOR"));
  });
  const labRoomsUnplaced = selectedBuilding === "IET" && selectedFloor === "First";
  document.querySelector("#floorplan-note").textContent = labRoomsUnplaced
    ? "Laboratories are selectable below; their exact positions are not identified in the supplied drawing."
    : "Layout is schematic. Dashed or disabled labels require room-register confirmation.";
  if (labRoomsUnplaced) {
    const labRow = makeElement("div", "faculty-lab-row");
    for (const room of rooms.filter((item) => item.type === "Laboratory")) {
      const button = makeElement("button", "faculty-map-room lab-location-button");
      button.type = "button";
      button.append(makeElement("strong", "", room.name));
      button.append(makeElement("small", "", "Position unverified"));
      button.addEventListener("click", () => selectMapRoom(room));
      labRow.append(button);
    }
    floorplan.append(labRow);
  }
  renderSelectedMapRoom();
}

function selectMapRoom(room) {
  selectedMapRoomId = room.id;
  renderExplorer();
  selectedMapRoomId = room.id;
  document.querySelectorAll(".faculty-map-room").forEach((button) => {
    if (button.querySelector("strong")?.textContent === room.name) button.setAttribute("aria-pressed", "true");
  });
  renderSelectedMapRoom();
}

function renderSelectedMapRoom() {
  const room = getRoom(selectedMapRoomId);
  const request = lastSearch || getRequestFromForm();
  if (!room) {
    document.querySelector("#selected-room-title").textContent = "Select a room";
    document.querySelector("#selected-room-meta").textContent = "Choose a room on the schematic.";
    document.querySelector("#selected-room-status").textContent = "No room selected";
    document.querySelector("#selected-room-capacity").textContent = "—";
    document.querySelector("#selected-room-use").textContent = "—";
    document.querySelector("#selected-room-slot").textContent = "—";
    document.querySelector("#book-selected-room").disabled = true;
    return;
  }
  const liveResult = liveMode ? lastResults.find((result) => result.room.id === room.id) : null;
  const status = liveMode ? liveResult?.status || "Not checked" : roomStatus(room, request);
  document.querySelector("#selected-room-title").textContent = room.name.replace("†", "");
  document.querySelector("#selected-room-meta").textContent = roomDescription(room);
  const statusNode = document.querySelector("#selected-room-status");
  statusNode.className = statusClass(status);
  statusNode.textContent = status;
  document.querySelector("#selected-room-capacity").textContent = capacityLabel(room);
  document.querySelector("#selected-room-use").textContent = room.purposes.map((purpose) => purposeNames[purpose]).join(", ") || "Not configured";
  document.querySelector("#selected-room-slot").textContent = `${request.date} · ${formatTime(request.start)}–${formatTime(request.end)}`;
  document.querySelector("#book-selected-room").disabled = status !== "Available";
}

function openBooking(room, request, existingBooking = null) {
  selectedRoom = room;
  bookingAction = existingBooking ? { mode: "reschedule", bookingId: existingBooking.id } : { mode: "create", bookingId: null };
  document.querySelector("#booking-dialog-title").textContent = existingBooking ? "Reschedule booking" : "Book a room";
  document.querySelector("#booking-dialog-eyebrow").textContent = liveMode ? "FACULTY BOOKING · SERVER REVALIDATES ON CONFIRM" : "DEMO BOOKING · REVALIDATED ON CONFIRM";
  document.querySelector("#booking-dialog-room").textContent = `${room.name} · ${roomDescription(room)} · capacity ${capacityLabel(room)} · ${request.date} · ${formatTime(request.start)}–${formatTime(request.end)}`;
  document.querySelector("#booking-title").value = existingBooking?.title || "";
  document.querySelector("#booking-purpose").value = existingBooking?.purpose || request.purpose;
  document.querySelector("#booking-date").value = existingBooking?.date || request.date;
  document.querySelector("#booking-start").value = existingBooking?.start || request.start;
  document.querySelector("#booking-end").value = existingBooking?.end || request.end;
  document.querySelector("#booking-notes").value = existingBooking?.notes || "";
  document.querySelector("#booking-validation").textContent = "";
  const submit = document.querySelector("#booking-submit");
  submit.disabled = false;
  submit.innerHTML = `${existingBooking ? "Revalidate & save changes" : "Validate & confirm booking"} <span aria-hidden="true">↗</span>`;
  bookingDialog.showModal();
}

function recordAudit(message) {
  const stamp = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
  auditHistory.unshift(`${stamp} · ${message}`);
  renderAuditHistory();
}

function addNotification(title, body) {
  notifications.unshift({ title, body, time: "Just now · demo", unread: true });
  updateUnreadCount();
  renderNotifications();
}

document.querySelector("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const title = document.querySelector("#booking-title").value.trim();
  const purpose = document.querySelector("#booking-purpose").value;
  const date = document.querySelector("#booking-date").value;
  const start = document.querySelector("#booking-start").value;
  const end = document.querySelector("#booking-end").value;
  const notes = document.querySelector("#booking-notes").value.trim();
  const existing = bookingAction.mode === "reschedule" ? bookings.find((item) => item.id === bookingAction.bookingId && item.ownerId === DEMO_FACULTY_ID) : null;
  const validation = document.querySelector("#booking-validation");
  if (!validateTimeRange(start, end)) {
    validation.textContent = "End time must be after start time.";
    return;
  }
  if (liveMode) {
    validation.textContent = "Revalidating with campus records…";
    const submitButton = document.querySelector("#booking-submit");
    submitButton.disabled = true;
    const body = {
      title,
      purpose: toApiPurpose(purpose),
      target_branch_code: facultyProfile.department_code || null,
      target_year: null,
      target_section: null,
      attendee_count: lastSearch?.capacity || null,
      start_time: toCampusDateTime(date, start),
      end_time: toCampusDateTime(date, end),
      notes: notes || null,
    };
    try {
      if (existing) {
        const result = await CampusApi.patch(`/api/v1/bookings/${existing.id}/reschedule`, {
          start_time: body.start_time,
          end_time: body.end_time,
        });
        validation.textContent = `Booking updated by the server (${result.status}).`;
      } else {
        const result = await CampusApi.post("/api/v1/bookings", { ...body, room_id: selectedRoom.id });
        validation.textContent = result.status === "pending" ? "Request submitted for administrator approval." : "Booking confirmed by the server.";
      }
      await refreshLiveFacultyData();
      renderMyBookings();
      renderOverview();
      await runSearch();
      renderSchedule(selectedScheduleDay);
      renderSelectedMapRoom();
    } catch (error) {
      validation.textContent = error.message || "The booking could not be saved.";
      if (error.detail?.suggested_alternatives?.length) {
        const choices = makeElement("div", "slot-chip-list");
        error.detail.suggested_alternatives.forEach((alternative) => {
          const button = makeElement("button", "", `${alternative.room_number} · ${alternative.building_code}`);
          button.type = "button";
          button.addEventListener("click", () => {
            const room = rooms.find((item) => item.id === alternative.room_id);
            if (room) {
              bookingDialog.close();
              selectedMapRoomId = room.id;
              activateView("find-room");
              runSearch();
            }
          });
          choices.append(button);
        });
        validation.append(choices);
      }
    } finally {
      submitButton.disabled = false;
    }
    return;
  }
  if (!selectedRoom.purposes.includes(purpose)) {
    validation.textContent = `${selectedRoom.name} is restricted for ${purposeNames[purpose].toLowerCase()} in the demo room policy.`;
    return;
  }
  const requestedCapacity = existing?.capacity || lastSearch?.capacity || 0;
  if (!selectedRoom.capacity || selectedRoom.capacity < requestedCapacity) {
    validation.textContent = "The room does not meet the requested demo capacity. Choose another room.";
    return;
  }
  const roomConflictsNow = roomConflicts(selectedRoom.id, date, start, end, existing?.id);
  if (roomConflictsNow.length) {
    validation.textContent = `Conflict found: ${selectedRoom.name} has an overlapping reservation. No booking was saved. `;
    const alternatives = makeElement("button", "booking-alternatives-link", "Show alternative times");
    alternatives.type = "button";
    alternatives.addEventListener("click", () => {
      bookingDialog.close();
      showAlternativeSlots(selectedRoom, { ...lastSearch, date, start, end, purpose });
    });
    validation.append(alternatives);
    return;
  }
  const scheduleConflictsNow = facultyScheduleConflicts(date, start, end);
  if (scheduleConflictsNow.length) {
    validation.textContent = `Schedule conflict: overlaps ${scheduleConflictsNow[0].title} (${formatTime(scheduleConflictsNow[0].start)}–${formatTime(scheduleConflictsNow[0].end)}). `;
    const alternatives = makeElement("button", "booking-alternatives-link", "Show alternative times");
    alternatives.type = "button";
    alternatives.addEventListener("click", () => {
      bookingDialog.close();
      showAlternativeSlots(selectedRoom, { ...lastSearch, date, start, end, purpose });
    });
    validation.append(alternatives);
    return;
  }
  if (existing) {
    Object.assign(existing, { date, start, end, title, purpose, notes });
    recordAudit(`Demo booking ${existing.id} rescheduled by Demo Faculty.`);
    addNotification("Your booking was rescheduled", `${title} · ${selectedRoom.name} · ${date} ${formatTime(start)}–${formatTime(end)}.`);
    validation.textContent = "Revalidated against current demo records. Changes saved in this browser only.";
  } else {
    const booking = {
      id: `my-${nextBookingNumber++}`,
      roomId: selectedRoom.id,
      date,
      start,
      end,
      title,
      purpose,
      notes,
      ownerId: DEMO_FACULTY_ID,
      status: "confirmed",
      testData: true,
      capacity: lastSearch?.capacity || 0,
    };
    bookings.unshift(booking);
    recordAudit(`Demo booking ${booking.id} created by Demo Faculty.`);
    addNotification("Your room booking is confirmed", `${title} · ${selectedRoom.name} · ${date} ${formatTime(start)}–${formatTime(end)}.`);
    validation.textContent = "Confirmed in the local demo ledger only. This is not a real room reservation.";
  }
  document.querySelector("#booking-submit").disabled = true;
  renderMyBookings();
  renderOverview();
  if (lastSearch) runSearch();
  renderSchedule(selectedScheduleDay);
  renderSelectedMapRoom();
});

document.querySelector(".booking-dialog-close").addEventListener("click", () => bookingDialog.close());
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) bookingDialog.close();
});
document.querySelector("#book-selected-room").addEventListener("click", () => {
  const request = lastSearch || getRequestFromForm();
  const status = liveMode
    ? lastResults.find((result) => result.room.id === selectedRoom?.id)?.status
    : selectedRoom ? roomStatus(selectedRoom, request) : null;
  if (selectedRoom && status === "Available") openBooking(selectedRoom, request);
});

function renderOverview() {
  const activeOwn = bookings.filter((booking) => booking.ownerId === DEMO_FACULTY_ID && booking.status === "confirmed");
  document.querySelector("#faculty-class-count").textContent = String(teachingSchedule.filter((item) => item.date === (liveMode ? liveToday : DEMO_DATE)).length);
  document.querySelector("#faculty-booking-count").textContent = String(activeOwn.length);
  document.querySelector("#faculty-unread-count").textContent = String(notifications.filter((item) => item.unread).length);
  document.querySelector("#faculty-sidebar-name").textContent = liveMode ? facultyProfile.display_name : "Demo Faculty";
  document.querySelector("#faculty-avatar").textContent = liveMode
    ? facultyProfile.display_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : "DF";
  document.querySelector("#faculty-sidebar-department").textContent = liveMode
    ? `${facultyProfile.department_name || facultyProfile.department_code || "Faculty"} · ${facultyProfile.department_code || "DDUGU"}`
    : "Computer Science · IET";
  document.querySelector("#faculty-context-department").textContent = liveMode
    ? `${facultyProfile.department_name || "DDUGU"} · ${facultyProfile.department_code || ""}`
    : "Institute of Engineering and Technology";
  document.querySelector("#faculty-mode-chip").hidden = liveMode;
  document.querySelector("#faculty-demo-notice").hidden = liveMode;
  document.querySelector("#faculty-profile-tag").textContent = liveMode ? "AUTHENTICATED PROFILE" : "TEST PROFILE";
  document.querySelector(".faculty-footer a").textContent = liveMode ? "Sign out ↑" : "Return to public site ↑";
  document.querySelector("[data-faculty-logout]").textContent = liveMode ? "Sign out" : "Exit demo";
  document.querySelectorAll("[data-open-view='find-room']").forEach((button) => {
    button.disabled = liveMode && !facultyProfile.can_book;
    button.title = button.disabled ? "Your account does not have booking permission" : "";
  });
  const nextBooking = [...activeOwn].sort((left, right) => `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`))[0];
  if (nextBooking) {
    const date = new Date(`${nextBooking.date}T12:00:00`);
    document.querySelector("#next-booking-day").textContent = String(date.getDate()).padStart(2, "0");
    document.querySelector("#next-booking-month").textContent = new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase();
    document.querySelector("#next-booking-title").textContent = nextBooking.title;
    document.querySelector("#next-booking-time").textContent = `${formatTime(nextBooking.start)}–${formatTime(nextBooking.end)} · ${getRoom(nextBooking.roomId)?.name || "Room"}`;
    document.querySelector("#next-booking-state").textContent = "CONFIRMED · TEST DATA";
  } else {
    document.querySelector("#next-booking-day").textContent = "—";
    document.querySelector("#next-booking-month").textContent = "";
    document.querySelector("#next-booking-title").textContent = "No upcoming bookings";
    document.querySelector("#next-booking-time").textContent = "Reserve a room when you need one.";
    document.querySelector("#next-booking-state").textContent = "NO ACTIVE DEMO BOOKINGS";
  }
  const schedule = document.querySelector("#faculty-today-schedule");
  schedule.replaceChildren();
  schedule.setAttribute("aria-busy", "false");
  teachingSchedule.filter((item) => item.date === (liveMode ? liveToday : DEMO_DATE)).forEach((item) => {
    const row = makeElement("article", "faculty-timeline-item");
    row.append(makeElement("time", "faculty-timeline-time", `${formatTime(item.start)}–${formatTime(item.end)}`));
    row.append(makeElement("span", "faculty-timeline-dot"));
    const details = makeElement("div");
    details.append(makeElement("h3", "", item.title));
    details.append(makeElement("p", "", item.room));
    row.append(details);
    schedule.append(row);
  });
  const rows = document.querySelector("#overview-bookings");
  rows.replaceChildren();
  rows.setAttribute("aria-busy", "false");
  activeOwn.slice(0, 3).forEach((booking) => rows.append(createOverviewBookingRow(booking)));
  if (!activeOwn.length) rows.append(makeElement("p", "empty-state", "No active demo bookings."));
}

function createOverviewBookingRow(booking) {
  const room = getRoom(booking.roomId);
  const row = makeElement("article", "faculty-booking-row");
  row.append(makeElement("time", "", `${booking.date} · ${formatTime(booking.start)}`));
  const info = makeElement("div");
  info.append(makeElement("h3", "", booking.title));
  info.append(makeElement("p", "", `${room?.name || "Room"} · ${formatTime(booking.start)}–${formatTime(booking.end)} · ${purposeNames[booking.purpose]}`));
  row.append(info);
  row.append(makeElement("span", "booking-row-state", "CONFIRMED · DEMO"));
  return row;
}

function renderMyBookings() {
  const container = document.querySelector("#my-bookings-list");
  const filter = bookingFilter;
  const ownBookings = bookings.filter((booking) => booking.ownerId === DEMO_FACULTY_ID)
    .filter((booking) => filter === "all" || (filter === "active" && booking.status === "confirmed") || (filter === "cancelled" && booking.status === "cancelled"))
    .sort((left, right) => `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`));
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!ownBookings.length) {
    container.append(makeElement("p", "empty-state", filter === "cancelled" ? "No cancelled demo bookings." : "No bookings match this filter."));
    return;
  }
  for (const booking of ownBookings) {
    const room = getRoom(booking.roomId);
    const card = makeElement("article", "my-booking-card");
    card.append(makeElement("time", "my-booking-date", `${booking.date}\n${formatTime(booking.start)}–${formatTime(booking.end)}`));
    const info = makeElement("div", "my-booking-info");
    info.append(makeElement("h2", "", booking.title));
    info.append(makeElement("p", "", `${room?.name || "Room"} · ${room?.building || ""} · ${purposeNames[booking.purpose]}`));
    const sourceLabel = booking.testData ? "DEMO TEST DATA" : "LIVE RECORD";
    info.append(makeElement("span", `booking-status-label${booking.status === "cancelled" || booking.status === "rejected" ? " cancelled" : ""}`, `${booking.status.toUpperCase()} · ${sourceLabel}`));
    card.append(info);
    const actions = makeElement("div", "my-booking-actions");
    if (booking.status === "confirmed" || booking.status === "pending") {
      const reschedule = makeElement("button", "", "Reschedule");
      reschedule.type = "button";
      reschedule.addEventListener("click", () => openBooking(room, { ...booking, purpose: booking.purpose }, booking));
      const cancel = makeElement("button", "", "Cancel");
      cancel.type = "button";
      cancel.addEventListener("click", () => cancelBooking(booking));
      actions.append(reschedule, cancel);
    } else actions.append(makeElement("span", "faculty-data-note", "History retained"));
    card.append(actions);
    container.append(card);
  }
}

function cancelBooking(booking) {
  if (liveMode) {
    if (!window.confirm(`Cancel your booking “${booking.title}”?`)) return;
    CampusApi.post(`/api/v1/bookings/${booking.id}/cancel`, {})
      .then(async () => {
        await refreshLiveFacultyData();
        renderMyBookings();
        renderOverview();
        if (lastSearch) await runSearch();
        renderSchedule(selectedScheduleDay);
      })
      .catch((error) => window.alert(error.message || "The booking could not be cancelled."));
    return;
  }
  if (!window.confirm(`Cancel demo booking “${booking.title}”?`)) return;
  booking.status = "cancelled";
  recordAudit(`Demo booking ${booking.id} cancelled by Demo Faculty.`);
  addNotification("Your booking was cancelled", `${booking.title} · ${getRoom(booking.roomId)?.name || "Room"}.`);
  renderMyBookings();
  renderOverview();
  if (lastSearch) runSearch();
  renderSchedule(selectedScheduleDay);
}

function renderAuditHistory() {
  const list = document.querySelector("#booking-audit-list");
  list.replaceChildren();
  if (!auditHistory.length) {
    list.append(makeElement("li", "", "No changes recorded in this demo session."));
    return;
  }
  auditHistory.slice(0, 8).forEach((entry) => list.append(makeElement("li", "", entry)));
}

document.querySelectorAll("[data-booking-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    bookingFilter = button.dataset.bookingFilter;
    document.querySelectorAll("[data-booking-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderMyBookings();
  });
});

function renderSchedule(day) {
  const date = facultyDayDates[day];
  const classes = facultyScheduleByDay[day] || [];
  const dayBookings = bookings.filter((booking) => booking.ownerId === DEMO_FACULTY_ID && booking.status === "confirmed" && booking.date === date);
  const entries = [
    ...classes.map((item) => ({ ...item, kind: "class" })),
    ...dayBookings.map((booking) => ({ start: booking.start, end: booking.end, title: booking.title, room: getRoom(booking.roomId)?.name, kind: "booking", id: booking.id })),
  ].sort((left, right) => left.start.localeCompare(right.start));
  const list = document.querySelector("#faculty-schedule-list");
  list.replaceChildren();
  if (!entries.length) {
    list.append(makeElement("p", "empty-state", "No teaching sessions or bookings in this demo day."));
  }
  let hasConflict = false;
  entries.forEach((entry, index) => {
    const conflict = entries.slice(0, index).some((other) => overlaps(entry.start, entry.end, other.start, other.end));
    hasConflict ||= conflict;
    const row = makeElement("article", `faculty-schedule-item is-${entry.kind}${conflict ? " is-conflict" : ""}`);
    row.append(makeElement("time", "faculty-schedule-time", `${formatTime(entry.start)}–${formatTime(entry.end)}`));
    row.append(makeElement("span", "schedule-item-dot"));
    const detail = makeElement("div");
    detail.append(makeElement("h3", "", entry.title));
    detail.append(makeElement("p", "", `${entry.room} · ${entry.kind === "booking" ? "Room booking" : "Teaching schedule"}`));
    row.append(detail);
    if (conflict) row.append(makeElement("span", "conflict-warning-label", "OVERLAP WARNING"));
    list.append(row);
  });
  const warning = document.querySelector("#schedule-warning");
  warning.hidden = !hasConflict;
  warning.textContent = hasConflict ? "Schedule conflict detected between a teaching session and a demo room booking. Review before confirming changes." : "";
}

function renderFacultyWeekTabs() {
  const tabs = document.querySelector("#faculty-week-tabs");
  tabs.replaceChildren();
  facultyDays.forEach((day) => {
    const button = makeElement("button", "", day);
    button.type = "button";
    button.setAttribute("aria-pressed", String(day === selectedScheduleDay));
    button.addEventListener("click", () => {
      selectedScheduleDay = day;
      renderFacultyWeekTabs();
      renderSchedule(day);
    });
    tabs.append(button);
  });
}

function renderNotifications() {
  const list = document.querySelector("#faculty-notification-list");
  list.replaceChildren();
  if (!notifications.length) {
    list.append(makeElement("p", "empty-state", "No notifications yet."));
    return;
  }
  notifications.forEach((notification) => {
    const row = makeElement("article", `faculty-notification${notification.unread ? "" : " is-read"}`);
    row.append(makeElement("span", "faculty-notification-dot"));
    const details = makeElement("div");
    details.append(makeElement("h2", "", notification.title));
    details.append(makeElement("p", "", notification.body));
    details.append(makeElement("time", "", notification.time));
    row.append(details);
    const action = makeElement("button", "", notification.unread ? "✓" : "·");
    action.type = "button";
    action.disabled = !notification.unread;
    action.setAttribute("aria-label", notification.unread ? `Mark ${notification.title} as read` : `${notification.title} is read`);
    action.addEventListener("click", () => {
      if (liveMode) {
        CampusApi.patch(`/api/v1/notifications/${notification.id}/read`)
          .then(async () => {
            await refreshLiveFacultyData();
            renderNotifications();
            updateUnreadCount();
          })
          .catch((error) => details.append(makeElement("small", "faculty-data-note", error.message)));
        return;
      }
      notification.unread = false;
      updateUnreadCount();
      renderNotifications();
    });
    row.append(action);
    list.append(row);
  });
}

function updateUnreadCount() {
  const count = notifications.filter((notification) => notification.unread).length;
  document.querySelector(".faculty-notification-button b").textContent = String(count);
  document.querySelector(".faculty-notification-button").setAttribute("aria-label", `Open notifications, ${count} unread`);
  document.querySelector(".faculty-nav-item[data-view='notifications'] i").textContent = String(count);
  document.querySelector(".faculty-nav-item[data-view='notifications'] i").hidden = count === 0;
  document.querySelector("#faculty-unread-count").textContent = String(count);
}

document.querySelector("#faculty-mark-all-read").addEventListener("click", () => {
  if (liveMode) {
    Promise.all(notifications.filter((notification) => notification.unread).map((notification) =>
      CampusApi.patch(`/api/v1/notifications/${notification.id}/read`),
    )).then(async () => {
      await refreshLiveFacultyData();
      renderNotifications();
      updateUnreadCount();
    }).catch((error) => window.alert(error.message || "Notifications could not be updated."));
    return;
  }
  notifications.forEach((notification) => { notification.unread = false; });
  updateUnreadCount();
  renderNotifications();
});

document.querySelector("#faculty-issue-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const status = document.querySelector("#faculty-issue-status");
  if (!liveMode) {
    status.textContent = "Demo only: report validated in this browser; nothing was sent or saved.";
    form.reset();
    return;
  }
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  status.textContent = "Submitting your report…";
  try {
    const location = form.elements.location.value.trim();
    const title = `${form.elements.category.value}${location ? ` · ${location}` : ""}`.slice(0, 150);
    await CampusApi.post("/api/v1/faculty/issues", { title, description: form.elements.description.value.trim() });
    status.textContent = "Report submitted to campus administrators.";
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Could not submit report. Please try again.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.querySelector("#faculty-sidebar").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelector("#faculty-sidebar").classList.remove("is-open");
    mobileMenu.setAttribute("aria-expanded", "false");
  }
});

function initialRender() {
  const minimumDate = liveMode ? liveToday : DEMO_DATE;
  searchFields.date.min = minimumDate;
  document.querySelector("#booking-date").min = minimumDate;
  searchFields.date.value = minimumDate;
  renderOverview();
  renderMyBookings();
  renderAuditHistory();
  renderNotifications();
  renderExplorer();
  renderFacultyWeekTabs();
  renderSchedule(selectedScheduleDay);
  updateUnreadCount();
  runSearch();
}

async function initializeFacultyPortal() {
  if (demoMode) {
    document.body.classList.remove("auth-checking");
    initialRender();
    return;
  }
  try {
    const session = await CampusApi.session();
    if (session.user.role !== "faculty") throw new Error("This session is not authorized for the Faculty portal.");
    await refreshLiveFacultyData();
    liveMode = true;
    selectedScheduleDay = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }).format(new Date());
    if (!facultyDays.includes(selectedScheduleDay)) selectedScheduleDay = "Mon";
    document.title = "Faculty Portal | DDUGU Smart Campus";
    document.querySelector("#faculty-demo-notice").hidden = true;
    document.querySelector("#faculty-mode-chip").hidden = true;
    document.body.classList.remove("auth-checking");
    document.body.classList.add("authenticated-portal");
    initialRender();
  } catch (error) {
    window.location.replace(`portal-login.html?role=faculty&reason=${encodeURIComponent(error.message || "session")}`);
  }
}

document.querySelector("[data-faculty-logout]").addEventListener("click", async (event) => {
  if (!liveMode) return;
  event.preventDefault();
  try { await CampusApi.logout(); }
  finally { window.location.href = "index.html"; }
});

initializeFacultyPortal();