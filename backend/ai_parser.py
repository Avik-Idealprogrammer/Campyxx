import re
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

CAMPUS_TIMEZONE = ZoneInfo("Asia/Kolkata")
TIME_RANGE = re.compile(
    r"(?:between\s+|from\s+)?"
    r"(?P<start_hour>\d{1,2})(?::(?P<start_minute>\d{2}))?\s*(?P<start_period>am|pm)?"
    r"\s*(?:to|until|and|[-–])\s*"
    r"(?P<end_hour>\d{1,2})(?::(?P<end_minute>\d{2}))?\s*(?P<end_period>am|pm)?",
    re.IGNORECASE,
)
CAPACITY = re.compile(r"\b(\d{1,4})\s*(?:students|people|seats|attendees|capacity)\b", re.IGNORECASE)
NAMED_DATE = re.compile(r"\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b", re.IGNORECASE)
MONTHS = {name.lower(): index for index, name in enumerate(("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"), 1)}


def _to_24_hour(hour: int, minute: int, period: str | None) -> time | None:
    if minute > 59 or hour < 1 or hour > 12:
        return None
    if period:
        period = period.lower()
        hour = hour % 12
        if period == "pm":
            hour += 12
    elif hour < 8:
        return None
    return time(hour, minute)


def _parse_date(prompt: str, today: date) -> date:
    lowered = prompt.lower()
    if re.search(r"\btomorrow\b", lowered):
        return today + timedelta(days=1)
    if re.search(r"\btoday\b", lowered):
        return today
    match = NAMED_DATE.search(lowered)
    if not match:
        return today
    day = int(match.group(1))
    month_prefix = match.group(2).lower()[:3]
    month = next(number for name, number in MONTHS.items() if name[:3] == month_prefix)
    year = today.year
    candidate = date(year, month, day)
    if candidate < today and today.month == 12 and month == 1:
        candidate = date(year + 1, month, day)
    return candidate


def parse_query(user_prompt: str, now: datetime | None = None) -> dict:
    """Extract search constraints; this parser never decides room availability."""
    campus_now = (now or datetime.now(CAMPUS_TIMEZONE)).astimezone(CAMPUS_TIMEZONE)
    prompt = user_prompt.strip()
    lowered = prompt.lower()
    clarifications: list[str] = []

    capacity_match = CAPACITY.search(lowered)
    capacity = int(capacity_match.group(1)) if capacity_match else None
    if capacity is None:
        clarifications.append("capacity")

    building_code = None
    if re.search(r"\b(deeksha|bhawan|lh\d*)\b", lowered):
        building_code = "DEEKSHA"
    elif re.search(r"\biet\b", lowered):
        building_code = "IET"

    target_date = _parse_date(lowered, campus_now.date())
    match = TIME_RANGE.search(lowered)
    start_at = None
    end_at = None
    if not match:
        clarifications.append("time")
    else:
        start_hour = int(match.group("start_hour"))
        end_hour = int(match.group("end_hour"))
        start_period = match.group("start_period")
        end_period = match.group("end_period")
        if start_period is None and end_period is not None and start_hour <= 12:
            start_period = end_period
        start_time = _to_24_hour(start_hour, int(match.group("start_minute") or 0), start_period)
        end_time = _to_24_hour(end_hour, int(match.group("end_minute") or 0), end_period or start_period)
        if start_time is None or end_time is None:
            clarifications.append("time_period")
        else:
            start_at = datetime.combine(target_date, start_time, CAMPUS_TIMEZONE)
            end_date = target_date + timedelta(days=1) if end_time <= start_time else target_date
            end_at = datetime.combine(end_date, end_time, CAMPUS_TIMEZONE)

    if re.search(r"\b(lab|laboratory|practical)\b", lowered):
        room_type = "laboratory"
        purpose = "practical"
    elif re.search(r"\b(seminar hall|seminar|workshop|event)\b", lowered):
        room_type = "seminar_hall" if re.search(r"\b(seminar hall|seminar)\b", lowered) else None
        purpose = "event"
    elif re.search(r"\b(library)\b", lowered):
        room_type = "library"
        purpose = "examination" if "exam" in lowered else "lecture"
    elif re.search(r"\b(exam|examination|minor)\b", lowered):
        room_type = "classroom"
        purpose = "examination"
    else:
        room_type = "classroom" if "classroom" in lowered else None
        purpose = "extra_class" if re.search(r"\b(extra class|extra lecture)\b", lowered) else "lecture"

    return {
        "capacity": capacity,
        "building_code": building_code,
        "room_type": room_type,
        "purpose": purpose,
        "start_time": start_at,
        "end_time": end_at,
        "needs_clarification": clarifications,
    }