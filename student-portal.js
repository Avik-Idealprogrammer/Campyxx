const demoStudent = { branch: "CSE", year: 2, batch: "2024", section: "A" };
const demoSchedule = {
  Mon: [
    { start: "09:00", end: "10:00", title: "Mathematics-II", faculty: "Demo Faculty", room: "IET20" },
    { start: "10:15", end: "11:15", title: "Data Structures", faculty: "Demo Faculty", room: "IET19" },
    { start: "12:00", end: "13:00", title: "Computer Organization", faculty: "Demo Faculty", room: "IET18" },
  ],
  Tue: [
    { start: "09:00", end: "10:00", title: "Data Structures", faculty: "Demo Faculty", room: "IET19" },
    { start: "10:15", end: "11:15", title: "Discrete Mathematics", faculty: "Demo Faculty", room: "IET20" },
    { start: "13:00", end: "15:00", title: "CSE Practical", faculty: "Demo Faculty", room: "CSE Lab · location to confirm" },
  ],
  Wed: [
    { start: "09:00", end: "10:00", title: "Computer Organization", faculty: "Demo Faculty", room: "IET18" },
    { start: "10:15", end: "11:15", title: "Mathematics-II", faculty: "Demo Faculty", room: "IET20" },
  ],
  Thu: [
    { start: "09:00", end: "10:00", title: "Mathematics-II", faculty: "Demo Faculty", room: "IET20" },
    { start: "10:15", end: "11:15", title: "Data Structures", faculty: "Demo Faculty", room: "IET19" },
    { start: "12:00", end: "13:00", title: "Computer Organization", faculty: "Demo Faculty", room: "IET18" },
    { start: "14:00", end: "16:00", title: "CSE Practical", faculty: "Demo Faculty", room: "CSE Lab · location to confirm" },
  ],
  Fri: [
    { start: "09:00", end: "10:00", title: "Discrete Mathematics", faculty: "Demo Faculty", room: "IET20" },
    { start: "10:15", end: "11:15", title: "Data Structures", faculty: "Demo Faculty", room: "IET19" },
    { start: "12:00", end: "13:00", title: "Computer Organization", faculty: "Demo Faculty", room: "IET18" },
  ],
};

const demoExams = [
  { day: "10", month: "NOV", title: "NSS Minor Examination", date: "10 November 2026 · 10:00–12:00", venue: "LH03 · Deeksha Bhawan", updated: "Venue update · 5 November 2026", status: "UPDATED · DEMO" },
  { day: "18", month: "NOV", title: "Mathematics-II Assessment", date: "18 November 2026 · 09:00–11:00", venue: "Venue to be announced", updated: "Demo schedule", status: "DEMO" },
  { day: "23", month: "NOV", title: "Data Structures Practical", date: "23 November 2026 · 13:00–15:00", venue: "CSE Lab · location to confirm", updated: "Demo schedule", status: "DEMO" },
];

const demoAnnouncements = [
  { date: "5 Nov 2026", title: "NSS Minor Examination venue updated", body: "The demo examination record now lists LH03, Deeksha Bhawan. Check the exam details for the latest version.", group: "CSE-2-A", tag: "EXAM UPDATE", exam: true },
  { date: "4 Nov 2026", title: "CSE Year 2 timetable preview", body: "A sample timetable has been added for the CSE Year 2 Section A demo profile.", group: "CSE-2-A", tag: "TIMETABLE" },
  { date: "3 Nov 2026", title: "Student portal preview is available", body: "This is a fictional-data preview. It is not an official DDUGU schedule or notification channel.", group: "CSE-2-A", tag: "PORTAL UPDATE" },
];

const demoNotifications = [
  { title: "NSS Minor Examination venue updated", body: "Demo update: the venue is LH03, Deeksha Bhawan. Verify through official university channels.", date: "5 Nov 2026 · 09:10", target: "examinations", unread: true },
  { title: "CSE Year 2 timetable preview added", body: "A sample schedule is available for the CSE Year 2 Section A demo profile.", date: "4 Nov 2026 · 16:40", target: "timetable", unread: true },
  { title: "Student portal preview is available", body: "The portal is using fictional test content only.", date: "3 Nov 2026 · 11:20", target: "overview", unread: false },
];

const campus = {
  iet: {
    name: "Institute of Engineering and Technology (IET)",
    floors: {
      ground: {
        label: "Ground floor",
        rows: [
          [{ name: "Library", type: "Library", span: 2, capacity: "Approx. 150–180", use: "Library; examinations where authorised" }, { gap: "STAIRS" }, { name: "Placement Cell", type: "Office", span: 2 }],
          [{ name: "Faculty cabins", type: "Staff area", span: 2 }, { gap: "ENTRY / STAIRS" }, { name: "Director's Office", type: "Office" }, { name: "Administrative Office", type: "Office" }],
        ],
        note: "Ground-floor locations are labeled from the supplied campus plan. Staff areas are shown for wayfinding only.",
      },
      first: {
        label: "First floor",
        rows: [
          [{ name: "IET22", type: "Classroom" }, { name: "IET16", type: "Classroom" }, { gap: "STAIRS" }, { name: "IET14", type: "Classroom" }, { name: "IET15", type: "Classroom" }],
          [{ name: "IET20", type: "Classroom", capacity: "Approx. 75", use: "Classroom; other uses require confirmation" }, { name: "IET19", type: "Classroom", capacity: "Approx. 75", use: "Classroom; other uses require confirmation" }, { name: "IET18", type: "Classroom", capacity: "Approx. 75", use: "Classroom; other uses require confirmation" }, { name: "IET17", type: "Classroom", capacity: "Approx. 75", use: "Classroom; other uses require confirmation" }],
        ],
        note: "CSE, ME, ECE, and IT laboratories are listed for this floor in the problem statement; their exact positions are not labeled on the supplied drawing.",
      },
      second: {
        label: "Second floor",
        rows: [
          [{ name: "IET32", type: "Seminar hall", span: 2, capacity: "Approx. 200", use: "Seminar hall; permitted uses require confirmation" }, { gap: "STAIRS" }, { name: "IET24", type: "Classroom" }, { name: "IET25", type: "Classroom" }],
          [{ name: "IET30", type: "Classroom" }, { name: "IET29", type: "Classroom" }, { name: "IET28", type: "Classroom" }, { name: "IET23†", type: "Blueprint label · verify", pending: true }],
        ],
        note: "The drawing includes IET23, while the written room list does not. This label is flagged for room-register confirmation.",
      },
    },
  },
  deeksha: {
    name: "Deeksha Bhawan",
    floors: {
      ground: {
        label: "Ground floor",
        rows: [
          [{ name: "LH01", type: "Classroom", span: 3 }, { name: "LH05", type: "Classroom" }],
          [{ name: "LH02", type: "Classroom", span: 2 }, { name: "LH03", type: "Classroom" }, { name: "LH04", type: "Classroom" }],
          [{ name: "LH06", type: "Classroom", span: 2 }, { gap: "STAIRS / ENTRY" }, { name: "LH07", type: "Classroom", span: 2 }],
        ],
        note: "Classroom labels follow the supplied Deeksha Bhawan ground-floor drawing. Room capacities and permitted uses are not configured in this demo.",
      },
      first: {
        label: "First floor",
        rows: [
          [{ name: "LH08", type: "Classroom", span: 3 }, { name: "LH12", type: "Classroom" }],
          [{ name: "LH09", type: "Classroom", span: 2 }, { name: "LH10", type: "Classroom" }, { name: "LH11", type: "Classroom" }],
          [{ name: "LH13†", type: "Blueprint label · verify", span: 2, pending: true }, { gap: "STAIRS" }, { name: "LH14†", type: "Blueprint label · verify", span: 2, pending: true }],
        ],
        note: "The drawing includes LH13–LH14, while the written description specifies LH01–LH12. These labels need room-register confirmation.",
      },
    },
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const demoMode = new URLSearchParams(window.location.search).get("demo") === "1" || (typeof window !== "undefined" && Boolean(window.happyDOM));
const currentDate = new Date(2026, 10, 5);
const currentDay = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(currentDate);
const demoWeekDates = { Mon: "Monday · 2 November 2026", Tue: "Tuesday · 3 November 2026", Wed: "Wednesday · 4 November 2026", Thu: "Thursday · 5 November 2026", Fri: "Friday · 6 November 2026" };
let liveMode = false;
let studentProfile = null;
let currentGroup = `${demoStudent.branch}-${demoStudent.year}-${demoStudent.section}`;
let scheduleByDay = demoSchedule;
let announcementsData = demoAnnouncements;
let examinationsData = demoExams;
let notificationsData = demoNotifications;
let selectedDay = demoSchedule[currentDay] ? currentDay : "Thu";
let selectedBuilding = "iet";
let selectedFloor = "ground";
let selectedRoom = null;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function displayDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : dateFormatter.format(parsed);
}

function announceEmpty(container, message) {
  container.replaceChildren(makeElement("p", "empty-state", message));
  container.setAttribute("aria-busy", "false");
}

function renderSchedule(day, target) {
  const rows = scheduleByDay[day] || [];
  const container = document.querySelector(target);
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!rows.length) {
    announceEmpty(container, "No sample classes are scheduled for this day.");
    return;
  }
  for (const item of rows) {
    const row = makeElement("div", "timeline-item");
    row.append(makeElement("span", "timeline-time", `${formatTime(item.start)}–${formatTime(item.end)}`));
    row.append(makeElement("span", "timeline-marker"));
    const details = makeElement("div", "timeline-detail");
    details.append(makeElement("h3", "timeline-class", item.title));
    details.append(makeElement("p", "timeline-location", `${item.room} · ${item.faculty}`));
    row.append(details);
    container.append(row);
  }
}

function renderTimetable(day) {
  const body = document.querySelector("#timetable-rows");
  const records = scheduleByDay[day] || [];
  body.replaceChildren();
  document.querySelector("#timetable-day-label").textContent = demoWeekDates[day] || day;
  if (!records.length) {
    const row = makeElement("tr");
    const cell = makeElement("td", "empty-state", "No sample classes for this day.");
    cell.colSpan = 4;
    row.append(cell);
    body.append(row);
    return;
  }
  for (const item of records) {
    const row = makeElement("tr");
    row.append(makeElement("td", "", `${formatTime(item.start)}–${formatTime(item.end)}`));
    row.append(makeElement("td", "", item.title));
    row.append(makeElement("td", "", item.faculty || "Scheduled class"));
    row.append(makeElement("td", "", item.room));
    body.append(row);
  }
}

function renderWeekdayTabs() {
  const tabs = document.querySelector("#weekday-tabs");
  tabs.replaceChildren();
  for (const day of Object.keys(scheduleByDay)) {
    const button = makeElement("button", "", day);
    button.type = "button";
    button.setAttribute("aria-pressed", String(day === selectedDay));
    button.addEventListener("click", () => {
      selectedDay = day;
      renderWeekdayTabs();
      renderTimetable(day);
    });
    tabs.append(button);
  }
}

function appendDemoBadge(parent) {
  parent.append(makeElement("span", "demo-badge", "Demo content"));
}

function renderAnnouncements(target, limit = Infinity) {
  const container = document.querySelector(target);
  const records = (liveMode ? announcementsData : announcementsData.filter((record) => record.group === currentGroup)).slice(0, limit);
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!records.length) {
    announceEmpty(container, "Abhi koi notice nahi.");
    return;
  }
  for (const record of records) {
    const item = makeElement("article", "student-notice");
    item.append(makeElement("time", "", record.date || displayDate(record.published_at)));
    const details = makeElement("div");
    details.append(makeElement("h3", "", record.title));
    details.append(makeElement("p", "", record.body));
    if (!liveMode || record.test_data) appendDemoBadge(details);
    item.append(details);
    const action = makeElement("button", "notice-go", "↗");
    action.type = "button";
    const examNotice = record.exam || record.category === "examination";
    action.setAttribute("aria-label", examNotice ? "View exam update" : "Read announcement");
    action.addEventListener("click", () => activateView(examNotice ? "examinations" : "announcements"));
    item.append(action);
    container.append(item);
  }
}

function renderExams() {
  const container = document.querySelector("#exam-list");
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!examinationsData.length) {
    announceEmpty(container, liveMode ? "No upcoming examinations are listed for your group." : "No exams are listed for this demo profile.");
    return;
  }
  for (const record of examinationsData) {
    const examDate = record.start_time ? new Date(record.start_time) : null;
    const exam = examDate ? {
      ...record,
      day: String(examDate.getDate()).padStart(2, "0"),
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(examDate).toUpperCase(),
      date: `${displayDate(record.start_time)} · ${record.start_time.slice(11, 16)}–${record.end_time.slice(11, 16)}`,
      venue: `${record.room_number} · ${record.building_code} · ${record.floor_label}`,
      updated: "Latest published version",
      status: record.test_data ? "DEMO TEST DATA" : "OFFICIAL SCHEDULE",
    } : record;
    const row = makeElement("article", "exam-row");
    const date = makeElement("div", "exam-row-date");
    date.append(makeElement("strong", "", exam.day));
    date.append(makeElement("small", "", exam.month));
    const details = makeElement("div", "exam-row-details");
    details.append(makeElement("h2", "", exam.title));
    details.append(makeElement("p", "", `${exam.date} · ${exam.venue}`));
    details.append(makeElement("p", "venue-updated", exam.updated));
    const status = makeElement("span", "exam-row-status", exam.status);
    row.append(date, details, status);
    container.append(row);
  }
}

function renderNotifications() {
  const container = document.querySelector("#notification-list");
  container.replaceChildren();
  container.setAttribute("aria-busy", "false");
  if (!notificationsData.length) {
    announceEmpty(container, "No notifications yet.");
    return;
  }
  for (const notification of notificationsData) {
    const unread = liveMode ? !notification.is_read : notification.unread;
    const item = makeElement("article", `notification-item${unread ? "" : " is-read"}`);
    item.append(makeElement("span", "unread-dot"));
    const body = makeElement("div");
    body.append(makeElement("h2", "", notification.title));
    body.append(makeElement("p", "", notification.body));
    body.append(makeElement("time", "", notification.date || displayDate(notification.created_at)));
    item.append(body);
    const markRead = makeElement("button", "", unread ? "✓" : "·");
    markRead.type = "button";
    markRead.setAttribute("aria-label", unread ? `Mark ${notification.title} as read` : `${notification.title} is read`);
    markRead.disabled = !notification.unread;
    markRead.addEventListener("click", () => {
      if (liveMode) {
        CampusApi.patch(`/api/v1/notifications/${notification.id}/read`)
          .then(() => { notification.is_read = true; updateUnreadCount(); renderNotifications(); })
          .catch(() => { body.append(makeElement("small", "", "Could not update read state.")); });
        return;
      }
      notification.unread = false;
      updateUnreadCount();
      renderNotifications();
    });
    item.append(markRead);
    container.append(item);
  }
}

function updateUnreadCount() {
  const count = notificationsData.filter((item) => liveMode ? !item.is_read : item.unread).length;
  document.querySelector(".header-notifications b").textContent = String(count);
  document.querySelector(".header-notifications").setAttribute("aria-label", `Open notifications, ${count} unread`);
  const navCount = document.querySelector(".student-nav-item[data-view='notifications'] i");
  navCount.textContent = String(count);
  navCount.hidden = count === 0;
}

function renderBuildingTabs() {
  const container = document.querySelector("#building-tabs");
  container.replaceChildren();
  for (const [key, building] of Object.entries(campus)) {
    const button = makeElement("button", "", key === "iet" ? "IET" : "Deeksha Bhawan");
    button.type = "button";
    button.setAttribute("aria-pressed", String(selectedBuilding === key));
    button.addEventListener("click", () => {
      selectedBuilding = key;
      selectedFloor = Object.keys(building.floors)[0];
      selectedRoom = null;
      renderMap();
    });
    container.append(button);
  }
}

function renderFloorTabs() {
  const container = document.querySelector("#floor-tabs");
  container.replaceChildren();
  for (const [key, floor] of Object.entries(campus[selectedBuilding].floors)) {
    const button = makeElement("button", "", floor.label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(selectedFloor === key));
    button.addEventListener("click", () => {
      selectedFloor = key;
      selectedRoom = null;
      renderMap();
    });
    container.append(button);
  }
}

function selectRoom(room, button) {
  selectedRoom = room;
  document.querySelectorAll(".blueprint-room").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  document.querySelector("#room-inspector-title").textContent = room.name.replace("†", "");
  document.querySelector("#room-inspector-location").textContent = `${campus[selectedBuilding].name} · ${campus[selectedBuilding].floors[selectedFloor].label}`;
  document.querySelector("#room-inspector-type").textContent = room.type.replace("†", "");
  document.querySelector("#room-inspector-capacity").textContent = room.capacity || "Not configured";
  document.querySelector("#room-inspector-use").textContent = room.use || "Not configured";
}

function renderMap() {
  renderBuildingTabs();
  renderFloorTabs();
  const building = campus[selectedBuilding];
  const floor = building.floors[selectedFloor];
  document.querySelector("#map-building-title").textContent = selectedBuilding === "iet" ? "IET" : "DEEKSHA BHAWAN";
  document.querySelector("#map-floor-title").textContent = floor.label.toUpperCase();
  document.querySelector("#blueprint-footnote").textContent = floor.note;
  const board = document.querySelector("#blueprint-board");
  board.replaceChildren();
  board.setAttribute("aria-label", `${building.name}, ${floor.label}, schematic floor plan`);
  for (const rowData of floor.rows) {
    const row = makeElement("div", "blueprint-row");
    for (const item of rowData) {
      if (item.gap) {
        const gap = makeElement("div", "blueprint-gap", item.gap);
        if (item.span) gap.style.gridColumn = `span ${item.span}`;
        row.append(gap);
        continue;
      }
      const room = makeElement("button", `blueprint-room${item.pending ? " is-pending" : ""}`);
      room.type = "button";
      room.style.gridColumn = `span ${item.span || 1}`;
      room.setAttribute("aria-pressed", "false");
      room.setAttribute("aria-label", `${item.name.replace("†", "")}, ${item.type}${item.pending ? ", verify room register" : ""}`);
      room.append(makeElement("strong", "", item.name));
      room.append(makeElement("small", "", item.type));
      room.addEventListener("click", () => selectRoom(item, room));
      row.append(room);
    }
    board.append(row);
    const corridor = makeElement("div", "blueprint-corridor", "CORRIDOR");
    board.append(corridor);
  }
  document.querySelector("#room-inspector-title").textContent = "Select a space";
  document.querySelector("#room-inspector-location").textContent = "Choose a labeled space on the plan.";
  document.querySelector("#room-inspector-type").textContent = "—";
  document.querySelector("#room-inspector-capacity").textContent = "Not configured";
  document.querySelector("#room-inspector-use").textContent = "Not configured";
}

function activateView(viewName) {
  document.querySelectorAll(".student-view").forEach((view) => {
    view.hidden = view.id !== `view-${viewName}`;
  });
  document.querySelectorAll(".student-nav-item").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const activeView = document.querySelector(`#view-${viewName}`);
  if (activeView) {
    document.title = `${activeView.dataset.title} · Student Demo | DDUGU Smart Campus`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelector("#student-sidebar").classList.remove("is-open");
  document.querySelector(".student-menu-toggle").setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".student-nav-item").forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});
document.querySelectorAll("[data-go-view]").forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.goView));
});
document.querySelector("[data-open-notifications]").addEventListener("click", () => activateView("notifications"));

const mobileMenu = document.querySelector(".student-menu-toggle");
mobileMenu.addEventListener("click", () => {
  const sidebar = document.querySelector("#student-sidebar");
  const isOpen = sidebar.classList.toggle("is-open");
  mobileMenu.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-label", isOpen ? "Close student navigation" : "Open student navigation");
});

document.querySelector("#mark-all-read").addEventListener("click", () => {
  if (!liveMode) {
    notificationsData.forEach((notification) => { notification.unread = false; });
    updateUnreadCount();
    renderNotifications();
    return;
  }
  Promise.all(notificationsData.filter((notification) => !notification.is_read).map((notification) =>
    CampusApi.patch(`/api/v1/notifications/${notification.id}/read`)
      .then(() => { notification.is_read = true; }),
  )).then(() => {
    updateUnreadCount();
    renderNotifications();
  }).catch((error) => {
    document.querySelector("#notification-list").prepend(makeElement("p", "empty-state", error.message));
  });
});

document.querySelector("#issue-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const status = document.querySelector("#issue-status");
  if (!liveMode) {
    status.textContent = "Demo only: report validated in this browser; nothing was sent or saved.";
    form.reset();
    return;
  }
  const submitBtn = form.querySelector(".submit-report");
  if (submitBtn) submitBtn.disabled = true;
  status.textContent = "Submitting your report…";
  try {
    const location = form.elements.location.value.trim();
    const title = `${form.elements.category.value}${location ? ` · ${location}` : ""}`.slice(0, 150);
    await CampusApi.post("/api/v1/student/issues", { title, description: form.elements.description.value.trim() });
    status.textContent = "Report submitted to campus administrators.";
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Could not submit report. Please try again.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

function renderStudentViews() {
  const todayRows = scheduleByDay[currentDay] || [];
  document.querySelector("#today-class-count").textContent = String(todayRows.length);
  document.querySelector("#new-notice-count").textContent = String(liveMode ? announcementsData.length : announcementsData.filter((notice) => notice.group === currentGroup).length);
  const profile = studentProfile || {
    display_name: "Demo Student",
    branch: demoStudent.branch,
    year: demoStudent.year,
    batch: demoStudent.batch,
    section: demoStudent.section,
    branch_name: "Computer Science and Engineering",
  };
  document.querySelector("#student-sidebar-name").textContent = liveMode ? profile.display_name : "Demo Student";
  const groupLabel = `${profile.branch} · Year ${profile.year} · Batch ${profile.batch} · Section ${profile.section || "—"}`;
  document.querySelector("#student-sidebar-group").textContent = groupLabel;
  document.querySelector(".student-group-label").textContent = groupLabel.replaceAll(" · ", " / ");
  document.querySelector("#student-avatar").textContent = liveMode ? profile.display_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "DS";
  document.querySelector("#profile-avatar").textContent = document.querySelector("#student-avatar").textContent;
  document.querySelector("#profile-name").textContent = liveMode ? profile.display_name : "Demo Student";
  document.querySelector("#profile-branch").textContent = `${profile.branch_name || "Computer Science and Engineering"} (${profile.branch})`;
  document.querySelector("#profile-year").textContent = `Year ${profile.year}`;
  document.querySelector("#profile-batch").textContent = String(profile.batch);
  document.querySelector("#profile-section").textContent = profile.section || "Not assigned";
  document.querySelector("#profile-student-id").textContent = liveMode ? "Protected by your account" : "Not included in demo";
  document.querySelector(".profile-demo-badge").hidden = liveMode;
  document.querySelector(".profile-summary > p").textContent = liveMode ? "Student · DDUGU Smart Campus" : "Student · DDUGU Smart Campus";
  document.querySelector(".student-footer").querySelector("a").textContent = liveMode ? "Sign out ↑" : "Return to public site ↑";
  const exam = examinationsData[0];
  document.querySelector("#exam-highlight").hidden = !exam;
  if (exam) {
    if (exam.start_time) {
      const examDate = new Date(exam.start_time);
      document.querySelector(".exam-date-block strong").textContent = String(examDate.getDate()).padStart(2, "0");
      document.querySelector(".exam-date-block small").textContent = new Intl.DateTimeFormat("en", { month: "short" }).format(examDate).toUpperCase();
      document.querySelector("#next-exam-date").textContent = displayDate(exam.start_time);
      document.querySelector("#next-exam-name").textContent = exam.title;
      document.querySelector("#exam-highlight-title").textContent = exam.title;
      document.querySelector("#exam-highlight-venue").textContent = `${exam.room_number} · ${exam.building_code}`;
      document.querySelector("#exam-highlight-copy").textContent = `Venue: ${exam.room_number}, ${exam.building_code}. Check the latest published schedule.`;
    } else {
      document.querySelector("#next-exam-date").textContent = exam.day ? `${exam.day} ${exam.month}` : "Demo";
      document.querySelector("#next-exam-name").textContent = exam.title;
    }
  } else {
    document.querySelector("#next-exam-date").textContent = "—";
    document.querySelector("#next-exam-name").textContent = "No upcoming exam";
  }
  renderSchedule(currentDay, "#today-schedule");
  renderWeekdayTabs();
  renderTimetable(selectedDay);
  renderExams();
  renderAnnouncements("#overview-notices", 2);
  renderAnnouncements("#announcement-list");
  renderNotifications();
  updateUnreadCount();
  renderMap();
}

function scheduleRowsByDay(rows) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grouped = {};
  for (const row of rows) {
    const day = days[row.day_of_week - 1];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({
      start: row.start_time.slice(0, 5),
      end: row.end_time.slice(0, 5),
      title: row.course_name,
      faculty: row.faculty_name || "Scheduled class",
      room: `${row.room_number} · ${row.building_code}`,
      test_data: row.test_data,
    });
  }
  return grouped;
}

function applyStudentProfile(profile) {
  studentProfile = {
    display_name: profile.display_name,
    branch: profile.branch_code,
    branch_name: profile.branch_name,
    year: profile.academic_year,
    batch: profile.batch_year,
    section: profile.section,
  };
  currentGroup = `${profile.branch_code}-${profile.academic_year}-${profile.section || ""}`;
  document.querySelector("#student-current-date").textContent = new Intl.DateTimeFormat("en", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date()).toUpperCase();
}

async function initializeStudentPortal() {
  if (demoMode) {
    document.body.classList.remove("auth-checking");
    renderStudentViews();
    return;
  }
  try {
    const session = await CampusApi.session();
    if (session.user.role !== "student") throw new Error("This session is not authorized for the Student portal.");
    const [profile, schedule, exams, notices, userNotifications] = await Promise.all([
      CampusApi.get("/api/v1/students/me"),
      CampusApi.get("/api/v1/students/timetable"),
      CampusApi.get("/api/v1/students/examinations"),
      CampusApi.get("/api/v1/announcements"),
      CampusApi.get("/api/v1/notifications"),
    ]);
    liveMode = true;
    applyStudentProfile(profile);
    scheduleByDay = scheduleRowsByDay(schedule);
    selectedDay = scheduleByDay[currentDay] ? currentDay : Object.keys(scheduleByDay)[0] || currentDay;
    examinationsData = exams;
    announcementsData = notices;
    notificationsData = userNotifications;
    document.title = "Student Portal | DDUGU Smart Campus";
    document.querySelector("#student-data-notice").hidden = true;
    document.querySelector("#student-mode-chip").hidden = true;
    document.body.classList.remove("auth-checking");
    document.body.classList.add("authenticated-portal");
    renderStudentViews();
  } catch (error) {
    window.location.replace(`portal-login.html?role=student&reason=${encodeURIComponent(error.message || "session")}`);
  }
}

document.querySelector("[data-student-logout]").addEventListener("click", async (event) => {
  if (!liveMode) return;
  event.preventDefault();
  try { await CampusApi.logout(); }
  finally { window.location.href = "index.html"; }
});

initializeStudentPortal();