const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { Window } = require("happy-dom");

const root = path.resolve(__dirname, "..");

function loadPortal(page, scripts) {
  const window = new Window({ url: `http://localhost/${page}` });
  window.document.write(fs.readFileSync(path.join(root, page), "utf8"));
  window.fetch = async () => { throw new Error("Offline demo"); };
  window.confirm = () => true;
  window.alert = () => {};
  window.scrollTo = () => {};
  window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function close() { this.open = false; };
  for (const script of scripts) {
    window.eval(fs.readFileSync(path.join(root, script), "utf8"));
  }
  return window;
}

function submit(window, selector) {
  const form = window.document.querySelector(selector);
  assert.ok(form, `Expected form ${selector}`);
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

function selectValue(window, selector, value) {
  const select = window.document.querySelector(selector);
  assert.ok(select, `Expected select ${selector}`);
  select.value = value;
  select.dispatchEvent(new window.Event("change", { bubbles: true }));
}

test("Admin blocks conflicting booking approvals and approves valid requests", () => {
  const window = loadPortal("admin-portal.html", ["booking-rules.js", "admin-portal.js"]);
  selectValue(window, "#booking-status-filter", "pending");
  const rows = [...window.document.querySelectorAll("#all-bookings-table tbody tr")];
  const conflict = rows.find((row) => row.textContent.includes("Overlapping timetable request"));
  assert.ok(conflict);
  conflict.querySelector("button").click();
  assert.match(window.document.querySelector("#booking-action-status").textContent, /Approval blocked/);
  assert.match(conflict.textContent, /Pending/);

  const valid = rows.find((row) => row.textContent.includes("CSE assessment request"));
  assert.ok(valid);
  valid.querySelector("button").click();
  selectValue(window, "#booking-status-filter", "confirmed");
  assert.match(window.document.querySelector("#all-bookings-table").textContent, /CSE assessment request/);
  window.happyDOM.abort();
});

test("Admin CSV preview maps student identity and academic grouping", async () => {
  const window = loadPortal("admin-portal.html", ["booking-rules.js", "admin-portal.js"]);
  const file = new window.File(
    ["Student Name,Branch,Year,Batch,Section\nDemo Import,CSE,2,2024,A"],
    "students.csv",
    { type: "text/csv" },
  );
  const input = window.document.querySelector("#student-csv-file");
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  input.dispatchEvent(new window.Event("change"));
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.match(window.document.querySelector("#student-import-status").textContent, /1 rows mapped/);
  const preview = window.document.querySelector("#student-table").textContent;
  assert.match(preview, /Demo Import/);
  assert.match(preview, /CSE/);
  assert.match(preview, /2024/);
  window.happyDOM.abort();
});

test("Faculty revalidates room conflicts when confirming a booking", () => {
  const window = loadPortal("faculty-portal.html", ["booking-rules.js", "faculty-portal.js"]);
  window.document.querySelector("#search-start").value = "11:30";
  window.document.querySelector("#search-end").value = "12:30";
  submit(window, "#room-search-form");
  const result = [...window.document.querySelectorAll(".room-result")]
    .find((row) => row.querySelector("h3")?.textContent === "IET20");
  assert.ok(result);
  result.querySelector("button").click();
  window.document.querySelector("#booking-title").value = "CSE demo extra class";
  window.document.querySelector("#booking-start").value = "10:45";
  window.document.querySelector("#booking-end").value = "11:15";
  submit(window, "#booking-form");
  assert.match(window.document.querySelector("#booking-validation").textContent, /Conflict found/);
  assert.equal(window.document.querySelectorAll("#my-bookings-list .my-booking-card").length, 2);

  window.document.querySelector("#booking-start").value = "11:30";
  window.document.querySelector("#booking-end").value = "12:30";
  submit(window, "#booking-form");
  assert.match(window.document.querySelector("#booking-validation").textContent, /Confirmed in the local demo ledger/);
  assert.equal(window.document.querySelectorAll("#my-bookings-list .my-booking-card").length, 3);
  window.happyDOM.abort();
});

test("Student can navigate to the campus map and preview an issue report", () => {
  const window = loadPortal("student-portal.html", ["student-portal.js"]);
  window.document.querySelector(".student-nav-item[data-view='campus-map']").click();
  window.document.querySelector("#building-tabs button:nth-child(2)").click();
  assert.match(window.document.querySelector("#map-building-title").textContent, /DEEKSH/);

  window.document.querySelector(".student-nav-item[data-view='report-issue']").click();
  const form = window.document.querySelector("#issue-form");
  form.elements.category.value = "Incorrect classroom information";
  form.elements.description.value = "The displayed room is incorrect for the demo class.";
  submit(window, "#issue-form");
  assert.match(window.document.querySelector("#issue-status").textContent, /nothing was sent/);
  window.happyDOM.abort();
});