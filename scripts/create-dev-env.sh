#!/bin/sh
set -eu

if [ -e .env ]; then
  printf '%s\n' ".env already exists; refusing to overwrite it." >&2
  exit 1
fi
if ! command -v openssl >/dev/null 2>&1; then
  printf '%s\n' "openssl is required to generate local development secrets." >&2
  exit 1
fi

umask 077
{
  printf '%s\n' "APP_ENV=development"
  printf '%s\n' "POSTGRES_DB=campusflow" "POSTGRES_USER=campusflow"
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 32)"
  printf '%s\n' "COOKIE_SECURE=false" "DEMO_SEED_USERS=true"
  printf '%s\n' "DEMO_ADMIN_EMAIL=admin.demo@example.invalid"
  printf 'DEMO_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 18)"
  printf '%s\n' "DEMO_FACULTY_EMAIL=faculty.demo@example.invalid"
  printf 'DEMO_FACULTY_PASSWORD=%s\n' "$(openssl rand -hex 18)"
  printf '%s\n' "DEMO_STUDENT_EMAIL=student.demo@example.invalid"
  printf 'DEMO_STUDENT_PASSWORD=%s\n' "$(openssl rand -hex 18)"
} > .env
chmod 600 .env

printf '%s\n' "Created .env with unique local credentials (mode 600)." "Read the demo emails and generated passwords from .env locally; they are not printed here." "Start the stack with: docker compose up --build"