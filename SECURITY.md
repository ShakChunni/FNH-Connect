# Security maintenance

Patient records, spouse information, operational mappings, credentials, and database exports must never be added to this public repository. Use synthetic examples and private operational storage. Report sensitive findings privately to the repository maintainer rather than opening a public issue containing data.

## Implemented controls

- Business APIs validate the current database user and portal in every handler. Middleware is an early navigation check, not the source of authorization. Dynamic database IDs must be complete positive integers.
- Existing patients are scoped by portal; pharmacy lookup returns the fields required for sale entry rather than full clinical records.
- JWTs require HS256 and a configured signing secret. Database idle expiry defaults to 24 hours and the signed absolute lifetime to seven days (`SESSION_ABSOLUTE_LIFETIME_HOURS`). Legacy tokens keep their original signed expiry. Portal switching rotates tokens without extending the absolute deadline. Refreshing an idle deadline does not replace the cookie, avoiding concurrent-request races.
- Production session cookies are always Secure and HttpOnly. Revoked sessions can reach login; transient network or server errors preserve established client state. Entering login requires fresh verification before redirecting a cached user.
- Unexpected failures return generic errors; deliberately raised domain failures retain actionable messages. Account credential failures use the same public message.
- New infertility charges are calculated from the catalogue. Metadata edits preserve historical prices and balances; changes to tests or discounts are validated server-side. Existing authorized discount workflows remain available.
- Response headers apply CSP, framing protection, `nosniff`, referrer and permissions policies. Production uses HSTS. CSP permits Next.js inline hydration and generated blob PDFs used by reporting, but excludes production `unsafe-eval`. Authenticated API responses use `private, no-store`.
- API quotas are per user, stored atomically in the existing PostgreSQL `RateLimit` table, and shared between instances. Login limits are shared by username and, when configured, trusted client IP. Expired limiter windows are cleaned by internal maintenance and security synchronization.
- Cron routes require a configured secret in every environment and compare hashed values in constant time.

## Deployment configuration

Use `.env.example` for names only; put actual values in private environment configuration. Generate independent random values for `SECRET_KEY` and `CRON_SECRET`. Changing the signing key invalidates existing sessions, so coordinate any necessary rotation.

Forwarded IP headers are ignored by default. Set `TRUST_PROXY_HOPS` only after confirming that ingress removes user-supplied forwarding headers and appends a trusted proxy chain. The value selects the client address from the right of `X-Forwarded-For`; it must match the actual deployment. Unidentified clients never share a blocking bucket. Shared username/user limits still apply without forwarded IP trust.

No schema migration is required for these mitigations. Deploy all code together, run Prisma client generation, and retain the existing internal cleanup schedule. Test the proxy configuration and operational account workflows in staging before production deployment.

## Verification

Run `npm ci`, `npm run db:generate`, `npm test`, `npm run typecheck`, `npm run lint`, `npm audit`, and `npm run build`. Validation scripts include real route-handler code with synthetic persistence, role/portal matrices, suffix bypasses, session expiry and concurrency, login recovery, billing, pagination, headers, and secret protections. Tests never require production database access.

The GitHub workflow repeats validation, advisory checks and a redacted Gitleaks history scan. Dependabot tracks npm and Actions updates. Repository settings such as secret scanning/push protection, private vulnerability reporting and branch protection must also be enabled in GitHub by an authorized maintainer; repository files alone cannot activate those settings. Recheck open Dependabot alerts after GitHub processes the updated lockfile.

## Historical exposure response

Patient-specific operational mappings were removed from the current tree and replaced with an explicitly synthetic example. Removing a file does not erase earlier commits. Clean all published branches/tags and coordinate a controlled history rewrite, then have collaborators reclone. GitHub pull-request refs, caches, forks and external clones can retain earlier copies; ask GitHub Support to purge affected cached views where possible. Assess the original data exposure privately. Never republish the original filenames or data in reports, issues or commits.
