# MAINT-003: Migrate Deployment from Raspberry Pi to Uberspace

**Type**: Maintenance / Infrastructure
**Effort**: 13 story points
**Priority**: P1 (Must Have)
**Status**: Planned
**Phase**: Deployment
**Order**: TBD

---

## Description

Move the Mixer app from the self-hosted Raspberry Pi (Docker Compose + Caddy +
PostgreSQL) to Uberspace shared hosting, served under the sub-path
`https://matt-maxx.de/rezepte`. In the same effort:

1. Switch the production database from **PostgreSQL to SQLite** (existing data is
   migrated, not discarded).
2. Replace the manual `scripts/deploy-pi.sh` flow with an **automated GitHub
   Action that deploys on merge to `main`** (same pattern as the existing Picnic
   app).

This ticket is the single source of truth for the migration. It is split into
independent phases; each phase is its own PR / session so context stays small.

## Context (analysis of current state)

- **Current:** Pi with Docker Compose (`docker-compose.production.yml`): Next.js
  app on port 3001 + `caddy:2-alpine` reverse proxy (ports 80/443) +
  `postgres:16-alpine`. Manual deploy via `scripts/deploy-pi.sh` over SSH.
- **Good news:** `src/lib/db/init.ts` already fully supports SQLite. When
  `DATABASE_URL=file:...` is set, everything runs through `better-sqlite3` and
  migrations are applied automatically (including the `SERIAL` →
  `INTEGER PRIMARY KEY AUTOINCREMENT` conversion). **No DB-layer code change is
  required** for the engine switch — it is configuration.
- **Target host:** Uberspace. No Docker, no root. Node processes run under
  `supervisord`; web routing via `uberspace web backend`. TLS (Let's Encrypt) is
  handled automatically by the Uberspace web frontend — **Caddy and ports 80/443
  are dropped entirely.**
- **Node on host:** v22.x. Project `engines` is `>=18.0.0`, so Node 22 is fine.
  `better-sqlite3 ^11.7.0` and Next 15 both support Node 22.

## Key risks / decisions

1. **Sub-path `/rezepte`** — Next.js needs `basePath`. `next/link` and the router
   are rewritten automatically, but **manual `fetch('/api/...')` calls in client
   code are NOT**. These must be audited and made base-path aware. A missed fetch
   only surfaces in production under `/rezepte`. (Highest-risk phase → do on Opus.)
2. **`better-sqlite3` is a native module** → it must be compiled against the
   host's Node 22 ABI. Therefore **build on the host** (`npm ci` over SSH), do not
   upload prebuilt artifacts from CI.
3. **Data migration is one-time** and runs locally (Pi PostgreSQL → SQLite file),
   then the resulting `.db` is copied to Uberspace once.

## Recommended execution order, phases & model

| Phase | Scope | PR | Suggested model |
|-------|-------|----|-----------------|
| 1 | Code: `basePath` + client fetch audit + auth/cookie URLs | PR #1 | **Opus** (risky reasoning) |
| 2 | One-off `pg → sqlite` data migration script | PR #2 | Sonnet |
| 3 | Uberspace host setup (manual on server, documented) | docs only | — |
| 4 | GitHub Action deploy + supervisord template + setup docs | PR #3 | Sonnet |
| 5 | Cleanup + `CLAUDE.md` / stack updates + verification report | PR #4 | Sonnet |

---

## Phase 1 — Application code changes

**Goal:** App runs correctly under a configurable base path; SQLite in prod.

- [ ] `next.config.js`: introduce env-driven `basePath` + `assetPrefix`
      (`BASE_PATH` empty in dev, `/rezepte` in prod). Update
      `NEXT_PUBLIC_API_BASE_URL`.
- [ ] Add a central `apiUrl()` / base-path helper in `src/lib/` and route all
      client-side `fetch('/api/...')` calls through it. (Note: BUG-004 already
      consolidated some fetch logic — extend that helper rather than inventing a
      new pattern.)
- [ ] Audit every hardcoded absolute path in client code (`fetch`, redirects,
      image `src`, `router.push` edge cases).
- [ ] Auth: set `NEXTAUTH_URL=https://matt-maxx.de/rezepte`; verify JWT httpOnly
      cookie `path` (restrict to `/rezepte` or keep `/` — decide and document).
- [ ] No change to `src/lib/db/init.ts`; production simply sets
      `DATABASE_URL=file:<absolute path to mixer.db>`. Keep the `pg` dependency
      (still used by tests — YAGNI, do not remove).
- [ ] Add `.nvmrc` with `22` to align local dev with the host.
- [ ] Tests green; build succeeds with `BASE_PATH=/rezepte`.

**TDD note:** add/adjust a unit test for the `apiUrl()` helper (base-path
prefixing) before implementing it.

## Phase 2 — Data migration (one-time, run locally)

**Goal:** Existing Pi PostgreSQL data ends up in a SQLite file.

- [ ] `scripts/migrate-pg-to-sqlite.ts`: connect to Pi PostgreSQL via `pg`
      (over SSH tunnel), write to a fresh `mixer.db` via `better-sqlite3`, copying
      tables in FK order using the existing models.
- [ ] Verify: per-table row-count parity + a manual login test against the SQLite
      copy.
- [ ] Copy the resulting `mixer.db` once to `~/data/mixer.db` on Uberspace via
      `scp` (operational step, not in CI).

## Phase 3 — Uberspace host setup (manual, documented)

**Goal:** Reproducible server bring-up documented in
`docs/deployment/uberspace-setup.md`.

- [ ] `uberspace tools version use node 22`
- [ ] `git clone` app to `~/mixer`, `npm ci`, `npm run build`
- [ ] Place migrated DB at `~/data/mixer.db`
- [ ] Secrets in `~/mixer/.env.production` (NOT in repo): `JWT_SECRET`,
      `NEXTAUTH_SECRET`, `DATABASE_URL=file:/home/mattmaxx/data/mixer.db`,
      `NEXTAUTH_URL=https://matt-maxx.de/rezepte`, `BASE_PATH=/rezepte`,
      `PORT=8723`.
- [ ] supervisord service `~/etc/services.d/mixer.ini` (template committed under
      `deploy/mixer.ini`), then `supervisorctl reread && update && start mixer`.
- [ ] `uberspace web backend matt-maxx.de/rezepte --http --port 8723`.

**Resolved inputs:** Uberspace user = `mattmaxx`; app port = `8723` (confirm it is
free on first setup with `ss -tlpn` and adjust if taken); domain `matt-maxx.de` is
already pointed at Uberspace. Secret *values* still go into GitHub secrets / host
env only — never the repo.

## Phase 4 — CI deploy (GitHub Action)

**Goal:** Merge to `main` → automatic deploy (same pattern as Picnic app).

- [ ] `.github/workflows/deploy.yml`: trigger `push` on `main`.
- [ ] Job: (optional) lint + tests on Node 22, then SSH to Uberspace
      (`appleboy/ssh-action` or equivalent) and run:
      `cd ~/mixer && git fetch && git reset --hard origin/main && npm ci && npm run build && supervisorctl restart mixer`.
- [ ] GitHub secrets: `UBERSPACE_SSH_KEY`, `UBERSPACE_HOST`, `UBERSPACE_USER`.
      Add the public key to `~/.ssh/authorized_keys` on Uberspace.
- [ ] Optional post-deploy smoke test against `https://matt-maxx.de/rezepte`.

## Phase 5 — Cleanup & documentation

- [ ] Mark the Pi stack as deprecated (keep files for now): note in
      `docs/deployment/raspberry-pi-setup.md`.
- [ ] Update `CLAUDE.md`: tech-stack table (CI/CD → GitHub Actions to Uberspace;
      prod DB → SQLite; Node 22), Architecture Notes, Common Commands.
- [ ] Write `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` +
      `docs/deployment/ACCEPTANCE-TESTS-MAINT-003.md` (mirror MAINT-002 format).

---

## Acceptance Criteria

- [ ] App reachable at `https://matt-maxx.de/rezepte` over HTTPS.
- [ ] All app functionality works under the `/rezepte` sub-path (no broken API
      calls, assets, or auth).
- [ ] Production runs on SQLite; pre-existing Pi data is present and correct.
- [ ] Merge to `main` triggers a successful automated deploy with no manual steps.
- [ ] `better-sqlite3` builds and runs on the host's Node 22.
- [ ] No secrets committed to the repository.
- [ ] `CLAUDE.md` and deployment docs reflect the new setup.

## Dependencies

- Uberspace user `mattmaxx`, port `8723`, domain `matt-maxx.de` (all confirmed).
- SSH key pair for CI deploy (public key → `~/.ssh/authorized_keys` on Uberspace;
  private key → GitHub secret `UBERSPACE_SSH_KEY`).

## Out of Scope

- Removing the `pg` dependency or the Pi deployment files (deprecate, don't delete).
- Any feature/behavior change beyond the path and DB-engine switch.

## New / changed files (overview)

| File | Action |
|------|--------|
| `next.config.js` | basePath / assetPrefix |
| `src/lib/` api-url helper + client fetches | new / refactor |
| `.nvmrc` | new (`22`) |
| `scripts/migrate-pg-to-sqlite.ts` | new (one-off) |
| `deploy/mixer.ini` | new (supervisord template) |
| `.env.production.example` | new |
| `.github/workflows/deploy.yml` | new |
| `docs/deployment/uberspace-setup.md` | new |
| `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` | new |
| `CLAUDE.md` | stack update |
