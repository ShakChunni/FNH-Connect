# FNH Connect — Documentation

FNH Connect is a full-stack healthcare operations portal built on Next.js (App Router) with Prisma and PostgreSQL. The system manages patient admissions, infertility and pathology workflows, hospital-wide cash tracking, and administrative audit logging with strong security and accountability controls.

This document is a full on guide for the application, covering architecture, domain flows, security, operations, and deployment considerations.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Key Capabilities](#key-capabilities)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Core Domain Model (Prisma)](#core-domain-model-prisma)
6. [Authentication & Session Management](#authentication--session-management)
7. [Security Controls](#security-controls)
8. [Cash Flow & Accountability](#cash-flow--accountability)
9. [API Surface (App Router)](#api-surface-app-router)
10. [Environment Configuration](#environment-configuration)
11. [Local Setup & Developer Workflow](#local-setup--developer-workflow)
12. [Scripts & Maintenance Utilities](#scripts--maintenance-utilities)
13. [Deployment](#deployment)
14. [CI/CD Pipelines](#cicd-pipelines)
15. [Operational Notes & Troubleshooting](#operational-notes--troubleshooting)

---

## Product Overview

FNH Connect is designed for hospital operations staff to manage:

- Patient admissions and discharge workflows (General Admission)
- Infertility department patient tracking
- Pathology tests and reports
- Cash collection, reconciliation, and audit trails
- Administrative monitoring, user activity logs, and security oversight

The system emphasizes **financial accountability**, **auditability**, and **secure access control**. All patient and payment activities are logged and traceable by staff and shift.

---

## Key Capabilities

- **Unified patient record management** across departments
- **Shift-based cash tracking** with opening/closing balances and variance
- **Centralized patient account ledger** with service-level payment allocation
- **Role-based access control** with admin-only sections
- **CSRF protection** and **edge-level rate limiting**
- **Audit logging** for security and user actions
- **Bangladesh time zone alignment** for daily reporting

---

## System Architecture

### Frontend
- Next.js App Router
- React 19 client components where needed
- Tailwind CSS + Radix UI for consistent UI primitives
- React Query for data fetching and caching
- Zustand for local module state stores

### Backend
- Next.js Route Handlers (REST-style endpoints)
- Prisma ORM with PostgreSQL
- Server-side session validation utilities
- Service-layer architecture for domain logic

### Data Layer
- Prisma schema defines all domain entities and indexes
- Database migrations in prisma/migrations
- Scripted data maintenance utilities in scripts

---

## Project Structure

### Root
- [package.json](package.json) — scripts and dependencies
- [next.config.mjs](next.config.mjs) — Next.js configuration
- [CASH_FLOW_SYSTEM.md](CASH_FLOW_SYSTEM.md) — deep dive into cash accountability system
- [prisma/schema.prisma](prisma/schema.prisma) — full database schema

### App Router Structure
- [src/app](src/app)
  - Route groups:
	 - (auth): authentication pages
	 - (authenticated): protected application areas
  - API routes under src/app/api
  - Shared layout, metadata, and global providers

### Components & UI
- [src/components](src/components) — shared UI primitives and page-level components
- [src/hooks](src/hooks) — reusable client hooks

### Core Logic
- [src/lib](src/lib) — security, auth helpers, CSRF utilities, Prisma clients
- [src/services](src/services) — domain service layer for admissions, pathology, infertility, shifts, activity logs

### Scripts & Maintenance
- [scripts](scripts) — data cleanup, migrations, seed tools, and utilities

---

## Core Domain Model (Prisma)

The Prisma schema is the authoritative domain model. Key entities include:

### Patient & Staff
- Patient — central identity record
- Staff — hospital employees with roles
- User — login credentials attached to Staff
- StaffDepartment — staff assignment to departments

### Admissions & Department Workflows
- Admission — general admission lifecycle with full billing fields
- PathologyTest — pathology orders with result tracking
- InfertilityPatient — infertility-specific workflow with extra clinical fields
- Department — hospital departments and services

### Financial System (Cash Flow)
- PatientAccount — centralized ledger per patient
- ServiceCharge — itemized billables
- Payment — cash/card payments linked to shifts
- PaymentAllocation — splits payments across service charges
- Shift — staff shift and cash reconciliation
- CashMovement — immutable cash movement ledger

### Security & Audit
- Session — active sessions with device info
- ActivityLog — user actions with device context
- SecurityLog — suspicious activity tracking
- BlockedIP — blocked IP registry
- RateLimit — IP-based rate-limits
- LoginAttempt — login attempts for brute-force detection

Full details are defined in [prisma/schema.prisma](prisma/schema.prisma) and cash system specifics in [CASH_FLOW_SYSTEM.md](CASH_FLOW_SYSTEM.md).

---

## Authentication & Session Management

Authentication uses username/password with JWT-backed session tokens stored in the database. Session behavior:

- Session token is stored in an httpOnly cookie
- Session validation occurs in both middleware and server components
- Auth context on the client polls /api/auth/verify-session
- Session auto-refreshes if less than 2 hours remaining

Key files:
- [src/lib/auth-validation.ts](src/lib/auth-validation.ts)
- [src/app/AuthContext.tsx](src/app/AuthContext.tsx)
- [src/app/MainContent.tsx](src/app/MainContent.tsx)
- [src/app/api/auth/verify-session/route.ts](src/app/api/auth/verify-session/route.ts)

---

## Security Controls

Security is enforced at multiple layers:

### Edge Middleware
- Rate limiting (general + API)
- Suspicious path detection (blocks scanners)
- IP blocking cache
- Session-based routing protection

See [src/middleware.ts](src/middleware.ts).

### CSRF Protection
- Double-submit cookie pattern
- Required for all state-changing requests

See [src/lib/csrfProtection.ts](src/lib/csrfProtection.ts) and [src/lib/fetchWithCSRF.ts](src/lib/fetchWithCSRF.ts).

### Security Sync & Cron
- Middleware logs are synced to DB via cron
- Blocked IPs are fetched and synced back into middleware

Endpoints:
- /api/security/sync
- /api/security/middleware-sync
- /api/security/blocked-ips

Implementations:
- [src/app/api/security/sync/route.ts](src/app/api/security/sync/route.ts)
- [src/app/api/security/blocked-ips/route.ts](src/app/api/security/blocked-ips/route.ts)

---

## Cash Flow & Accountability

The financial system is designed to maintain a complete audit trail for each rupee collected:

- Staff shift must be active to collect payments
- Each payment is linked to a shift and staff member
- Payments are allocated to service charges
- Cash movements record every collection and refund
- Shift reconciliation calculates variance between physical and system cash

For the full design and examples, see [CASH_FLOW_SYSTEM.md](CASH_FLOW_SYSTEM.md).

---

## API Surface (App Router)

All API routes live under [src/app/api](src/app/api). Major endpoints include:

### Authentication
- /api/auth/login
- /api/auth/logout
- /api/auth/verify-session

### Admissions / Patients
- /api/admissions
- /api/patient-records
- /api/departments
- /api/staff/doctors

### Dashboard
- /api/dashboard
- /api/dashboard/admin-shifts
- /api/dashboard/session-cash

### Infertility
- /api/infertility-patients

### Pathology
- /api/pathology-patients
- /api/pathology-patients/status

### Cash Tracking
- /api/admin/cash-tracking
- /api/shifts/end

### Admin & Logs
- /api/admin/activity-logs

Each route relies on service-layer logic in [src/services](src/services).

---

## Environment Configuration

The application depends on the following environment variables (see .env):

### Database
- DATABASE_URL
- DATABASE_URL_NON_POOLING

### Security & Auth
- SECRET_KEY
- CRON_SECRET

### CSRF
- CSRF_TOKEN_ENABLED
- CSRF_TOKEN_LENGTH

### Rate Limiting
- RATE_LIMIT_WINDOW_MINUTES
- RATE_LIMIT_MAX_REQUESTS
- API_RATE_LIMIT_WINDOW_MINUTES
- API_RATE_LIMIT_MAX_REQUESTS

### Session Cookies
- SESSION_EXPIRATION_HOURS
- SESSION_COOKIE_SECURE
- SESSION_COOKIE_HTTP_ONLY
- SESSION_COOKIE_SAME_SITE

### Maintenance
- NEXT_PUBLIC_MAINTENANCE

### App
- NEXT_PUBLIC_APP_URL
- NODE_ENV

---

## Local Setup & Developer Workflow

1. Install dependencies
	- npm install

2. Configure environment variables
	- Copy .env.example if present and supply your local values

3. Generate Prisma client
	- npx prisma generate

4. Apply migrations
	- npx prisma migrate dev

5. Seed or repair data (optional)
	- npm run db:seed
	- npm run db:fix-payments
	- npm run db:fix-cash-tracking

---

## Scripts & Maintenance Utilities

Scripts are defined in [package.json](package.json). Key scripts:

- dev — start local server (turbopack)
- build / build:clean / build:production — production build pipelines
- db:generate — Prisma client generation
- db:push — push schema without migration (dev)
- db:seed — seed baseline data
- db:studio — Prisma Studio
- db:fix-payments — fix payment allocations
- db:fix-cash-tracking — repair cash tracking data
- db:cleanup-test — cleanup test data

Data utilities in [scripts](scripts) include user setup, data fixes, and migration helpers.

---

## Deployment

This is a standard Next.js 15 App Router application with Prisma and PostgreSQL.

### Build Process
Typical production build steps:

1. npm ci
2. npx prisma generate
3. npm run build

### Runtime Requirements
- Node.js runtime
- Access to PostgreSQL (DATABASE_URL)
- Secrets configured for authentication and cron jobs

### Maintenance Mode
Enable maintenance mode by setting:
- NEXT_PUBLIC_MAINTENANCE=true

This swaps the app UI with the maintenance screen in [src/app/Maintenance.tsx](src/app/Maintenance.tsx).

---

## CI/CD Pipelines

There are no CI/CD workflow files currently present under .github/workflows. If you want CI/CD, a recommended pipeline includes:

1. Install dependencies with npm ci
2. Run lint (if configured)
3. Generate Prisma client (npx prisma generate)
4. Run tests (if present)
5. Build Next.js output
6. Deploy to target environment

Suggested deployment targets:
- Vercel
- Docker + managed Node runtime
- Any Node hosting platform with PostgreSQL access

For production, ensure that cron jobs are configured to call the security sync endpoints with x-cron-secret.

---

## Operational Notes & Troubleshooting

### Common Issues
- **Login failures:** check SECRET_KEY and database connectivity
- **CSRF errors:** ensure csrf-token cookie exists and client uses fetchWithCSRF
- **Blocked IPs:** verify /api/security/blocked-ips access with CRON_SECRET
- **Session expiry:** verify SESSION_EXPIRATION_HOURS and database cleanup

### Observability
- Activity logs stored in ActivityLog
- Security logs stored in SecurityLog
- Shift reconciliation in Shift + CashMovement

---

## Appendix — Key Files

- [src/middleware.ts](src/middleware.ts) — security, rate limiting, routing guard
- [src/lib/auth-validation.ts](src/lib/auth-validation.ts) — server auth utilities
- [src/lib/csrfProtection.ts](src/lib/csrfProtection.ts) — CSRF token logic
- [src/services](src/services) — service layer for all modules
- [prisma/schema.prisma](prisma/schema.prisma) — data model
- [CASH_FLOW_SYSTEM.md](CASH_FLOW_SYSTEM.md) — finance system documentation
