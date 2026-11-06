# Security and Operations

## Prototype boundary

The current application is a static-site demonstration. Admin and Faculty routes are not protected by a server, and all portal data/actions are fictional, in-memory browser state. The Admin login screen is a route separator only; it is not authentication. Never deploy this prototype with real student, faculty, schedule, or booking data.

## Current safeguards

- GitHub Actions checks JavaScript syntax, booking-rule unit tests, HTML validity, and builds the static Nginx image.
- The Docker image serves only the page assets and admin demo route, not repository files or test fixtures.
- Nginx adds baseline browser security headers, restricts framing, applies request limiting to static pages, and exposes `/health` for container health checks.
- `scripts/backup-postgres.sh` creates a permission-restricted custom-format PostgreSQL dump and checksum when a production database is configured.

Nginx request limiting covers this static host only. It does not rate-limit a future application API. HTTPS must be terminated by a trusted production ingress or reverse proxy.

## Required before real data

Implement backend authentication and role checks; derive user identity and tenant scope on the server; validate and authorize every write; use a transaction/database exclusion constraint for booking overlaps; persist append-only audit events; rate-limit and log API requests; protect file uploads; configure HTTPS, secrets, monitoring, retention, and institutional data access policies. A frontend route or hidden link is never an authorization boundary.

## Database backup and restore

The backup script is not run by this static prototype because no PostgreSQL database exists here. Once PostgreSQL is deployed, schedule it from a protected host with `DATABASE_URL` supplied through the host's secret manager:

```sh
DATABASE_URL="$DATABASE_URL" BACKUP_DIR=/secure/backups BACKUP_RETENTION_DAYS=14 ./scripts/backup-postgres.sh
```

Copy encrypted backups to an access-controlled off-site location and regularly test recovery into a separate empty database. Verify an archive before restore with `sha256sum -c campyx-<timestamp>.dump.sha256`, then restore to a non-production target with `pg_restore --exit-on-error --no-owner --dbname="$RESTORE_DATABASE_URL" campyx-<timestamp>.dump`. Do not test restore commands against the live database.

The script requires `pg_dump`, `sha256sum`, and `find`. It does not encrypt or upload backups; those controls belong to the production backup host/storage configuration.