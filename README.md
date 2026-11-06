# CAMPYX / DDUGU Smart Campus Platform

CAMPYX (DDUGU Smart Campus) is a full-featured campus room coordination, academic scheduling, real-time notice board, and facilities management system designed for Deen Dayal Upadhyaya Gorakhpur University.

The system features real role-based authentication (Student, Faculty, Administrator), persistent PostgreSQL storage, Redis caching and rate-limiting, and an emerald-themed, responsive user interface.

---

## Architecture Overview

```
                      ┌───────────────────────────────┐
                      │    Nginx Reverse Proxy        │
                      │    Port 8080 (Docker) / 80    │
                      └───────┬───────────────┬───────┘
                              │               │
             Static Frontend  │               │ API Proxy (/api, /health, /public)
                              ▼               ▼
                      ┌───────────────┐  ┌─────────────────────────┐
                      │ HTML5 / CSS3  │  │ FastAPI (Python 3.12+)  │
                      │ Vanilla JS    │  │ Port 8000               │
                      └───────────────┘  └──────┬─────────────┬───┘
                                                │             │
                                  PostgreSQL 16 │             │ Redis 7
                                                ▼             ▼
                                        ┌──────────────┐ ┌─────────┐
                                        │ Database     │ │ Rate    │
                                        │ Schema & Seed│ │ Limiter │
                                        └──────────────┘ └─────────┘
```

- **Frontend**: Clean Vanilla JavaScript, CSS3 variables, semantic HTML5, zero external build tool requirement.
- **Backend**: FastAPI with async connection pooling (`psycopg_pool`), Argon2 password hashing, and PyJWT.
- **Security**: HttpOnly, SameSite=Strict cookies (`campus_session`), server-side RBAC, AbortController request timeouts.
- **Database & Cache**: PostgreSQL 16 (with schema migrations & seeds) and Redis 7 (sliding window rate-limiting).

---

## Local Development & Setup

### Prerequisites
- Node.js 20+ (for syntax, HTML validation, and unit tests)
- Python 3.11+ (with `pip`)
- Docker & Docker Compose (optional, recommended for complete stack)
- PostgreSQL 16 & Redis 7 (if running outside Docker)

---

### Method A: Running with Docker Compose (Recommended)

1. Clone or unpack the repository:
   ```sh
   cd CAMPYX-main
   ```

2. Initialize your local environment file:
   ```sh
   # On Linux/macOS:
   ./scripts/create-dev-env.sh

   # Or copy manually on Windows:
   cp .env.example .env
   ```
   *Make sure `JWT_SECRET`, `POSTGRES_PASSWORD`, and initial demo passwords in `.env` are populated.*

3. Start all services:
   ```sh
   docker compose up --build
   ```

4. The application is now live at:
   - **Homepage**: `http://localhost:8080/index.html`
   - **Student & Faculty Login/Registration**: `http://localhost:8080/portal-login.html`
   - **Admin Login**: `http://localhost:8080/admin/login/index.html`
   - **API Health**: `http://localhost:8080/health`
   - **Interactive API Docs**: `http://localhost:8000/docs` (in development mode)

---

### Method B: Standalone Local Setup (Without Docker)

#### 1. Backend Setup
```sh
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Set required environment variables
export DATABASE_URL="postgresql://campusflow:password@localhost:5432/campusflow"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET="your-32-character-or-longer-secret-key"
export APP_ENV="development"
export COOKIE_SECURE="false"

# Start the API server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
In a separate terminal, serve the root directory using any static web server:
```sh
# Using Python
python -m http.server 8080

# Or using Node http-server / serve
npx serve -l 8080 .
```

---

## Authentication & Role-Based Access

The platform uses genuine server-side authentication with Argon2id password hashing and secure, HttpOnly `campus_session` cookies.

### 1. Student Portal
- **Login & Registration URL**: `http://localhost:8080/portal-login.html?role=student`
- **Dashboard URL**: `http://localhost:8080/student-portal.html`
- **Features**: Real user registration (roll number uniqueness, dynamic branch lists, year, section, batch year validation), student schedule view, announcements filter, facilities map, issue reporting with duplicate submission protection.
- Authenticated sessions auto-redirect to `student-portal.html`. Unauthenticated attempts to access the portal redirect back to login.

### 2. Faculty Portal
- **Login & Registration URL**: `http://localhost:8080/portal-login.html?role=faculty`
- **Dashboard URL**: `http://localhost:8080/faculty-portal.html`
- **Features**: Department faculty registration, room schedule and conflict detection, instant room booking, reschedule/cancel flows, issue submission.
- Enforces role verification on all backend endpoints.

### 3. Administrator Portal
- **Admin Login URL**: `http://localhost:8080/admin/login/index.html`
- **Admin Dashboard URL**: `http://localhost:8080/admin-portal.html`
- **Security**: There is **no public admin registration form**. Students and faculty are strictly blocked from admin APIs (`403 Forbidden`).
- **Features**:
  - **Overview**: Real-time room, booking, and campus metrics.
  - **Campus Management**: Add/edit rooms, capacity source tags, room deletion/deactivation with safety checks, CSV export of campus rooms.
  - **Student Directory**: View registered students, real database CSV export, and bulk CSV student import with transactional validation.
  - **Faculty Directory**: Faculty permission controls (toggle booking rights and schedule visibility).
  - **Bookings Management**: Approve/reject pending requests, cancel bookings, real CSV export of reservations.
  - **Master Schedule**: View weekly timetable, add master schedule rows with conflict detection, delete timetable entries.
  - **Announcements**: Draft, publish, target branches/years, delete announcements.
  - **Issue Tracking**: Review facility issues, investigate, update resolution notes, resolve issues.
  - **Audit Logs**: Tamper-evident audit trail of all administrative actions with CSV export.
  - **System Settings**: Configure booking advance limits, cancellation notice policies, and provision new administrative or staff users directly.

---

## Initial Administrator Provisioning

To securely create your first administrator account without exposing a public registration route:

```sh
python scripts/create_admin.py --email admin@ddugu.ac.in --password "YourStrongPassword123!" --name "System Administrator"
```

The script:
1. Validates password complexity (minimum 8 characters).
2. Hashes the password using Argon2id.
3. Inserts the user with the `admin` role into the `users` table inside an atomic database transaction.

Subsequent administrators or faculty members can also be provisioned securely from within the Admin Portal under **Settings -> Provision Authorized User**.

---

## Testing & Verification Suite

Run all test suites across the entire application:

### Full Frontend & HTML Validation Suite
```sh
npm run validate
```
This runs:
1. `npm run check:syntax`: JavaScript syntax checks across all 8 project scripts.
2. `npm test`: Node.js test runner executing booking rule, conflict detection, and CSV parsing tests.
3. `npm run check:html`: Strict HTML5 validation across all 7 pages with zero errors.

### Backend Python API & Security Tests
```sh
python -m pytest -v backend/tests/test_api_auth.py
```
This validates:
- Pydantic models for registration, user creation, batch import, and master schedules.
- Argon2 password hashing and verification.
- JWT session token generation, signature validation, and tamper rejection.
- Session cookie attributes (`HttpOnly`, `SameSite=Strict`, `Max-Age`).
- Server-side RBAC dependency blocking unauthorized roles (`403 Forbidden`).
- API route registration across all core endpoints.

---

## Error Handling & Resiliency

- **Custom 404 Page**: `404.html` matches the CAMPYX visual branding, provides a safe "Back to Previous Page" fallback, and direct portal links. Nginx is configured to serve this page for any unknown routes while preserving API routing.
- **Network & Request Timeout**: `api-client.js` integrates a 15-second `AbortController` timeout and formats status codes (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `502`, `503`, and network drop) into user-friendly notifications.
- **Duplicate Form Submission Prevention**: All submission buttons throughout the portals display loading states and are disabled during processing.

---

## License & University Notices

CAMPYX is developed for the DDUGU Smart Campus initiative. Official branding, university seal, and high-resolution building photography should be confirmed with the university administration prior to final production release.
