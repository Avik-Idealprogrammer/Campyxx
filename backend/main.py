import asyncio
import csv
import io
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, time, timedelta, timezone
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse
from jwt import InvalidTokenError
from psycopg.errors import ExclusionViolation
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import AsyncConnectionPool
from pwdlib import PasswordHash
from pydantic import BaseModel, ConfigDict, Field, model_validator
from redis.asyncio import Redis

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("campusflow")
CAMPUS_TZ = ZoneInfo("Asia/Kolkata")
SESSION_COOKIE = "campus_session"
password_hash = PasswordHash.recommended()


def get_setting(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)


def get_jwt_secret() -> str:
    secret = get_setting("JWT_SECRET", "") or ""
    if len(secret) < 32 or "generated-by" in secret or "replace" in secret.lower():
        raise RuntimeError("JWT_SECRET must be a unique random value of at least 32 characters")
    return secret


def app_environment() -> str:
    return get_setting("APP_ENV", "development") or "development"


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_url = get_setting("DATABASE_URL")
    redis_url = get_setting("REDIS_URL")
    if not database_url or not redis_url:
        raise RuntimeError("DATABASE_URL and REDIS_URL must be configured")
    get_jwt_secret()
    pool = AsyncConnectionPool(
        conninfo=database_url,
        min_size=1,
        max_size=int(get_setting("DB_POOL_SIZE", "10") or "10"),
        kwargs={"row_factory": dict_row},
        open=False,
    )
    await pool.open(wait=True)
    redis = Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=3)
    await redis.ping()
    app.state.db_pool = pool
    app.state.redis = redis
    if (get_setting("DEMO_SEED_USERS", "false") or "false").lower() == "true":
        await seed_demo_records(pool)
    yield
    await redis.aclose()
    await pool.close()


app = FastAPI(
    title="DDUGU Smart Campus API",
    description="Campus room coordination and academic updates API",
    version="1.0.0",
    docs_url="/docs" if app_environment() == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def rate_limit_api(request: Request, call_next):
    if not request.url.path.startswith("/api/"):
        return await call_next(request)
    redis: Redis = getattr(request.app.state, "redis", None)
    if redis is None:
        return JSONResponse(status_code=503, content={"detail": "Rate-limit service is unavailable"})
    remote_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")
    limit = 12 if request.url.path.endswith("/auth/login") else 180
    window = 60
    key = f"rate:{remote_ip}:{request.url.path}"
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, window)
    except Exception:
        logger.exception("Rate-limit check failed")
        return JSONResponse(status_code=503, content={"detail": "Rate-limit service is unavailable"})
    if count > limit:
        return JSONResponse(status_code=429, content={"detail": "Too many requests; try again shortly"})
    return await call_next(request)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class StudentRegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)
    display_name: str = Field(min_length=2, max_length=100)
    roll_number: str = Field(min_length=2, max_length=50)
    branch_code: str = Field(min_length=1, max_length=20)
    academic_year: int = Field(ge=1, le=4)
    batch_year: int = Field(ge=2000, le=2100)
    section: str | None = Field(default=None, max_length=5)


class FacultyRegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)
    display_name: str = Field(min_length=2, max_length=100)
    department_code: str | None = Field(default=None, max_length=20)


class AdminCreateUserRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)
    role: Literal["admin", "faculty", "student"]
    display_name: str = Field(min_length=2, max_length=100)
    branch_code: str | None = Field(default=None, max_length=20)
    roll_number: str | None = Field(default=None, max_length=50)
    academic_year: int | None = Field(default=None, ge=1, le=4)
    batch_year: int | None = Field(default=None, ge=2000, le=2100)
    section: str | None = Field(default=None, max_length=5)


class ScheduleCreateRequest(BaseModel):
    course_code: str = Field(min_length=2, max_length=50)
    course_name: str = Field(min_length=2, max_length=150)
    branch_code: str = Field(min_length=1, max_length=20)
    academic_year: int = Field(ge=1, le=4)
    section: str | None = Field(default=None, max_length=5)
    room_id: UUID
    faculty_id: UUID
    day_of_week: int = Field(ge=1, le=7)
    start_time: str = Field(pattern=r"^\d{1,2}:\d{2}(:\d{2})?$")
    end_time: str = Field(pattern=r"^\d{1,2}:\d{2}(:\d{2})?$")


class StudentImportRow(BaseModel):
    roll_number: str = Field(min_length=1, max_length=50)
    display_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    branch_code: str = Field(min_length=1, max_length=20)
    academic_year: int = Field(ge=1, le=4)
    batch_year: int = Field(ge=2000, le=2100)
    section: str | None = Field(default=None, max_length=5)


class StudentBatchImportRequest(BaseModel):
    students: list[StudentImportRow]


class RoomSearchQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")
    building_code: str | None = Field(default=None, max_length=20)
    floor_number: int | None = Field(default=None, ge=0, le=10)
    capacity: int = Field(gt=0, le=2000)
    start_time: datetime
    end_time: datetime
    room_type: Literal["classroom", "laboratory", "seminar_hall", "library"] | None = None
    purpose: Literal["lecture", "extra_class", "examination", "practical", "event"]

    @model_validator(mode="after")
    def validate_interval(self):
        if self.start_time.utcoffset() is None or self.end_time.utcoffset() is None:
            raise ValueError("start_time and end_time must include a timezone")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must precede end_time")
        if self.end_time - self.start_time > timedelta(hours=12):
            raise ValueError("booking duration cannot exceed 12 hours")
        return self


class BookingCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    room_id: UUID
    title: str = Field(min_length=3, max_length=150)
    purpose: Literal["lecture", "extra_class", "examination", "practical", "event"]
    target_branch_code: str | None = Field(default=None, max_length=20)
    target_year: int | None = Field(default=None, ge=1, le=4)
    target_section: str | None = Field(default=None, max_length=5)
    attendee_count: int | None = Field(default=None, gt=0, le=2000)
    start_time: datetime
    end_time: datetime
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_interval(self):
        validate_datetime_range(self.start_time, self.end_time)
        return self


class RescheduleRequest(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_interval(self):
        validate_datetime_range(self.start_time, self.end_time)
        return self


class ReviewRequest(BaseModel):
    decision: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=500)


class IssueCreateRequest(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=2000)
    room_id: UUID | None = None


class IssueUpdateRequest(BaseModel):
    status: Literal["open", "investigating", "resolved"]
    resolution_notes: str | None = Field(default=None, max_length=2000)


class AnnouncementCreateRequest(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    body: str = Field(min_length=10, max_length=10000)
    category: str = Field(default="general", max_length=50)
    is_public: bool = False
    target_branch_code: str | None = Field(default=None, max_length=20)
    target_year: int | None = Field(default=None, ge=1, le=4)
    target_section: str | None = Field(default=None, max_length=5)
    is_urgent: bool = False


class RoomUpdateRequest(BaseModel):
    room_number: str | None = Field(default=None, min_length=2, max_length=30)
    name: str | None = Field(default=None, min_length=2, max_length=100)
    capacity: int | None = Field(default=None, gt=0, le=2000)
    capacity_source: str | None = Field(default=None, max_length=60)
    permitted_uses: list[Literal["lecture", "extra_class", "examination", "practical", "event"]] | None = None
    is_active: bool | None = None
    is_verified: bool | None = None
    room_type: Literal["classroom", "laboratory", "seminar_hall", "library", "office"] | None = None


class RoomCreateRequest(BaseModel):
    floor_id: UUID
    room_number: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=2, max_length=100)
    room_type: Literal["classroom", "laboratory", "seminar_hall", "library", "office"]
    capacity: int | None = Field(default=None, gt=0, le=2000)
    capacity_source: str = Field(default="admin_configured", max_length=60)
    permitted_uses: list[Literal["lecture", "extra_class", "examination", "practical", "event"]] = Field(default_factory=list)
    is_active: bool = True
    is_verified: bool = False


class SettingsUpdateRequest(BaseModel):
    require_exam_approval: bool
    require_event_approval: bool
    advance_booking_days: int = Field(ge=1, le=365)
    cancellation_notice_hours: int = Field(ge=0, le=168)


class FacultyPermissionsRequest(BaseModel):
    is_active: bool | None = None
    can_book: bool | None = None
    can_view_schedule: bool | None = None


def validate_datetime_range(start_time: datetime, end_time: datetime) -> None:
    if start_time.utcoffset() is None or end_time.utcoffset() is None:
        raise ValueError("start_time and end_time must include a timezone")
    if start_time >= end_time:
        raise ValueError("start_time must precede end_time")
    if end_time - start_time > timedelta(hours=12):
        raise ValueError("booking duration cannot exceed 12 hours")


async def seed_demo_records(pool: AsyncConnectionPool) -> None:
    accounts = [
        ("admin", "DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD", "Demo Administrator"),
        ("faculty", "DEMO_FACULTY_EMAIL", "DEMO_FACULTY_PASSWORD", "Demo Faculty"),
        ("student", "DEMO_STUDENT_EMAIL", "DEMO_STUDENT_PASSWORD", "Demo Student"),
    ]
    for role, email_key, password_key, _display_name in accounts:
        if not get_setting(email_key) or not get_setting(password_key):
            raise RuntimeError(f"{email_key} and {password_key} are required when DEMO_SEED_USERS=true")
        if len(get_setting(password_key, "") or "") < 16:
            raise RuntimeError(f"{password_key} must contain at least 16 characters")

    async with pool.connection() as conn:
        async with conn.transaction():
            branch = await (await conn.execute("SELECT id FROM branches WHERE code = 'CSE'")).fetchone()
            if not branch:
                raise RuntimeError("CSE branch is missing; database seed did not run")
            demo_user_ids = {}
            for role, email_key, password_key, display_name in accounts:
                email = (get_setting(email_key) or "").lower()
                encoded = password_hash.hash(get_setting(password_key) or "")
                user = await (await conn.execute(
                    """INSERT INTO users (email, password_hash, role)
                       VALUES (%s, %s, %s)
                       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash,
                         role = EXCLUDED.role, is_active = TRUE
                       RETURNING id""",
                    (email, encoded, role),
                )).fetchone()
                demo_user_ids[role] = user["id"]
                if role == "faculty":
                    await conn.execute(
                        """INSERT INTO faculty (user_id, display_name, department_id)
                           VALUES (%s, %s, %s)
                           ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name,
                             department_id = EXCLUDED.department_id""",
                        (user["id"], display_name, branch["id"]),
                    )
                if role == "student":
                    await conn.execute(
                        """INSERT INTO students (user_id, display_name, roll_number, branch_id, academic_year, batch_year, section)
                           VALUES (%s, %s, 'DEMO-CSE-2A-001', %s, 2, 2024, 'A')
                           ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name,
                             branch_id = EXCLUDED.branch_id, academic_year = EXCLUDED.academic_year,
                             batch_year = EXCLUDED.batch_year, section = EXCLUDED.section""",
                        (user["id"], display_name, branch["id"]),
                    )

            faculty = await (await conn.execute("SELECT id FROM faculty WHERE user_id = %s", (demo_user_ids["faculty"],))).fetchone()
            iet20 = await (await conn.execute("SELECT id FROM rooms WHERE room_number = 'IET20'")).fetchone()
            if faculty and iet20:
                await conn.execute(
                    """INSERT INTO master_schedule
                       (course_code, course_name, branch_id, academic_year, section, room_id, faculty_id, day_of_week, start_time, end_time, test_data)
                       SELECT 'DEMO-CSE-201', 'Algorithms · CSE Year 2 A', %s, 2, 'A', %s, %s, 4, '09:00', '10:00', TRUE
                       WHERE NOT EXISTS (SELECT 1 FROM master_schedule WHERE course_code = 'DEMO-CSE-201' AND test_data)""",
                    (branch["id"], iet20["id"], faculty["id"]),
                )
                await conn.execute(
                    """INSERT INTO bookings (room_id, faculty_id, title, purpose, target_branch_id, target_year, target_section,
                         attendee_count, start_time, end_time, status, test_data)
                       SELECT %s, %s, 'Demo CSE extra lecture', 'extra_class', %s, 2, 'A', 60,
                         '2026-11-06 13:00:00+05:30', '2026-11-06 14:00:00+05:30', 'approved', TRUE
                       WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE title = 'Demo CSE extra lecture' AND test_data)""",
                    (iet20["id"], faculty["id"], branch["id"]),
                )

            public_notice = await (await conn.execute(
                "SELECT id FROM announcements WHERE title = 'Smart Campus pilot preview'"
            )).fetchone()
            if not public_notice:
                await conn.execute(
                    """INSERT INTO announcements (title, body, category, is_public, status, test_data, created_by, published_at)
                       VALUES ('Smart Campus pilot preview',
                         'This is a fictional demo announcement. Official public notices will appear here after administrator review.',
                         'general', TRUE, 'published', TRUE, %s, now())""",
                    (demo_user_ids["admin"],),
                )
            targeted_notice = await (await conn.execute(
                "SELECT id FROM announcements WHERE title = 'NSS minor examination venue · demo'"
            )).fetchone()
            if not targeted_notice:
                await conn.execute(
                    """INSERT INTO announcements (title, body, category, is_public, target_branch_id, target_year,
                         target_section, status, test_data, created_by, published_at)
                       VALUES ('NSS minor examination venue · demo',
                         'Test notice only: the sample exam venue is LH03, Deeksha Bhawan. Confirm real exam arrangements with the university.',
                         'examination', FALSE, %s, 2, 'A', 'published', TRUE, %s, now())""",
                    (branch["id"], demo_user_ids["admin"]),
                )
            await conn.execute(
                """INSERT INTO news (headline, image_url, body, is_demo, published_at)
                   SELECT 'Ideas grow when campus comes together', '/assets/campus-ideas.webp',
                     'Illustrative demo campus story.', TRUE, now()
                   WHERE NOT EXISTS (SELECT 1 FROM news WHERE headline = 'Ideas grow when campus comes together')"""
            )
            await conn.execute(
                """INSERT INTO activities (title, image_url, description, is_demo)
                   SELECT 'IET TechSphere', '/assets/campus-ideas.webp',
                     'Illustrative demo activity. Replace with approved campus material.', TRUE
                   WHERE NOT EXISTS (SELECT 1 FROM activities WHERE title = 'IET TechSphere')"""
            )


async def get_db_pool(request: Request) -> AsyncConnectionPool:
    return request.app.state.db_pool


def create_session_token(user_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user_id), "iat": now, "exp": now + timedelta(hours=8)},
        get_jwt_secret(),
        algorithm="HS256",
    )


async def current_user(request: Request, pool: AsyncConnectionPool = Depends(get_db_pool)) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
        user_id = UUID(payload["sub"])
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Session is invalid or expired") from None
    async with pool.connection() as conn:
        user = await (await conn.execute(
            """SELECT u.id, u.email, u.role,
                      COALESCE(s.display_name, f.display_name, u.email) AS display_name
               FROM users u
               LEFT JOIN students s ON s.user_id = u.id
               LEFT JOIN faculty f ON f.user_id = u.id
               WHERE u.id = %s AND u.is_active = TRUE""",
            (user_id,),
        )).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Account is inactive")
    return user


def require_roles(*roles: str):
    async def dependency(user: dict = Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission for this action")
        return user
    return dependency


def set_session_cookie(response: Response, token: str) -> None:
    secure = (get_setting("COOKIE_SECURE", "true" if app_environment() == "production" else "false") or "false").lower() == "true"
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=8 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite="strict",
        path="/",
    )


async def write_audit(conn, actor_id: UUID | None, action: str, entity_type: str, entity_id: UUID | None, details: dict) -> None:
    await conn.execute(
        """INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
           VALUES (%s, %s, %s, %s, %s)""",
        (actor_id, action, entity_type, entity_id, Jsonb(details)),
    )


async def get_faculty_id(conn, user_id: UUID, *, require_booking: bool = False, require_schedule: bool = False) -> UUID:
    row = await (await conn.execute(
        "SELECT id, can_book, can_view_schedule FROM faculty WHERE user_id = %s",
        (user_id,),
    )).fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Faculty profile is not configured")
    if require_booking and not row["can_book"]:
        raise HTTPException(status_code=403, detail="Faculty booking permission is disabled")
    if require_schedule and not row["can_view_schedule"]:
        raise HTTPException(status_code=403, detail="Faculty schedule access is disabled")
    return row["id"]


async def get_student(conn, user_id: UUID) -> dict:
    row = await (await conn.execute(
        """SELECT s.id, s.display_name, s.roll_number, s.academic_year, s.batch_year, s.section,
                  b.id AS branch_id, b.code AS branch_code, b.name AS branch_name
           FROM students s JOIN branches b ON b.id = s.branch_id WHERE s.user_id = %s""",
        (user_id,),
    )).fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Student profile is not configured")
    return row


def local_booking_times(start_time: datetime, end_time: datetime) -> tuple[datetime, datetime]:
    start_local = start_time.astimezone(CAMPUS_TZ)
    end_local = end_time.astimezone(CAMPUS_TZ)
    if start_local.date() != end_local.date():
        raise HTTPException(status_code=422, detail="Bookings must start and end on the same campus day")
    if start_local <= datetime.now(CAMPUS_TZ):
        raise HTTPException(status_code=422, detail="Bookings must be in the future")
    return start_local, end_local


async def room_and_schedule_blocker(
    conn,
    *,
    room: dict,
    faculty_id: UUID,
    start_time: datetime,
    end_time: datetime,
    purpose: str,
    attendee_count: int | None,
    target_branch_id: UUID | None,
    target_year: int | None,
    target_section: str | None,
    ignore_booking_id: UUID | None = None,
) -> str | None:
    if not room["is_active"]:
        return "This room is restricted or disabled"
    if not room["is_verified"]:
        return "This room requires room-register verification"
    if room_use_for(purpose) not in room["permitted_uses"]:
        return f"{purpose} is not permitted in {room['room_number']}"
    if room["capacity"] is None:
        return f"Capacity for {room['room_number']} is not configured"
    if attendee_count and attendee_count > room["capacity"]:
        return f"Requested attendance exceeds {room['room_number']} capacity"

    overlap = await (await conn.execute(
        """SELECT id FROM bookings
           WHERE room_id = %s AND status IN ('pending', 'approved')
             AND start_time < %s AND end_time > %s
             AND (%s::uuid IS NULL OR id <> %s::uuid)
           LIMIT 1""",
        (room["id"], end_time, start_time, ignore_booking_id, ignore_booking_id),
    )).fetchone()
    if overlap:
        return f"{room['room_number']} has an overlapping reservation"

    local_start, local_end = local_booking_times(start_time, end_time)
    schedule = await (await conn.execute(
        """SELECT course_name FROM master_schedule
           WHERE day_of_week = %s AND start_time < %s AND end_time > %s
             AND (faculty_id = %s OR room_id = %s OR
               (%s::uuid IS NOT NULL AND branch_id = %s::uuid AND academic_year = %s
                 AND COALESCE(section, '') = COALESCE(%s, '')))
           LIMIT 1""",
        (
            local_start.isoweekday(), local_end.time().replace(tzinfo=None), local_start.time().replace(tzinfo=None),
            faculty_id, room["id"], target_branch_id, target_branch_id, target_year, target_section,
        ),
    )).fetchone()
    if schedule:
        return f"The request conflicts with scheduled class {schedule['course_name']}"
    return None


async def alternative_rooms(conn, *, room_id: UUID, capacity: int | None, purpose: str, start_time: datetime, end_time: datetime) -> list[dict]:
    if not capacity:
        return []
    candidates = await (await conn.execute(
        """SELECT r.id, r.room_number, r.capacity, b.code AS building_code
           FROM rooms r JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
           WHERE r.id <> %s AND r.is_active AND r.is_verified AND r.capacity >= %s
             AND %s = ANY(r.permitted_uses)
           ORDER BY r.capacity ASC NULLS LAST, b.code, r.room_number LIMIT 30""",
        (room_id, capacity, room_use_for(purpose)),
    )).fetchall()
    suggestions = []
    for candidate in candidates:
        conflict = await (await conn.execute(
            """SELECT 1 FROM bookings WHERE room_id = %s AND status IN ('pending', 'approved')
               AND start_time < %s AND end_time > %s LIMIT 1""",
            (candidate["id"], end_time, start_time),
        )).fetchone()
        if not conflict:
            suggestions.append({
                "room_id": str(candidate["id"]),
                "room_number": candidate["room_number"],
                "building_code": candidate["building_code"],
                "capacity": candidate["capacity"],
                "availability_verified": True,
            })
        if len(suggestions) == 3:
            break
    return suggestions


@app.get("/health", tags=["System"])
async def health(request: Request):
    try:
        async with request.app.state.db_pool.connection() as conn:
            await conn.execute("SELECT 1")
        await request.app.state.redis.ping()
    except Exception:
        logger.exception("Health check failed")
        raise HTTPException(status_code=503, detail="A required service is unavailable") from None
    return {"status": "healthy", "service": "ddugu-smart-campus-api"}


@app.get("/api/v1/branches", tags=["Academic"])
async def list_branches(pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            "SELECT id, code, name, approximate_students, has_sections FROM branches ORDER BY code"
        )).fetchall()
    return rows


@app.post("/api/v1/auth/login", tags=["Authentication"])
async def login(payload: LoginRequest, response: Response, pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        user = await (await conn.execute(
            """SELECT u.id, u.email, u.role, u.password_hash,
                      COALESCE(s.display_name, f.display_name, u.email) AS display_name
               FROM users u
               LEFT JOIN students s ON s.user_id = u.id
               LEFT JOIN faculty f ON f.user_id = u.id
               WHERE lower(u.email) = lower(%s) AND u.is_active = TRUE""",
            (payload.email.strip(),),
        )).fetchone()
    if not user or not password_hash.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    set_session_cookie(response, create_session_token(user["id"]))
    return {"user": {"id": str(user["id"]), "email": user["email"], "role": user["role"], "display_name": user["display_name"]}}


@app.post("/api/v1/auth/register/student", status_code=201, tags=["Authentication"])
async def register_student(payload: StudentRegisterRequest, response: Response, pool: AsyncConnectionPool = Depends(get_db_pool)):
    email_clean = payload.email.strip().lower()
    roll_clean = payload.roll_number.strip().upper()
    async with pool.connection() as conn:
        async with conn.transaction():
            existing_user = await (await conn.execute(
                "SELECT id FROM users WHERE lower(email) = lower(%s)", (email_clean,)
            )).fetchone()
            if existing_user:
                raise HTTPException(status_code=409, detail="An account with this email address already exists")

            existing_student = await (await conn.execute(
                "SELECT id FROM students WHERE upper(roll_number) = %s", (roll_clean,)
            )).fetchone()
            if existing_student:
                raise HTTPException(status_code=409, detail="A student with this roll number is already registered")

            branch = await (await conn.execute(
                "SELECT id FROM branches WHERE upper(code) = %s", (payload.branch_code.strip().upper(),)
            )).fetchone()
            if not branch:
                raise HTTPException(status_code=422, detail="Selected branch does not exist")

            pw_hash = password_hash.hash(payload.password)
            user = await (await conn.execute(
                """INSERT INTO users (email, password_hash, role)
                   VALUES (%s, %s, 'student') RETURNING id""",
                (email_clean, pw_hash),
            )).fetchone()

            sec = payload.section.strip().upper() if payload.section else None
            await conn.execute(
                """INSERT INTO students (user_id, display_name, roll_number, branch_id, academic_year, batch_year, section)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (user["id"], payload.display_name.strip(), roll_clean, branch["id"], payload.academic_year, payload.batch_year, sec),
            )

            await write_audit(conn, user["id"], "STUDENT_REGISTER", "user", user["id"], {
                "roll_number": roll_clean, "branch": payload.branch_code.strip().upper()
            })

    set_session_cookie(response, create_session_token(user["id"]))
    return {"user": {"id": str(user["id"]), "email": email_clean, "role": "student", "display_name": payload.display_name.strip()}}


@app.post("/api/v1/auth/register/faculty", status_code=201, tags=["Authentication"])
async def register_faculty(payload: FacultyRegisterRequest, response: Response, pool: AsyncConnectionPool = Depends(get_db_pool)):
    email_clean = payload.email.strip().lower()
    async with pool.connection() as conn:
        async with conn.transaction():
            existing_user = await (await conn.execute(
                "SELECT id FROM users WHERE lower(email) = lower(%s)", (email_clean,)
            )).fetchone()
            if existing_user:
                raise HTTPException(status_code=409, detail="An account with this email address already exists")

            dept_id = None
            if payload.department_code:
                dept = await (await conn.execute(
                    "SELECT id FROM branches WHERE upper(code) = %s", (payload.department_code.strip().upper(),)
                )).fetchone()
                if not dept:
                    raise HTTPException(status_code=422, detail="Selected department does not exist")
                dept_id = dept["id"]

            pw_hash = password_hash.hash(payload.password)
            user = await (await conn.execute(
                """INSERT INTO users (email, password_hash, role)
                   VALUES (%s, %s, 'faculty') RETURNING id""",
                (email_clean, pw_hash),
            )).fetchone()

            await conn.execute(
                """INSERT INTO faculty (user_id, display_name, department_id, can_book, can_view_schedule)
                   VALUES (%s, %s, %s, TRUE, TRUE)""",
                (user["id"], payload.display_name.strip(), dept_id),
            )

            await write_audit(conn, user["id"], "FACULTY_REGISTER", "user", user["id"], {
                "email": email_clean, "department": payload.department_code
            })

    set_session_cookie(response, create_session_token(user["id"]))
    return {"user": {"id": str(user["id"]), "email": email_clean, "role": "faculty", "display_name": payload.display_name.strip()}}


@app.post("/api/v1/auth/logout", tags=["Authentication"])
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="strict")
    return {"status": "signed_out"}


@app.get("/api/v1/auth/me", tags=["Authentication"])
async def session_user(user: dict = Depends(current_user)):
    return {"user": {"id": str(user["id"]), "email": user["email"], "role": user["role"], "display_name": user.get("display_name", user["email"])}}


@app.get("/public/announcements", tags=["Public content"])
async def public_announcements(limit: Annotated[int, Query(ge=1, le=20)] = 5, pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT title, body, published_at FROM announcements
               WHERE is_public = TRUE AND status = 'published' AND published_at <= now()
               ORDER BY published_at DESC LIMIT %s""",
            (limit,),
        )).fetchall()
    return [{"title": row["title"], "body": row["body"], "published_at": row["published_at"]} for row in rows]


@app.get("/public/news", tags=["Public content"])
async def public_news(limit: Annotated[int, Query(ge=1, le=12)] = 6, pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            "SELECT headline, image_url, body, published_at, is_demo FROM news WHERE published_at IS NOT NULL ORDER BY published_at DESC LIMIT %s",
            (limit,),
        )).fetchall()
    return [{"headline": row["headline"], "image_url": row["image_url"], "body": row["body"], "published_at": row["published_at"], "is_demo": row["is_demo"]} for row in rows]


@app.get("/public/activities", tags=["Public content"])
async def public_activities(limit: Annotated[int, Query(ge=1, le=12)] = 6, pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            "SELECT title, image_url, description, is_demo FROM activities ORDER BY created_at DESC LIMIT %s",
            (limit,),
        )).fetchall()
    return [{"title": row["title"], "image_url": row["image_url"], "description": row["description"], "is_demo": row["is_demo"]} for row in rows]


@app.get("/api/v1/campus/buildings", tags=["Campus"])
async def list_buildings(_user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT b.id, b.code, b.name, b.distance_meters, b.map_position,
                      COALESCE(jsonb_agg(jsonb_build_object('id', f.id, 'number', f.floor_number, 'label', f.floor_label)
                        ORDER BY f.floor_number) FILTER (WHERE f.id IS NOT NULL), '[]'::jsonb) AS floors
               FROM buildings b LEFT JOIN floors f ON f.building_id = b.id
               GROUP BY b.id ORDER BY b.code"""
        )).fetchall()
    return rows


@app.get("/api/v1/rooms", tags=["Rooms"])
async def list_rooms(_user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT r.id, r.room_number, r.name, r.room_type, r.capacity, r.capacity_source,
                      r.permitted_uses, r.is_active, r.is_verified, r.map_position,
                      f.id AS floor_id, f.floor_number, f.floor_label,
                      b.id AS building_id, b.code AS building_code, b.name AS building_name
               FROM rooms r JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
               ORDER BY b.code, f.floor_number, r.room_number"""
        )).fetchall()
    return rows


@app.post("/api/v1/rooms/search", tags=["Rooms"])
async def search_rooms(query: RoomSearchQuery, user: dict = Depends(require_roles("admin", "faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    filters = []
    params: list = []
    if query.building_code:
        filters.append("b.code = %s")
        params.append(query.building_code.upper())
    if query.floor_number is not None:
        filters.append("f.floor_number = %s")
        params.append(query.floor_number)
    if query.room_type:
        filters.append("r.room_type = %s")
        params.append(query.room_type)
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            f"""SELECT r.id, r.room_number, r.name, r.room_type, r.capacity, r.capacity_source,
                       r.permitted_uses, r.is_active, r.is_verified, f.floor_number, f.floor_label,
                       b.code AS building_code, b.name AS building_name
                FROM rooms r JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
                {where} ORDER BY b.code, f.floor_number, r.room_number""",
            params,
        )).fetchall()
        ids = [row["id"] for row in rows]
        occupied = set()
        if ids:
            conflicts = await (await conn.execute(
                """SELECT DISTINCT room_id FROM bookings WHERE room_id = ANY(%s)
                   AND status IN ('pending', 'approved') AND start_time < %s AND end_time > %s""",
                (ids, query.end_time, query.start_time),
            )).fetchall()
            occupied = {row["room_id"] for row in conflicts}
        faculty_conflict = None
        if user["role"] == "faculty":
            faculty_id = await get_faculty_id(conn, user["id"], require_booking=True)
            local_start = query.start_time.astimezone(CAMPUS_TZ)
            local_end = query.end_time.astimezone(CAMPUS_TZ)
            faculty_conflict = await (await conn.execute(
                """SELECT course_name FROM master_schedule WHERE faculty_id = %s AND day_of_week = %s
                   AND start_time < %s AND end_time > %s LIMIT 1""",
                (faculty_id, local_start.isoweekday(), local_end.time().replace(tzinfo=None), local_start.time().replace(tzinfo=None)),
            )).fetchone()
    result = []
    for row in rows:
        if not row["is_active"] or not row["is_verified"]:
            room_status, reason = "restricted", "Room is disabled or not verified"
        elif row["capacity"] is None:
            room_status, reason = "restricted", "Capacity needs configuration"
        elif row["capacity"] < query.capacity:
            room_status, reason = "restricted", "Configured capacity is too small"
        elif room_use_for(query.purpose) not in row["permitted_uses"]:
            room_status, reason = "restricted", "Purpose is not permitted"
        elif row["id"] in occupied:
            room_status, reason = "occupied", "Overlapping reservation exists"
        elif faculty_conflict:
            room_status, reason = "occupied", f"Conflicts with your scheduled class: {faculty_conflict['course_name']}"
        else:
            room_status, reason = "available", "Validated against current booking records"
        result.append({
            "id": row["id"], "room_number": row["room_number"], "name": row["name"],
            "room_type": row["room_type"], "capacity": row["capacity"], "capacity_source": row["capacity_source"],
            "permitted_uses": row["permitted_uses"], "floor_number": row["floor_number"],
            "floor_label": row["floor_label"], "building_code": row["building_code"],
            "building_name": row["building_name"], "status": room_status, "reason": reason,
        })
    return {"query_parameters": query.model_dump(), "total": len(result), "rooms": result, "test_data": app_environment() != "production"}


async def get_room(conn, room_id: UUID, *, lock: bool = False) -> dict:
    suffix = " FOR UPDATE OF r" if lock else ""
    room = await (await conn.execute(
        f"""SELECT r.*, f.floor_number, f.floor_label, b.code AS building_code, b.name AS building_name
            FROM rooms r JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
            WHERE r.id = %s{suffix}""",
        (room_id,),
    )).fetchone()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


def get_booking_policy(row: dict, purpose: str) -> bool:
    return row["require_exam_approval"] if purpose == "examination" else row["require_event_approval"] if purpose == "event" else False


def room_use_for(purpose: str) -> str:
    return "lecture" if purpose == "extra_class" else purpose


async def check_schedule_conflict(conn, *, faculty_id: UUID, room_id: UUID, start_time: datetime, end_time: datetime, branch_id: UUID | None, year: int | None, section: str | None) -> str | None:
    local_start = start_time.astimezone(CAMPUS_TZ)
    local_end = end_time.astimezone(CAMPUS_TZ)
    if local_start.date() != local_end.date():
        return "Bookings must remain within one campus day"
    row = await (await conn.execute(
        """SELECT course_name FROM master_schedule
           WHERE day_of_week = %s AND start_time < %s AND end_time > %s
             AND (faculty_id = %s OR room_id = %s OR
               (%s::uuid IS NOT NULL AND branch_id = %s::uuid AND academic_year = %s
                 AND COALESCE(section, '') = COALESCE(%s, '')))
           LIMIT 1""",
        (
            local_start.isoweekday(), local_end.time().replace(tzinfo=None), local_start.time().replace(tzinfo=None),
            faculty_id, room_id, branch_id, branch_id, year, section,
        ),
    )).fetchone()
    return f"Conflicts with scheduled class {row['course_name']}" if row else None


async def insert_booking(conn, *, actor: dict, faculty_id: UUID, room: dict, title: str, purpose: str,
                         start_time: datetime, end_time: datetime, attendee_count: int | None,
                         branch_id: UUID | None, year: int | None, section: str | None, notes: str | None):
    local_start, local_end = start_time.astimezone(CAMPUS_TZ), end_time.astimezone(CAMPUS_TZ)
    now_local = datetime.now(CAMPUS_TZ)
    if local_start <= now_local:
        raise HTTPException(status_code=422, detail="Bookings must start in the future")
    policy = await (await conn.execute("SELECT * FROM booking_policies WHERE id = 1")).fetchone()
    if local_start.date() > (now_local + timedelta(days=policy["advance_booking_days"])).date():
        raise HTTPException(status_code=422, detail="Requested date exceeds the advance booking limit")
    if not room["is_active"] or not room["is_verified"]:
        raise HTTPException(status_code=422, detail="Room is disabled or not verified")
    if room_use_for(purpose) not in room["permitted_uses"]:
        raise HTTPException(status_code=422, detail=f"{purpose} is not permitted in {room['room_number']}")
    if room["capacity"] is None:
        raise HTTPException(status_code=422, detail="Room capacity is not configured")
    if attendee_count and attendee_count > room["capacity"]:
        raise HTTPException(status_code=422, detail="Requested attendance exceeds room capacity")
    scheduled_conflict = await check_schedule_conflict(
        conn, faculty_id=faculty_id, room_id=room["id"], start_time=start_time, end_time=end_time,
        branch_id=branch_id, year=year, section=section,
    )
    if scheduled_conflict:
        raise HTTPException(status_code=409, detail={"error": "SCHEDULE_CONFLICT", "message": scheduled_conflict})
    overlap = await (await conn.execute(
        """SELECT id FROM bookings WHERE room_id = %s AND status IN ('pending', 'approved')
           AND start_time < %s AND end_time > %s LIMIT 1""",
        (room["id"], end_time, start_time),
    )).fetchone()
    if overlap:
        alternatives = await alternative_rooms(
            conn, room_id=room["id"], capacity=attendee_count,
            purpose=purpose, start_time=start_time, end_time=end_time,
        )
        raise HTTPException(status_code=409, detail={
            "error": "ROOM_CONFLICT", "message": f"{room['room_number']} is already reserved during this period",
            "suggested_alternatives": alternatives,
        })
    requires_approval = get_booking_policy(policy, purpose)
    booking_status = "pending" if requires_approval else "approved"
    test_data = app_environment() != "production"
    row = await (await conn.execute(
        """INSERT INTO bookings (room_id, faculty_id, title, purpose, target_branch_id, target_year,
             target_section, attendee_count, start_time, end_time, status, notes, test_data)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, status""",
        (room["id"], faculty_id, title.strip(), purpose, branch_id, year, section, attendee_count,
         start_time, end_time, booking_status, notes, test_data),
    )).fetchone()
    await write_audit(conn, actor["id"], "BOOKING_CREATE", "booking", row["id"], {"room_number": room["room_number"], "status": row["status"], "test_data": test_data})
    await conn.execute(
        "INSERT INTO notifications (user_id, title, body) VALUES (%s, %s, %s)",
        (actor["id"], "Room booking request received", f"{room['room_number']} · {booking_status}"),
    )
    return {"id": row["id"], "room_number": room["room_number"], "building": room["building_code"], "status": row["status"], "test_data": test_data}


@app.post("/api/v1/bookings", status_code=201, tags=["Bookings"])
async def create_booking(payload: BookingCreateRequest, user: dict = Depends(require_roles("faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    try:
        async with pool.connection() as conn:
            async with conn.transaction():
                faculty_id = await get_faculty_id(conn, user["id"], require_booking=True)
                room = await get_room(conn, payload.room_id, lock=True)
                branch = None
                if payload.target_branch_code:
                    branch = await (await conn.execute("SELECT id FROM branches WHERE code = %s", (payload.target_branch_code.upper(),))).fetchone()
                    if not branch:
                        raise HTTPException(status_code=422, detail="Unknown target branch")
                return await insert_booking(
                    conn, actor=user, faculty_id=faculty_id, room=room, title=payload.title, purpose=payload.purpose,
                    start_time=payload.start_time, end_time=payload.end_time, attendee_count=payload.attendee_count,
                    branch_id=branch["id"] if branch else None, year=payload.target_year,
                    section=payload.target_section, notes=payload.notes,
                )
    except ExclusionViolation:
        raise HTTPException(status_code=409, detail={"error": "ROOM_CONFLICT", "message": "Another request reserved this room first"}) from None


async def list_bookings(pool: AsyncConnectionPool, *, faculty_id: UUID | None = None):
    async with pool.connection() as conn:
        if faculty_id:
            rows = await (await conn.execute(
                """SELECT bk.id, bk.room_id, bk.faculty_id, bk.title, bk.purpose, bk.attendee_count,
                          bk.notes, bk.start_time, bk.end_time, bk.status, bk.test_data,
                          r.room_number, b.code AS building_code, f.floor_label
                   FROM bookings bk JOIN rooms r ON r.id = bk.room_id JOIN floors f ON f.id = r.floor_id
                   JOIN buildings b ON b.id = f.building_id WHERE bk.faculty_id = %s
                   ORDER BY bk.start_time DESC LIMIT 200""",
                (faculty_id,),
            )).fetchall()
        else:
            rows = await (await conn.execute(
                """SELECT bk.id, bk.room_id, bk.faculty_id, bk.title, bk.purpose, bk.attendee_count,
                          bk.notes, bk.start_time, bk.end_time, bk.status, bk.test_data,
                          r.room_number, b.code AS building_code, f.floor_label, u.email AS faculty_email
                   FROM bookings bk JOIN rooms r ON r.id = bk.room_id JOIN floors f ON f.id = r.floor_id
                   JOIN buildings b ON b.id = f.building_id JOIN faculty fc ON fc.id = bk.faculty_id
                   JOIN users u ON u.id = fc.user_id ORDER BY bk.start_time DESC LIMIT 500"""
            )).fetchall()
    return rows


@app.get("/api/v1/bookings/mine", tags=["Bookings"])
async def my_bookings(user: dict = Depends(require_roles("faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        faculty_id = await get_faculty_id(conn, user["id"], require_schedule=True)
    return await list_bookings(pool, faculty_id=faculty_id)

@app.get("/api/v1/admin/bookings", tags=["Admin"])
async def admin_bookings(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    return await list_bookings(pool)


@app.get("/api/v1/admin/schedule", tags=["Admin"])
async def admin_schedule(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT s.id, s.course_code, s.course_name, s.day_of_week, s.start_time, s.end_time,
                      s.academic_year, s.section, s.test_data, br.code AS branch_code,
                      fc.display_name AS faculty_name, r.id AS room_id, r.room_number, b.code AS building_code
               FROM master_schedule s JOIN branches br ON br.id = s.branch_id
               JOIN faculty fc ON fc.id = s.faculty_id JOIN rooms r ON r.id = s.room_id
               JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
               ORDER BY s.day_of_week, s.start_time"""
        )).fetchall()
    return rows


@app.get("/api/v1/admin/announcements", tags=["Admin"])
async def admin_announcements(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT a.id, a.title, a.body, a.category, a.is_public, a.target_year, a.target_section,
                      a.is_urgent, a.status, a.test_data, a.created_at, a.published_at,
                      br.code AS target_branch_code
               FROM announcements a LEFT JOIN branches br ON br.id = a.target_branch_id
               ORDER BY a.created_at DESC LIMIT 500"""
        )).fetchall()
    return rows


@app.post("/api/v1/bookings/{booking_id}/cancel", tags=["Bookings"])
async def cancel_booking(booking_id: UUID, user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    if user["role"] not in ("faculty", "admin"):
        raise HTTPException(status_code=403, detail="Only the booking owner or an administrator can cancel")
    async with pool.connection() as conn:
        async with conn.transaction():
            booking = await (await conn.execute("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))).fetchone()
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if user["role"] == "faculty" and booking["faculty_id"] != await get_faculty_id(conn, user["id"]):
                raise HTTPException(status_code=403, detail="Faculty can only change their own bookings")
            if booking["status"] not in ("pending", "approved"):
                raise HTTPException(status_code=409, detail="Only pending or approved bookings can be cancelled")
            policy = await (await conn.execute("SELECT cancellation_notice_hours FROM booking_policies WHERE id = 1")).fetchone()
            if user["role"] != "admin" and booking["start_time"] - datetime.now(timezone.utc) < timedelta(hours=policy["cancellation_notice_hours"]):
                raise HTTPException(status_code=422, detail="Cancellation is inside the configured notice window")
            await conn.execute("UPDATE bookings SET status = 'cancelled', updated_at = now() WHERE id = %s", (booking_id,))
            await write_audit(conn, user["id"], "BOOKING_CANCEL", "booking", booking_id, {"test_data": booking["test_data"]})
    return {"id": booking_id, "status": "cancelled"}


@app.patch("/api/v1/bookings/{booking_id}/reschedule", tags=["Bookings"])
async def reschedule_booking(booking_id: UUID, payload: RescheduleRequest, user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    if user["role"] not in ("faculty", "admin"):
        raise HTTPException(status_code=403, detail="Only faculty or administrators can reschedule")
    try:
        async with pool.connection() as conn:
            async with conn.transaction():
                booking = await (await conn.execute("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))).fetchone()
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                faculty_id = booking["faculty_id"]
                if user["role"] == "faculty" and booking["faculty_id"] != await get_faculty_id(conn, user["id"]):
                    raise HTTPException(status_code=403, detail="Faculty can only change their own bookings")
                if booking["status"] not in ("pending", "approved"):
                    raise HTTPException(status_code=409, detail="Only pending or approved bookings can be rescheduled")
                room = await get_room(conn, booking["room_id"], lock=True)
                conflict = await room_and_schedule_blocker(
                    conn, room=room, faculty_id=faculty_id, start_time=payload.start_time, end_time=payload.end_time,
                    purpose=booking["purpose"], attendee_count=booking["attendee_count"],
                    target_branch_id=booking["target_branch_id"], target_year=booking["target_year"],
                    target_section=booking["target_section"], ignore_booking_id=booking_id,
                )
                if conflict:
                    raise HTTPException(status_code=409, detail=conflict)
                await conn.execute(
                    "UPDATE bookings SET start_time = %s, end_time = %s, updated_at = now() WHERE id = %s",
                    (payload.start_time, payload.end_time, booking_id),
                )
                await write_audit(conn, user["id"], "BOOKING_RESCHEDULE", "booking", booking_id, {"test_data": booking["test_data"]})
                return {"id": booking_id, "status": booking["status"], "start_time": payload.start_time, "end_time": payload.end_time}
    except ExclusionViolation:
        raise HTTPException(status_code=409, detail="Another request reserved this room first") from None


@app.patch("/api/v1/admin/bookings/{booking_id}/reschedule", tags=["Admin"])
async def admin_reschedule_booking(booking_id: UUID, payload: RescheduleRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    try:
        async with pool.connection() as conn:
            async with conn.transaction():
                booking = await (await conn.execute("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))).fetchone()
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                if booking["status"] not in ("pending", "approved"):
                    raise HTTPException(status_code=409, detail="Only pending or approved bookings can be rescheduled")
                room = await get_room(conn, booking["room_id"], lock=True)
                blocker = await room_and_schedule_blocker(
                    conn, room=room, faculty_id=booking["faculty_id"], start_time=payload.start_time,
                    end_time=payload.end_time, purpose=booking["purpose"], attendee_count=booking["attendee_count"],
                    target_branch_id=booking["target_branch_id"], target_year=booking["target_year"],
                    target_section=booking["target_section"], ignore_booking_id=booking_id,
                )
                if blocker:
                    raise HTTPException(status_code=409, detail=blocker)
                await conn.execute(
                    "UPDATE bookings SET start_time = %s, end_time = %s, updated_at = now() WHERE id = %s",
                    (payload.start_time, payload.end_time, booking_id),
                )
                await write_audit(conn, user["id"], "ADMIN_BOOKING_RESCHEDULE", "booking", booking_id, {"test_data": booking["test_data"]})
                return {"id": booking_id, "status": booking["status"], "start_time": payload.start_time, "end_time": payload.end_time}
    except ExclusionViolation:
        raise HTTPException(status_code=409, detail="Another request reserved this room first") from None


@app.post("/api/v1/admin/bookings/{booking_id}/review", tags=["Admin"])
async def review_booking(booking_id: UUID, payload: ReviewRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    try:
        async with pool.connection() as conn:
            async with conn.transaction():
                booking = await (await conn.execute("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))).fetchone()
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                if booking["status"] != "pending":
                    raise HTTPException(status_code=409, detail="Only pending bookings can be reviewed")
                if payload.decision == "approve":
                    room = await get_room(conn, booking["room_id"], lock=True)
                    blocker = await room_and_schedule_blocker(
                        conn, room=room, faculty_id=booking["faculty_id"], start_time=booking["start_time"],
                        end_time=booking["end_time"], purpose=booking["purpose"], attendee_count=booking["attendee_count"],
                        target_branch_id=booking["target_branch_id"], target_year=booking["target_year"],
                        target_section=booking["target_section"], ignore_booking_id=booking_id,
                    )
                    if blocker:
                        raise HTTPException(status_code=409, detail=blocker)
                next_status = "approved" if payload.decision == "approve" else "rejected"
                await conn.execute("UPDATE bookings SET status = %s, updated_at = now() WHERE id = %s", (next_status, booking_id))
                await write_audit(conn, user["id"], f"BOOKING_{next_status.upper()}", "booking", booking_id, {"reason": payload.reason, "test_data": booking["test_data"]})
                await conn.execute(
                    "INSERT INTO notifications (user_id, title, body) SELECT user_id, %s, %s FROM faculty WHERE id = %s",
                    (f"Booking {next_status}", booking["title"], booking["faculty_id"]),
                )
                return {"id": booking_id, "status": next_status}
    except ExclusionViolation:
        raise HTTPException(status_code=409, detail="A concurrent booking prevents approval") from None


@app.get("/api/v1/students/me", tags=["Students"])
async def student_me(user: dict = Depends(require_roles("student")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        student = await get_student(conn, user["id"])
    return {key: value for key, value in student.items() if key != "id"}


@app.get("/api/v1/students/timetable", tags=["Students"])
async def student_timetable(user: dict = Depends(require_roles("student")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        student = await get_student(conn, user["id"])
        rows = await (await conn.execute(
            """SELECT s.course_code, s.course_name, s.day_of_week, s.start_time, s.end_time,
                      r.room_number, b.code AS building_code, f.floor_label, s.test_data
               FROM master_schedule s JOIN rooms r ON r.id = s.room_id JOIN floors f ON f.id = r.floor_id
               JOIN buildings b ON b.id = f.building_id
               WHERE s.branch_id = %s AND s.academic_year = %s AND COALESCE(s.section, '') = COALESCE(%s, '')
               ORDER BY s.day_of_week, s.start_time""",
            (student["branch_id"], student["academic_year"], student["section"]),
        )).fetchall()
    return rows


async def announcement_rows(conn, *, branch_id: UUID | None, year: int | None, section: str | None, limit: int):
    return await (await conn.execute(
        """SELECT title, body, published_at, is_urgent, test_data FROM announcements
           WHERE status = 'published' AND published_at <= now()
             AND (is_public OR (%s::uuid IS NOT NULL AND target_branch_id = %s::uuid
               AND (target_year IS NULL OR target_year = %s)
               AND (target_section IS NULL OR target_section = %s)))
           ORDER BY is_urgent DESC, published_at DESC LIMIT %s""",
        (branch_id, branch_id, year, section, limit),
    )).fetchall()


@app.get("/api/v1/announcements", tags=["Announcements"])
async def relevant_announcements(limit: Annotated[int, Query(ge=1, le=50)] = 20, user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        profile = await get_student(conn, user["id"]) if user["role"] == "student" else None
        rows = await announcement_rows(
            conn, branch_id=profile["branch_id"] if profile else None,
            year=profile["academic_year"] if profile else None,
            section=profile["section"] if profile else None, limit=limit,
        )
    return rows


@app.get("/api/v1/students/examinations", tags=["Students"])
async def student_examinations(user: dict = Depends(require_roles("student")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        student = await get_student(conn, user["id"])
        rows = await (await conn.execute(
            """SELECT bk.title, bk.start_time, bk.end_time, bk.status, bk.test_data, r.room_number,
                      b.code AS building_code, f.floor_label
               FROM bookings bk JOIN rooms r ON r.id = bk.room_id JOIN floors f ON f.id = r.floor_id
               JOIN buildings b ON b.id = f.building_id
               WHERE bk.purpose = 'examination' AND bk.status = 'approved'
                 AND bk.target_branch_id = %s AND (bk.target_year IS NULL OR bk.target_year = %s)
                 AND (bk.target_section IS NULL OR bk.target_section = %s)
               ORDER BY bk.start_time""",
            (student["branch_id"], student["academic_year"], student["section"]),
        )).fetchall()
    return rows


@app.get("/api/v1/faculty/schedule", tags=["Faculty"])
async def faculty_schedule(user: dict = Depends(require_roles("faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        faculty_id = await get_faculty_id(conn, user["id"])
        rows = await (await conn.execute(
            """SELECT s.course_code, s.course_name, s.day_of_week, s.start_time, s.end_time,
                      r.room_number, b.code AS building_code, f.floor_label, s.test_data
               FROM master_schedule s JOIN rooms r ON r.id = s.room_id JOIN floors f ON f.id = r.floor_id
               JOIN buildings b ON b.id = f.building_id WHERE s.faculty_id = %s
               ORDER BY s.day_of_week, s.start_time""",
            (faculty_id,),
        )).fetchall()
    return rows


@app.get("/api/v1/faculty/me", tags=["Faculty"])
async def faculty_me(user: dict = Depends(require_roles("faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        faculty = await (await conn.execute(
            """SELECT f.display_name, f.can_book, f.can_view_schedule,
                      b.code AS department_code, b.name AS department_name
               FROM faculty f LEFT JOIN branches b ON b.id = f.department_id
               WHERE f.user_id = %s""",
            (user["id"],),
        )).fetchone()
    if not faculty:
        raise HTTPException(status_code=403, detail="Faculty profile is not configured")
    return {**faculty, "email": user["email"]}


@app.post("/api/v1/student/issues", status_code=201, tags=["Issues"])
@app.post("/api/v1/students/issues", status_code=201, tags=["Issues"])
async def create_issue(payload: IssueCreateRequest, user: dict = Depends(require_roles("student")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            student = await get_student(conn, user["id"])
            if payload.room_id:
                await get_room(conn, payload.room_id)
            row = await (await conn.execute(
                """INSERT INTO issue_reports (student_id, title, description, related_room_id, test_data)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id, status, created_at""",
                (student["id"], payload.title, payload.description, payload.room_id, app_environment() != "production"),
            )).fetchone()
            await write_audit(conn, user["id"], "ISSUE_CREATE", "issue", row["id"], {"test_data": app_environment() != "production"})
    return row


@app.post("/api/v1/faculty/issues", status_code=201, tags=["Issues"])
async def create_faculty_issue(payload: IssueCreateRequest, user: dict = Depends(require_roles("faculty")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            if payload.room_id:
                await get_room(conn, payload.room_id)
            row = await (await conn.execute(
                """INSERT INTO issue_reports (title, description, related_room_id, test_data)
                   VALUES (%s, %s, %s, %s) RETURNING id, status, created_at""",
                (payload.title, payload.description, payload.room_id, app_environment() != "production"),
            )).fetchone()
            await write_audit(conn, user["id"], "FACULTY_ISSUE_CREATE", "issue", row["id"], {"test_data": app_environment() != "production"})
    return row


@app.get("/api/v1/notifications", tags=["Notifications"])
async def list_notifications(user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            "SELECT id, title, body, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
            (user["id"],),
        )).fetchall()
    return rows


@app.patch("/api/v1/notifications/{notification_id}/read", tags=["Notifications"])
async def mark_notification_read(notification_id: UUID, user: dict = Depends(current_user), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        result = await conn.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s RETURNING id",
            (notification_id, user["id"]),
        )
    if not await result.fetchone():
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"id": notification_id, "is_read": True}


@app.get("/api/v1/admin/rooms", tags=["Admin"])
async def admin_rooms(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT r.id, r.room_number, r.name, r.room_type, r.capacity, r.capacity_source,
                      r.permitted_uses, r.is_active, r.is_verified, f.floor_number, f.floor_label,
                      b.code AS building_code
               FROM rooms r JOIN floors f ON f.id = r.floor_id JOIN buildings b ON b.id = f.building_id
               ORDER BY b.code, f.floor_number, r.room_number"""
        )).fetchall()
    return rows


@app.post("/api/v1/admin/rooms", status_code=201, tags=["Admin"])
async def create_admin_room(payload: RoomCreateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            floor = await (await conn.execute("SELECT id FROM floors WHERE id = %s", (payload.floor_id,))).fetchone()
            if not floor:
                raise HTTPException(status_code=404, detail="Floor not found")
            try:
                row = await (await conn.execute(
                    """INSERT INTO rooms (floor_id, room_number, name, room_type, capacity, capacity_source,
                         permitted_uses, is_active, is_verified)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id, room_number, name, room_type, capacity, capacity_source, permitted_uses, is_active, is_verified""",
                    (payload.floor_id, payload.room_number.strip(), payload.name.strip(), payload.room_type,
                     payload.capacity, payload.capacity_source, payload.permitted_uses, payload.is_active, payload.is_verified),
                )).fetchone()
            except Exception as error:
                if getattr(error, "sqlstate", None) == "23505":
                    raise HTTPException(status_code=409, detail="A room with this number already exists on the selected floor") from None
                raise
            await write_audit(conn, user["id"], "ROOM_CREATE", "room", row["id"], {"room_number": row["room_number"], "is_verified": row["is_verified"]})
    return row


@app.patch("/api/v1/admin/rooms/{room_id}", tags=["Admin"])
async def update_room(room_id: UUID, payload: RoomUpdateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No room fields were provided")
    allowed = {"room_number", "name", "capacity", "capacity_source", "permitted_uses", "is_active", "is_verified", "room_type"}
    if set(changes) - allowed:
        raise HTTPException(status_code=422, detail="Unsupported room field")
    assignments = ", ".join(f"{field} = %s" for field in changes)
    values = list(changes.values()) + [room_id]
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                f"UPDATE rooms SET {assignments} WHERE id = %s RETURNING id, room_number, name, capacity, capacity_source, permitted_uses, is_active, is_verified",
                values,
            )).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Room not found")
            await write_audit(conn, user["id"], "ROOM_UPDATE", "room", room_id, changes)
    return row


@app.get("/api/v1/admin/students", tags=["Admin"])
async def admin_students(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT s.id, s.display_name, s.roll_number, s.academic_year, s.batch_year, s.section, b.code AS branch_code
               FROM students s JOIN branches b ON b.id = s.branch_id ORDER BY b.code, s.academic_year, s.section LIMIT 1000"""
        )).fetchall()
    return rows


@app.get("/api/v1/admin/faculty", tags=["Admin"])
async def admin_faculty(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT f.id, f.display_name, b.code AS department_code, u.email, u.is_active,
                      f.can_book, f.can_view_schedule
               FROM faculty f JOIN users u ON u.id = f.user_id LEFT JOIN branches b ON b.id = f.department_id
               ORDER BY f.display_name"""
        )).fetchall()
    return rows


@app.patch("/api/v1/admin/faculty/{faculty_id}/permissions", tags=["Admin"])
async def update_faculty_permissions(
    faculty_id: UUID,
    payload: FacultyPermissionsRequest,
    user: dict = Depends(require_roles("admin")),
    pool: AsyncConnectionPool = Depends(get_db_pool),
):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No permissions were provided")
    async with pool.connection() as conn:
        async with conn.transaction():
            faculty = await (await conn.execute(
                "SELECT user_id FROM faculty WHERE id = %s",
                (faculty_id,),
            )).fetchone()
            if not faculty:
                raise HTTPException(status_code=404, detail="Faculty profile not found")
            if "is_active" in changes:
                await conn.execute("UPDATE users SET is_active = %s WHERE id = %s", (changes.pop("is_active"), faculty["user_id"]))
            if changes:
                assignments = ", ".join(f"{field} = %s" for field in changes)
                await conn.execute(f"UPDATE faculty SET {assignments} WHERE id = %s", [*changes.values(), faculty_id])
            await write_audit(conn, user["id"], "FACULTY_PERMISSIONS_UPDATE", "faculty", faculty_id, payload.model_dump(exclude_unset=True))
            updated = await (await conn.execute(
                """SELECT f.id, f.display_name, u.email, u.is_active, f.can_book, f.can_view_schedule
                   FROM faculty f JOIN users u ON u.id = f.user_id WHERE f.id = %s""",
                (faculty_id,),
            )).fetchone()
    return updated


@app.get("/api/v1/admin/issues", tags=["Admin"])
async def admin_issues(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT i.id, i.title, i.description, i.status, i.resolution_notes, i.created_at, i.test_data,
                      r.room_number, s.display_name AS reporter
               FROM issue_reports i LEFT JOIN rooms r ON r.id = i.related_room_id
               LEFT JOIN students s ON s.id = i.student_id ORDER BY i.created_at DESC LIMIT 500"""
        )).fetchall()
    return rows


@app.patch("/api/v1/admin/issues/{issue_id}", tags=["Admin"])
async def update_issue(issue_id: UUID, payload: IssueUpdateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                """UPDATE issue_reports SET status = %s, resolution_notes = %s,
                     resolved_at = CASE WHEN %s = 'resolved' THEN now() ELSE NULL END
                   WHERE id = %s RETURNING id, status, resolution_notes""",
                (payload.status, payload.resolution_notes, payload.status, issue_id),
            )).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Issue report not found")
            await write_audit(conn, user["id"], "ISSUE_UPDATE", "issue", issue_id, {"status": payload.status})
    return row


@app.post("/api/v1/admin/announcements", status_code=201, tags=["Admin"])
async def create_announcement(payload: AnnouncementCreateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            branch = None
            if payload.target_branch_code:
                branch = await (await conn.execute("SELECT id FROM branches WHERE code = %s", (payload.target_branch_code.upper(),))).fetchone()
                if not branch:
                    raise HTTPException(status_code=422, detail="Unknown target branch")
            row = await (await conn.execute(
                """INSERT INTO announcements (title, body, category, is_public, target_branch_id,
                     target_year, target_section, is_urgent, status, test_data, created_by)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'draft', %s, %s)
                   RETURNING id, title, status, is_public, test_data""",
                (payload.title, payload.body, payload.category, payload.is_public,
                 branch["id"] if branch else None, payload.target_year, payload.target_section,
                 payload.is_urgent, app_environment() != "production", user["id"]),
            )).fetchone()
            await write_audit(conn, user["id"], "ANNOUNCEMENT_DRAFT", "announcement", row["id"], {"is_public": payload.is_public})
    return row


@app.post("/api/v1/admin/announcements/{announcement_id}/publish", tags=["Admin"])
async def publish_announcement(announcement_id: UUID, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                "UPDATE announcements SET status = 'published', published_at = now() WHERE id = %s AND status = 'draft' RETURNING id, title, is_public, status, published_at",
                (announcement_id,),
            )).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Draft announcement not found")
            await write_audit(conn, user["id"], "ANNOUNCEMENT_PUBLISH", "announcement", announcement_id, {"is_public": row["is_public"]})
    return row


@app.delete("/api/v1/admin/announcements/{announcement_id}", tags=["Admin"])
async def delete_announcement_draft(announcement_id: UUID, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                "DELETE FROM announcements WHERE id = %s AND status = 'draft' RETURNING id, title",
                (announcement_id,),
            )).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Draft announcement not found")
            await write_audit(conn, user["id"], "ANNOUNCEMENT_DRAFT_DELETE", "announcement", announcement_id, {"title": row["title"]})
    return {"id": announcement_id, "deleted": True}


@app.get("/api/v1/admin/audit", tags=["Admin"])
async def admin_audit(limit: Annotated[int, Query(ge=1, le=500)] = 100, _user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.email AS actor_email
               FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.created_at DESC LIMIT %s""",
            (limit,),
        )).fetchall()
    return rows


@app.get("/api/v1/admin/analytics", tags=["Admin"])
async def admin_analytics(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        totals = await (await conn.execute(
            """SELECT count(*) FILTER (WHERE status = 'approved') AS approved,
                      count(*) FILTER (WHERE status = 'pending') AS pending,
                      count(*) FILTER (WHERE status = 'cancelled') AS cancelled,
                      count(*) FILTER (WHERE test_data) AS demo_records
               FROM bookings"""
        )).fetchone()
        by_room = await (await conn.execute(
            """SELECT r.room_number, count(bk.id) AS booking_count,
                      COALESCE(sum(extract(epoch FROM (bk.end_time - bk.start_time)) / 3600), 0) AS booked_hours
               FROM rooms r LEFT JOIN bookings bk ON bk.room_id = r.id AND bk.status = 'approved'
               GROUP BY r.id ORDER BY booked_hours DESC LIMIT 20"""
        )).fetchall()
    return {"totals": totals, "room_usage": by_room, "test_data": app_environment() != "production"}


@app.get("/api/v1/admin/settings", tags=["Admin"])
async def get_admin_settings(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        return await (await conn.execute("SELECT require_exam_approval, require_event_approval, advance_booking_days, cancellation_notice_hours FROM booking_policies WHERE id = 1")).fetchone()


@app.patch("/api/v1/admin/settings", tags=["Admin"])
async def update_admin_settings(payload: SettingsUpdateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                """UPDATE booking_policies SET require_exam_approval = %s, require_event_approval = %s,
                     advance_booking_days = %s, cancellation_notice_hours = %s WHERE id = 1
                   RETURNING require_exam_approval, require_event_approval, advance_booking_days, cancellation_notice_hours""",
                (payload.require_exam_approval, payload.require_event_approval, payload.advance_booking_days, payload.cancellation_notice_hours),
            )).fetchone()
            await write_audit(conn, user["id"], "POLICY_UPDATE", "booking_policy", None, payload.model_dump())
    return row


@app.get("/api/v1/admin/users", tags=["Admin"])
async def admin_users(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT u.id, u.email, u.role, u.is_active, u.created_at,
                      COALESCE(s.display_name, f.display_name, u.email) AS display_name,
                      s.roll_number, b.code AS branch_code
               FROM users u
               LEFT JOIN students s ON s.user_id = u.id
               LEFT JOIN faculty f ON f.user_id = u.id
               LEFT JOIN branches b ON b.id = s.branch_id OR b.id = f.department_id
               ORDER BY u.created_at DESC LIMIT 500"""
        )).fetchall()
    return rows


@app.post("/api/v1/admin/users", status_code=201, tags=["Admin"])
async def admin_create_user(payload: AdminCreateUserRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    email_clean = payload.email.strip().lower()
    async with pool.connection() as conn:
        async with conn.transaction():
            existing = await (await conn.execute(
                "SELECT id FROM users WHERE lower(email) = lower(%s)", (email_clean,)
            )).fetchone()
            if existing:
                raise HTTPException(status_code=409, detail="An account with this email already exists")

            pw_hash = password_hash.hash(payload.password)
            created_user = await (await conn.execute(
                """INSERT INTO users (email, password_hash, role)
                   VALUES (%s, %s, %s) RETURNING id""",
                (email_clean, pw_hash, payload.role),
            )).fetchone()

            if payload.role == "faculty":
                dept_id = None
                if payload.branch_code:
                    dept = await (await conn.execute(
                        "SELECT id FROM branches WHERE upper(code) = %s", (payload.branch_code.strip().upper(),)
                    )).fetchone()
                    dept_id = dept["id"] if dept else None
                await conn.execute(
                    """INSERT INTO faculty (user_id, display_name, department_id, can_book, can_view_schedule)
                       VALUES (%s, %s, %s, TRUE, TRUE)""",
                    (created_user["id"], payload.display_name.strip(), dept_id),
                )
            elif payload.role == "student":
                if not payload.roll_number:
                    raise HTTPException(status_code=422, detail="Roll number is required for students")
                roll_clean = payload.roll_number.strip().upper()
                existing_roll = await (await conn.execute(
                    "SELECT id FROM students WHERE upper(roll_number) = %s", (roll_clean,)
                )).fetchone()
                if existing_roll:
                    raise HTTPException(status_code=409, detail="Roll number already registered")
                branch = None
                if payload.branch_code:
                    branch = await (await conn.execute(
                        "SELECT id FROM branches WHERE upper(code) = %s", (payload.branch_code.strip().upper(),)
                    )).fetchone()
                if not branch:
                    raise HTTPException(status_code=422, detail="Valid branch code is required for students")
                await conn.execute(
                    """INSERT INTO students (user_id, display_name, roll_number, branch_id, academic_year, batch_year, section)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (created_user["id"], payload.display_name.strip(), roll_clean, branch["id"],
                     payload.academic_year or 1, payload.batch_year or datetime.now().year, payload.section),
                )

            await write_audit(conn, user["id"], "ADMIN_CREATE_USER", "user", created_user["id"], {
                "email": email_clean, "role": payload.role, "display_name": payload.display_name
            })
    return {"id": created_user["id"], "email": email_clean, "role": payload.role, "display_name": payload.display_name}


@app.post("/api/v1/admin/students/import", tags=["Admin"])
async def admin_import_students(payload: StudentBatchImportRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    if not payload.students:
        raise HTTPException(status_code=422, detail="No student records provided")
    if len(payload.students) > 2000:
        raise HTTPException(status_code=422, detail="Maximum 2000 students per batch")

    imported = 0
    skipped = 0
    errors = []

    async with pool.connection() as conn:
        async with conn.transaction():
            branches_rows = await (await conn.execute("SELECT id, upper(code) AS code FROM branches")).fetchall()
            branch_map = {row["code"]: row["id"] for row in branches_rows}

            for idx, student in enumerate(payload.students, start=1):
                b_code = student.branch_code.strip().upper()
                if b_code not in branch_map:
                    errors.append(f"Row {idx}: unknown branch '{b_code}'")
                    skipped += 1
                    continue
                branch_id = branch_map[b_code]
                email_clean = student.email.strip().lower()
                roll_clean = student.roll_number.strip().upper()

                existing_student = await (await conn.execute(
                    "SELECT id FROM students WHERE upper(roll_number) = %s", (roll_clean,)
                )).fetchone()
                if existing_student:
                    skipped += 1
                    continue

                user_record = await (await conn.execute(
                    "SELECT id FROM users WHERE lower(email) = lower(%s)", (email_clean,)
                )).fetchone()
                if not user_record:
                    init_pw = password_hash.hash(f"Campyx@{roll_clean}")
                    user_record = await (await conn.execute(
                        "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'student') RETURNING id",
                        (email_clean, init_pw),
                    )).fetchone()

                sec = student.section.strip().upper() if student.section else None
                await conn.execute(
                    """INSERT INTO students (user_id, display_name, roll_number, branch_id, academic_year, batch_year, section)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (user_record["id"], student.display_name.strip(), roll_clean, branch_id, student.academic_year, student.batch_year, sec),
                )
                imported += 1

            await write_audit(conn, user["id"], "STUDENT_IMPORT", "students", None, {
                "total": len(payload.students), "imported": imported, "skipped": skipped, "errors_count": len(errors)
            })

    return {"total": len(payload.students), "imported": imported, "skipped": skipped, "errors": errors[:10]}


@app.get("/api/v1/admin/students/export", tags=["Admin"])
async def export_students(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT s.roll_number, s.display_name, u.email, b.code AS branch,
                      s.academic_year, s.batch_year, COALESCE(s.section, '') AS section
               FROM students s
               JOIN users u ON u.id = s.user_id
               JOIN branches b ON b.id = s.branch_id
               ORDER BY b.code, s.academic_year, s.roll_number"""
        )).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["roll_number", "display_name", "email", "branch", "academic_year", "batch_year", "section"])
    for r in rows:
        writer.writerow([r["roll_number"], r["display_name"], r["email"], r["branch"], r["academic_year"], r["batch_year"], r["section"]])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="campus_students.csv"'},
    )


@app.get("/api/v1/admin/bookings/export", tags=["Admin"])
async def export_bookings(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT bk.id, bk.title, bk.purpose, bk.status, bk.start_time, bk.end_time,
                      r.room_number, b.code AS building_code, fc.display_name AS faculty_name,
                      br.code AS target_branch, bk.target_year, bk.target_section, bk.attendee_count,
                      bk.created_at
               FROM bookings bk
               JOIN rooms r ON r.id = bk.room_id
               JOIN floors f ON f.id = r.floor_id
               JOIN buildings b ON b.id = f.building_id
               JOIN faculty fc ON fc.id = bk.faculty_id
               LEFT JOIN branches br ON br.id = bk.target_branch_id
               ORDER BY bk.created_at DESC"""
        )).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["booking_id", "title", "purpose", "status", "start_time", "end_time", "room", "building", "faculty", "target_branch", "target_year", "target_section", "attendees", "created_at"])
    for r in rows:
        st = r["start_time"].isoformat() if hasattr(r["start_time"], "isoformat") else str(r["start_time"])
        et = r["end_time"].isoformat() if hasattr(r["end_time"], "isoformat") else str(r["end_time"])
        cat = r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"])
        writer.writerow([r["id"], r["title"], r["purpose"], r["status"], st, et, r["room_number"], r["building_code"], r["faculty_name"], r["target_branch"] or "", r["target_year"] or "", r["target_section"] or "", r["attendee_count"] or "", cat])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="campus_bookings.csv"'},
    )


@app.get("/api/v1/admin/audit/export", tags=["Admin"])
async def export_audit(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT a.id, a.created_at, u.email AS actor_email, a.action, a.entity_type,
                      COALESCE(a.entity_id::text, '') AS entity_id, a.details::text AS details
               FROM audit_logs a
               LEFT JOIN users u ON u.id = a.actor_user_id
               ORDER BY a.created_at DESC LIMIT 5000"""
        )).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "created_at", "actor_email", "action", "entity_type", "entity_id", "details"])
    for r in rows:
        cat = r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"])
        writer.writerow([r["id"], cat, r["actor_email"] or "system", r["action"], r["entity_type"], r["entity_id"], r["details"]])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="campus_audit_logs.csv"'},
    )


@app.get("/api/v1/admin/rooms/export", tags=["Admin"])
async def export_rooms(_user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """SELECT r.room_number, r.name, r.room_type, r.capacity, b.code AS building_code,
                      f.floor_number, f.floor_label, r.is_active, r.is_verified,
                      array_to_string(r.permitted_uses, ', ') AS permitted_uses
               FROM rooms r
               JOIN floors f ON f.id = r.floor_id
               JOIN buildings b ON b.id = f.building_id
               ORDER BY b.code, f.floor_number, r.room_number"""
        )).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["room_number", "name", "room_type", "capacity", "building", "floor_number", "floor_label", "is_active", "is_verified", "permitted_uses"])
    for r in rows:
        writer.writerow([r["room_number"], r["name"], r["room_type"], r["capacity"] or "", r["building_code"], r["floor_number"], r["floor_label"], r["is_active"], r["is_verified"], r["permitted_uses"]])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="campus_rooms.csv"'},
    )


@app.post("/api/v1/admin/schedule", status_code=201, tags=["Admin"])
async def admin_create_schedule(payload: ScheduleCreateRequest, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            branch = await (await conn.execute("SELECT id FROM branches WHERE upper(code) = %s", (payload.branch_code.strip().upper(),))).fetchone()
            if not branch:
                raise HTTPException(status_code=422, detail="Branch not found")
            faculty = await (await conn.execute("SELECT id FROM faculty WHERE id = %s", (payload.faculty_id,))).fetchone()
            if not faculty:
                raise HTTPException(status_code=422, detail="Faculty member not found")
            room = await (await conn.execute("SELECT id FROM rooms WHERE id = %s", (payload.room_id,))).fetchone()
            if not room:
                raise HTTPException(status_code=422, detail="Room not found")

            st = payload.start_time if len(payload.start_time) == 8 else f"{payload.start_time}:00"
            et = payload.end_time if len(payload.end_time) == 8 else f"{payload.end_time}:00"
            if st >= et:
                raise HTTPException(status_code=422, detail="Start time must precede end time")

            row = await (await conn.execute(
                """INSERT INTO master_schedule
                   (course_code, course_name, branch_id, academic_year, section, room_id, faculty_id, day_of_week, start_time, end_time, test_data)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id, course_code, course_name""",
                (payload.course_code.strip(), payload.course_name.strip(), branch["id"], payload.academic_year,
                 payload.section.strip().upper() if payload.section else None, payload.room_id, payload.faculty_id,
                 payload.day_of_week, st, et, app_environment() != "production"),
            )).fetchone()

            await write_audit(conn, user["id"], "SCHEDULE_CREATE", "schedule", row["id"], {
                "course_code": row["course_code"], "course_name": row["course_name"]
            })
    return row


@app.delete("/api/v1/admin/schedule/{schedule_id}", tags=["Admin"])
async def admin_delete_schedule(schedule_id: UUID, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            row = await (await conn.execute(
                "DELETE FROM master_schedule WHERE id = %s RETURNING id, course_code, course_name",
                (schedule_id,),
            )).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Schedule entry not found")
            await write_audit(conn, user["id"], "SCHEDULE_DELETE", "schedule", schedule_id, {
                "course_code": row["course_code"], "course_name": row["course_name"]
            })
    return {"id": schedule_id, "deleted": True}


@app.delete("/api/v1/admin/rooms/{room_id}", tags=["Admin"])
async def delete_or_deactivate_room(room_id: UUID, user: dict = Depends(require_roles("admin")), pool: AsyncConnectionPool = Depends(get_db_pool)):
    async with pool.connection() as conn:
        async with conn.transaction():
            room = await (await conn.execute("SELECT id, room_number, name FROM rooms WHERE id = %s", (room_id,))).fetchone()
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")

            has_bookings = await (await conn.execute("SELECT 1 FROM bookings WHERE room_id = %s LIMIT 1", (room_id,))).fetchone()
            has_schedule = await (await conn.execute("SELECT 1 FROM master_schedule WHERE room_id = %s LIMIT 1", (room_id,))).fetchone()

            if has_bookings or has_schedule:
                await conn.execute("UPDATE rooms SET is_active = FALSE WHERE id = %s", (room_id,))
                await write_audit(conn, user["id"], "ROOM_DEACTIVATE", "room", room_id, {"room_number": room["room_number"], "reason": "has_associated_records"})
                return {"id": room_id, "action": "deactivated", "detail": f"Room {room['room_number']} has associated bookings/schedule records and was disabled instead of deleted."}
            else:
                await conn.execute("DELETE FROM rooms WHERE id = %s", (room_id,))
                await write_audit(conn, user["id"], "ROOM_DELETE", "room", room_id, {"room_number": room["room_number"]})
                return {"id": room_id, "action": "deleted", "detail": f"Room {room['room_number']} was deleted."}


# Serve static frontend files directly if present (enables single-service zero-cost cloud deployment)
_static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if os.path.exists(os.path.join(_static_dir, "index.html")):
    from fastapi.staticfiles import StaticFiles
    from starlette.exceptions import HTTPException as StarletteHTTPException

    @app.exception_handler(StarletteHTTPException)
    async def _custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
        if exc.status_code == 404:
            if request.url.path.startswith("/api/"):
                return JSONResponse(status_code=404, content={"detail": exc.detail or "Not found"})
            _custom_404 = os.path.join(_static_dir, "404.html")
            if os.path.exists(_custom_404):
                from fastapi.responses import FileResponse
                return FileResponse(_custom_404, status_code=404)
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
