import io
import os
import unittest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import jwt
from fastapi import HTTPException, Response
from pydantic import ValidationError

# Set test environment variables before importing backend.main
os.environ["JWT_SECRET"] = "super-secret-test-key-of-at-least-32-chars-long"
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from backend.main import (
    SESSION_COOKIE,
    AdminCreateUserRequest,
    FacultyRegisterRequest,
    LoginRequest,
    ScheduleCreateRequest,
    StudentBatchImportRequest,
    StudentImportRow,
    StudentRegisterRequest,
    app,
    create_session_token,
    current_user,
    get_db_pool,
    password_hash,
    require_roles,
    set_session_cookie,
    validate_datetime_range,
)


def _step_coro(coro):
    """Step an async def coroutine that performs no internal I/O without needing an event loop."""
    try:
        coro.send(None)
    except StopIteration as exc:
        return exc.value


class AuthModelValidationTests(unittest.TestCase):
    """Test validation constraints on authentication and provisioning request models."""

    def test_student_register_request_valid(self):
        req = StudentRegisterRequest(
            email="student.test@ddugu.ac.in",
            password="SecureStudentPassword123!",
            display_name="Aarav Sharma",
            roll_number="CSE-2024-042",
            branch_code="CSE",
            academic_year=2,
            batch_year=2024,
            section="A",
        )
        self.assertEqual(req.email, "student.test@ddugu.ac.in")
        self.assertEqual(req.academic_year, 2)
        self.assertEqual(req.batch_year, 2024)

    def test_student_register_password_too_short(self):
        with self.assertRaises(ValidationError):
            StudentRegisterRequest(
                email="short@ddugu.ac.in",
                password="123",  # Less than 8 chars
                display_name="Short Pwd",
                roll_number="CSE-001",
                branch_code="CSE",
                academic_year=1,
                batch_year=2025,
            )

    def test_student_register_year_bounds(self):
        with self.assertRaises(ValidationError):
            StudentRegisterRequest(
                email="invalid.year@ddugu.ac.in",
                password="ValidPassword123!",
                display_name="Test Student",
                roll_number="CSE-002",
                branch_code="CSE",
                academic_year=5,  # Max is 4
                batch_year=2024,
            )

    def test_faculty_register_request_valid(self):
        req = FacultyRegisterRequest(
            email="prof.sharma@ddugu.ac.in",
            password="FacultyPassword123!",
            display_name="Prof. R. Sharma",
            department_code="CSE",
        )
        self.assertEqual(req.department_code, "CSE")

    def test_admin_create_user_roles(self):
        for role in ("admin", "faculty", "student"):
            req = AdminCreateUserRequest(
                email=f"{role}@ddugu.ac.in",
                password="AdminCreatedPassword123",
                role=role,
                display_name=f"Test {role.title()}",
            )
            self.assertEqual(req.role, role)

        with self.assertRaises(ValidationError):
            AdminCreateUserRequest(
                email="hacker@ddugu.ac.in",
                password="AdminCreatedPassword123",
                role="superuser",  # Invalid role
                display_name="Invalid",
            )

    def test_schedule_create_request_valid(self):
        req = ScheduleCreateRequest(
            course_code="CS201",
            course_name="Data Structures",
            branch_code="CSE",
            academic_year=2,
            room_id=uuid4(),
            faculty_id=uuid4(),
            day_of_week=3,
            start_time="09:00",
            end_time="10:00",
        )
        self.assertEqual(req.day_of_week, 3)

    def test_student_batch_import_models(self):
        row = StudentImportRow(
            roll_number="CSE-001",
            display_name="Student One",
            email="stu1@ddugu.ac.in",
            branch_code="CSE",
            academic_year=1,
            batch_year=2025,
            section="A",
        )
        batch = StudentBatchImportRequest(students=[row])
        self.assertEqual(len(batch.students), 1)


class CryptographyAndTokenTests(unittest.TestCase):
    """Test Argon2 password hashing and JWT session tokens."""

    def test_argon2_hashing_and_verification(self):
        raw_password = "SecureCampusPassword2026!"
        hashed = password_hash.hash(raw_password)
        self.assertNotEqual(raw_password, hashed)
        self.assertTrue(password_hash.verify(raw_password, hashed))
        self.assertFalse(password_hash.verify("WrongPassword", hashed))

    def test_session_token_generation_and_payload(self):
        user_id = uuid4()
        token = create_session_token(user_id)
        self.assertIsInstance(token, str)

        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        self.assertEqual(payload["sub"], str(user_id))
        self.assertIn("iat", payload)
        self.assertIn("exp", payload)
        self.assertGreater(payload["exp"], payload["iat"])

    def test_tampered_token_rejected(self):
        user_id = uuid4()
        token = create_session_token(user_id)
        tampered = token[:-4] + "abcd"
        with self.assertRaises(jwt.InvalidTokenError):
            jwt.decode(tampered, os.environ["JWT_SECRET"], algorithms=["HS256"])


class CookieAndSessionTests(unittest.TestCase):
    """Test session cookie security attributes."""

    def test_set_session_cookie_attributes(self):
        resp = Response()
        test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy"
        set_session_cookie(resp, test_token)
        cookie_header = resp.headers.get("set-cookie", "")
        self.assertIn(SESSION_COOKIE, cookie_header)
        self.assertIn("httponly", cookie_header.lower())
        self.assertIn("samesite=strict", cookie_header.lower())
        self.assertIn("max-age=28800", cookie_header.lower())  # 8 hours


class RoleBasedAccessControlTests(unittest.TestCase):
    """Test RBAC authorization dependency."""

    def test_require_roles_allows_matching_role(self):
        check_admin = require_roles("admin")
        user = {"id": uuid4(), "email": "admin@ddugu.ac.in", "role": "admin"}
        result = _step_coro(check_admin(user=user))
        self.assertEqual(result, user)

    def test_require_roles_allows_any_matching_in_tuple(self):
        check_staff = require_roles("admin", "faculty")
        user = {"id": uuid4(), "email": "faculty@ddugu.ac.in", "role": "faculty"}
        result = _step_coro(check_staff(user=user))
        self.assertEqual(result, user)

    def test_require_roles_blocks_unauthorized_role(self):
        check_admin = require_roles("admin")
        student_user = {"id": uuid4(), "email": "student@ddugu.ac.in", "role": "student"}
        with self.assertRaises(HTTPException) as ctx:
            _step_coro(check_admin(user=student_user))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("permission", ctx.exception.detail.lower())


class RouteRegistrationTests(unittest.TestCase):
    """Verify that all authentication, admin, and campus routes are properly registered on FastAPI."""

    def test_required_endpoints_registered(self):
        registered_paths = {route.path for route in app.routes if hasattr(route, "path")}
        
        required = [
            "/health",
            "/api/v1/branches",
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/auth/me",
            "/api/v1/auth/register/student",
            "/api/v1/auth/register/faculty",
            "/api/v1/admin/users",
            "/api/v1/admin/students/import",
            "/api/v1/admin/students/export",
            "/api/v1/admin/bookings/export",
            "/api/v1/admin/audit/export",
            "/api/v1/admin/rooms/export",
            "/api/v1/admin/schedule",
            "/api/v1/admin/settings",
            "/api/v1/admin/audit",
            "/api/v1/admin/analytics",
            "/api/v1/student/issues",
            "/api/v1/students/issues",
            "/api/v1/faculty/issues",
        ]
        for path in required:
            self.assertIn(path, registered_paths, f"Expected endpoint route {path} is registered")


if __name__ == "__main__":
    unittest.main()
