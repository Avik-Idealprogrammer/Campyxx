#!/usr/bin/env python3
"""Secure initial administrator provisioning CLI for CAMPYX / DDUGU Smart Campus.

Usage:
    python scripts/create_admin.py --email admin@ddugu.ac.in --name "System Administrator"
    (Will prompt for password securely if --password is not passed)
"""

import argparse
import getpass
import os
import sys
from uuid import uuid4

try:
    import psycopg
    from psycopg.rows import dict_row
    from psycopg.types.json import Jsonb
    from pwdlib import PasswordHash
except ImportError:
    print("Error: Missing required packages (psycopg, pwdlib). Run: pip install -r backend/requirements.txt", file=sys.stderr)
    sys.exit(1)

password_hash = PasswordHash.recommended()


def get_db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("Error: DATABASE_URL environment variable is required.", file=sys.stderr)
        print("Example: DATABASE_URL=postgresql://campus_app:secret@localhost:5432/campus_core", file=sys.stderr)
        sys.exit(1)
    return url


def parse_args():
    parser = argparse.ArgumentParser(description="Create or update an administrator account.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", default="Campus Administrator", help="Display name for administrator")
    parser.add_argument("--password", help="Administrator password (if omitted, will prompt securely)")
    return parser.parse_args()


def main():
    args = parse_args()
    email = args.email.strip().lower()

    if "@" not in email or len(email) < 5:
        print("Error: A valid email address is required.", file=sys.stderr)
        sys.exit(1)

    password = args.password
    if not password:
        password = getpass.getpass("Enter administrator password (min 12 characters): ")
        confirm = getpass.getpass("Confirm administrator password: ")
        if password != confirm:
            print("Error: Passwords do not match.", file=sys.stderr)
            sys.exit(1)

    if len(password) < 12:
        print("Error: Administrator password must be at least 12 characters long for security.", file=sys.stderr)
        sys.exit(1)

    hashed = password_hash.hash(password)
    db_url = get_db_url()

    print(f"Connecting to database to provision administrator '{email}'...")
    try:
        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.transaction():
                user = conn.execute(
                    """INSERT INTO users (email, password_hash, role, is_active)
                       VALUES (%s, %s, 'admin', TRUE)
                       ON CONFLICT (email) DO UPDATE
                       SET password_hash = EXCLUDED.password_hash,
                           role = 'admin',
                           is_active = TRUE
                       RETURNING id""",
                    (email, hashed),
                ).fetchone()

                conn.execute(
                    """INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
                       VALUES (%s, 'ADMIN_PROVISION_CLI', 'user', %s, %s)""",
                    (user["id"], user["id"], Jsonb({"email": email, "display_name": args.name.strip()})),
                )

        print(f"Success: Administrator account '{email}' has been created/updated with ID: {user['id']}")
        print("You can now sign in at /admin/login/ with these credentials.")
    except Exception as exc:
        print(f"Database error while provisioning administrator: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
