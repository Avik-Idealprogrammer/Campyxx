#!/bin/sh
set -eu

: "${DATABASE_URL:?Set DATABASE_URL to the PostgreSQL connection string}"
BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

case "$RETENTION_DAYS" in
  ''|*[!0-9]*) printf '%s\n' "BACKUP_RETENTION_DAYS must be a positive integer" >&2; exit 2 ;;
esac
if [ "$RETENTION_DAYS" -lt 1 ]; then
  printf '%s\n' "BACKUP_RETENTION_DAYS must be at least 1" >&2
  exit 2
fi

umask 077
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$BACKUP_DIR/campyx-$timestamp.dump"
temporary="$archive.partial"
trap 'rm -f "$temporary"' EXIT HUP INT TERM

pg_dump --format=custom --no-owner "$DATABASE_URL" > "$temporary"
mv "$temporary" "$archive"
sha256sum "$archive" > "$archive.sha256"
find "$BACKUP_DIR" -type f -name 'campyx-*.dump*' -mtime "+$RETENTION_DAYS" -delete
printf 'Created backup: %s\n' "$archive"