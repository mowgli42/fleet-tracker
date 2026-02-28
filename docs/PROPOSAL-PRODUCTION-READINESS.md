# Production-Readiness Proposal: Fleet Tracker

This document covers production-relevant requirements and design for fleet-tracker: **security**, **data lifecycle** (backup, archive), **mobile VIN scanning**, and a **driver-facing status board with unique URLs**. Implementation follows Phase 2 (FastAPI + DB) and may extend into further phases.

---

## 1. Purpose

Fleet-tracker is currently a mockup/prototype (Phase 1: JSON + SvelteKit, no backend). To run in production with real users and data, additional steps are required beyond the Phase 2 API and database:

- **Security** – Authentication, authorization, and API/data protection.
- **Data lifecycle** – Backups, restore procedures, and archiving of legacy jobs and sold/retired vehicles.
- **Mobile** – Phone apps that scan VINs to identify vehicles and open intake or vehicle detail.
- **Driver-facing** – A status board and stable unique URL per driver/assignment so drivers can see their assigned vehicle and status without editing the system.

This proposal defines requirements and design for these areas; implementation order is suggested at the end.

---

## 2. Security requirements

### 2.1 Authentication

- **How users log in:** SSO (e.g. OAuth/SAML), username/password, or API keys for mobile/integrations. Choose based on organizational needs.
- **No credentials in frontend:** Do not store passwords or long-lived secrets in the SvelteKit app. Use tokens (e.g. JWT) or session cookies issued by the backend after successful auth.
- **Token/session handling:** Access and refresh tokens (if JWT) or session cookies with appropriate scope, expiry, and secure flags (HTTPS-only, SameSite).

### 2.2 Authorization

- **Roles:** Define at least: fleet admin, mechanic, driver (or similar). Example:
  - **Fleet admin:** Full access (edit vehicles, jobs, parts; intake/checkout/release; manage users/roles).
  - **Mechanic:** Edit vehicles and jobs, intake/release, view parts and OBD2; no user management.
  - **Driver:** View only assigned vehicle (or read-only status board / unique URL); no edit.
- **Enforcement:** Backend enforces role checks on every write and on sensitive reads; frontend hides UI by role but must not be the only control.

### 2.3 API security

- **HTTPS only** in production; no sensitive data in query strings (use body or headers for tokens and secrets).
- **Rate limiting** on auth and public endpoints to reduce abuse and brute force.
- **Input validation and sanitization** on all API inputs; parameterized queries and ORM to avoid injection.
- **CORS** configured to allow only trusted origins (e.g. the SvelteKit app origin).

### 2.4 Data

- **PII:** Driver names, contact info, and similar; define retention and access policy; restrict to roles that need it.
- **Optional encryption at rest** for sensitive fields (e.g. driver contact) if required by policy or compliance.

---

## 3. Database backup and archive

### 3.1 Backup

- **Regular automated backups** of the database (and any file storage used for uploads).
- **Retention policy:** Define how long backups are kept (e.g. 30 days daily, 12 months monthly).
- **Restore procedure:** Document and periodically test restore from backup to a staging environment.
- **Point-in-time recovery:** Consider if required for compliance (e.g. WAL archiving for PostgreSQL).

### 3.2 Archive of legacy jobs and sold vehicles

- **Policy:** When a vehicle is sold or retired, archive its data so it no longer appears in active fleet views and reports, but remains available for compliance and audit.
- **Schema:** Represent “sold” or “retired” in the schema, e.g.:
  - Vehicle status (e.g. `retired`, `sold`) or a **`disposedAt`** timestamp; and/or
  - Move vehicle and related records to an **archive table** or **archive schema/DB**.
- **Behavior:** Active views (fleet list, dashboard, maintenance) exclude archived vehicles; read-only history/export or admin “view archive” can still access archived data.
- **Scope:** Define what is archived (vehicle row, maintenance_jobs, vehicle_events, obd2_snapshots, etc.) and retention for archive (e.g. 7 years for audit).

---

## 4. Phone apps that scan VINs

### 4.1 Goal

A mobile app (or PWA) that scans a vehicle VIN (barcode or camera/OCR) to quickly identify the vehicle and open intake or vehicle detail.

### 4.2 Requirements

- **VIN on vehicle:** VIN must be stored on the vehicle record (required in production; optional in Phase 1).
- **Match:** Scan result is matched to a vehicle (exact match or search by VIN/last digits).
- **Deep link / navigation:** After match, open intake form or vehicle detail for that vehicle. Optional: push or sync OBD2 readout from a separate device/app.

### 4.3 Scope

- **Proposal only** in this document; no implementation in Phase 2 unless explicitly specified.
- May be a **separate mobile project** that calls the same FastAPI backend (REST or dedicated endpoints for mobile).

---

## 5. User webpage: status board and unique URL for assigned car

### 5.1 Status board

- **Purpose:** Public or authenticated dashboard showing high-level fleet status for office display or managers.
- **Content:** Counts by status (ready, in-use, in maintenance), next due services, or a simple list of vehicles and status. Read-only; optional filters.
- **Auth:** Either public (read-only, no PII) or authenticated (e.g. manager role).

### 5.2 Unique URL for drivers

- **Purpose:** Each driver (or assignment) has a stable, unique URL (e.g. `/track/abc123` where `abc123` is a token or slug tied to the assignment or vehicle).
- **Page content:** Assigned vehicle (name, VIN last-4 if desired), current status (ready, in-use, in maintenance), next service, and optionally last known odometer or “in shop” message. No edit; no sensitive data beyond what the driver is allowed to see.
- **Token:** Token generation and storage (e.g. in DB, link vehicle or assignment to token); token rotation or expiry if needed.
- **Security:** Tokens must be unguessable (e.g. random, long); consider expiry and revocation. Rate limit and optional CAPTCHA for public token pages if abuse is a concern.

---

## 6. Implementation order (production)

After Phase 2 (API, DB, auth) is in place:

1. **Backup/restore and archive policy** – Implement automated backups, restore procedure, and archive of legacy jobs and sold/retired vehicles first.
2. **Driver unique-URL and status board** – Implement token-based driver page and optional status board.
3. **Mobile VIN scan app** – Implement if desired; can be a separate project consuming the same FastAPI backend.

Security (auth, roles, API hardening) is part of Phase 2; the items above build on that foundation.
