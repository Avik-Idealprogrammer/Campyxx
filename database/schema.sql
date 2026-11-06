CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    approximate_students INTEGER NOT NULL CHECK (approximate_students > 0),
    has_sections BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    department_id UUID REFERENCES branches(id),
    can_book BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_schedule BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS can_book BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS can_view_schedule BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    roll_number TEXT NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
    batch_year SMALLINT NOT NULL,
    section TEXT
);

CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    distance_meters INTEGER NOT NULL DEFAULT 0 CHECK (distance_meters >= 0),
    map_position JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number SMALLINT NOT NULL,
    floor_label TEXT NOT NULL,
    blueprint_path TEXT,
    UNIQUE (building_id, floor_number)
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('classroom', 'laboratory', 'seminar_hall', 'library', 'office')),
    capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
    capacity_source TEXT NOT NULL DEFAULT 'needs_configuration',
    permitted_uses TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    map_position JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (floor_id, room_number)
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 150),
    purpose TEXT NOT NULL CHECK (purpose IN ('lecture', 'extra_class', 'examination', 'practical', 'event')),
    target_branch_id UUID REFERENCES branches(id),
    target_year SMALLINT CHECK (target_year IS NULL OR target_year BETWEEN 1 AND 4),
    target_section TEXT,
    attendee_count INTEGER CHECK (attendee_count IS NULL OR attendee_count > 0),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    test_data BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bookings_valid_time CHECK (start_time < end_time),
    CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
        room_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status IN ('pending', 'approved'))
);

CREATE INDEX IF NOT EXISTS bookings_room_time_idx ON bookings (room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS bookings_faculty_time_idx ON bookings (faculty_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TABLE IF NOT EXISTS master_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
    section TEXT,
    room_id UUID NOT NULL REFERENCES rooms(id),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    test_data BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    target_branch_id UUID REFERENCES branches(id),
    target_year SMALLINT CHECK (target_year IS NULL OR target_year BETWEEN 1 AND 4),
    target_section TEXT,
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    test_data BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS announcements_public_idx ON announcements (published_at DESC) WHERE (is_public AND status = 'published');

CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    headline TEXT NOT NULL,
    image_url TEXT,
    body TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT,
    description TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 2000),
    related_room_id UUID REFERENCES rooms(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
    resolution_notes TEXT,
    test_data BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_policies (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    require_exam_approval BOOLEAN NOT NULL DEFAULT TRUE,
    require_event_approval BOOLEAN NOT NULL DEFAULT FALSE,
    advance_booking_days INTEGER NOT NULL DEFAULT 30 CHECK (advance_booking_days BETWEEN 1 AND 365),
    cancellation_notice_hours INTEGER NOT NULL DEFAULT 2 CHECK (cancellation_notice_hours BETWEEN 0 AND 168)
);

INSERT INTO booking_policies (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);