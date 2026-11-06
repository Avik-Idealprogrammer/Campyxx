const test = require("node:test");
const assert = require("node:assert/strict");
const { overlaps, findRoomConflicts, findScheduleConflicts, findAlternativeSlots } = require("../booking-rules.js");

test("adjacent bookings do not overlap", () => {
  assert.equal(overlaps("10:00", "11:00", "11:00", "12:00"), false);
  assert.equal(overlaps("11:00", "12:00", "10:00", "11:00"), false);
});

test("partial, enclosed, and identical intervals overlap", () => {
  assert.equal(overlaps("10:30", "11:30", "10:00", "11:00"), true);
  assert.equal(overlaps("10:15", "10:45", "10:00", "11:00"), true);
  assert.equal(overlaps("10:00", "11:00", "10:00", "11:00"), true);
});

test("room conflicts ignore cancelled and explicitly replaced bookings", () => {
  const bookings = [
    { id: "confirmed", roomId: "iet20", date: "2026-11-05", start: "10:00", end: "11:00", status: "confirmed" },
    { id: "cancelled", roomId: "iet20", date: "2026-11-05", start: "10:30", end: "11:30", status: "cancelled" },
    { id: "other-room", roomId: "iet19", date: "2026-11-05", start: "10:30", end: "11:30", status: "confirmed" },
  ];
  assert.deepEqual(findRoomConflicts(bookings, { roomId: "iet20", date: "2026-11-05", start: "10:30", end: "11:30" }).map((booking) => booking.id), ["confirmed"]);
  assert.deepEqual(findRoomConflicts(bookings, { roomId: "iet20", date: "2026-11-05", start: "10:30", end: "11:30", ignoreBookingId: "confirmed" }), []);
});

test("alternative slots exclude room and faculty conflicts and rank by proximity", () => {
  const bookings = [{ id: "busy", roomId: "iet20", date: "2026-11-05", start: "10:00", end: "11:00", status: "confirmed" }];
  const schedule = [{ date: "2026-11-05", start: "12:00", end: "13:00" }];
  const alternatives = findAlternativeSlots(bookings, schedule, {
    roomId: "iet20", date: "2026-11-05", start: "10:30", end: "11:30", openingMinute: 9 * 60, closingMinute: 14 * 60,
  });
  assert.deepEqual(alternatives.map(({ start }) => start), ["11:00", "09:00", "13:00"]);
  assert.deepEqual(findScheduleConflicts(schedule, { date: "2026-11-05", start: "12:30", end: "13:30" }), [schedule[0]]);
});