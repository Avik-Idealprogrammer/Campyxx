(function initializeBookingRules(global) {
  function toMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function overlaps(start, end, otherStart, otherEnd) {
    return toMinutes(start) < toMinutes(otherEnd) && toMinutes(end) > toMinutes(otherStart);
  }

  function findRoomConflicts(bookings, { roomId, date, start, end, ignoreBookingId = null }) {
    return bookings.filter((booking) => booking.roomId === roomId
      && booking.date === date
      && booking.status !== "cancelled"
      && booking.id !== ignoreBookingId
      && overlaps(start, end, booking.start, booking.end));
  }

  function findScheduleConflicts(schedule, { date, start, end }) {
    return schedule.filter((entry) => entry.date === date && overlaps(start, end, entry.start, entry.end));
  }

  function findAlternativeSlots(bookings, schedule, request) {
    const duration = toMinutes(request.end) - toMinutes(request.start);
    const requestedStart = toMinutes(request.start);
    const opening = request.openingMinute ?? 8 * 60;
    const closing = request.closingMinute ?? 19 * 60;
    const step = request.stepMinutes ?? 30;
    const options = [];
    for (let startMinute = opening; startMinute + duration <= closing; startMinute += step) {
      const start = `${String(Math.floor(startMinute / 60)).padStart(2, "0")}:${String(startMinute % 60).padStart(2, "0")}`;
      const endMinute = startMinute + duration;
      const end = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
      if (start === request.start) continue;
      if (findRoomConflicts(bookings, { ...request, start, end }).length) continue;
      if (findScheduleConflicts(schedule, { date: request.date, start, end }).length) continue;
      options.push({ start, end, distance: Math.abs(startMinute - requestedStart) });
    }
    return options.sort((left, right) => left.distance - right.distance).slice(0, request.limit ?? 3);
  }

  const rules = { toMinutes, overlaps, findRoomConflicts, findScheduleConflicts, findAlternativeSlots };
  if (typeof module !== "undefined" && module.exports) module.exports = rules;
  global.CampusBookingRules = rules;
})(globalThis);