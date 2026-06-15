# MAINT-003: Migrate Deployment from Raspberry Pi to Uberspace

**Type**: Maintenance / Infrastructure
**Effort**: 13 story points
**Priority**: P1 (Must Have)
**Status**: Done
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
   upload prebuilt artifacts from CI. Pinned to `^10.1.0` (down from `^11.x`) —
   see Phase 3 notes.
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

- [x] `next.config.js`: introduce env-driven `basePath` + `assetPrefix`
      (`BASE_PATH` empty in dev, `/rezepte` in prod). Expose
      `NEXT_PUBLIC_BASE_PATH` to the client.
- [x] Add a central `apiUrl()` base-path helper in `src/lib/api-url.ts` and route
      all client-side `fetch('/api/...')` calls through it (including the
      `apiCall` wrapper in `src/lib/api.ts` and the `useFetch` call sites).
- [x] Audit every hardcoded absolute path in client code: all `fetch` /
      `new URL` / `useFetch` API paths now go through `apiUrl()`; the raw
      `<a href="/recipes/new">` in `RecipeList` was converted to `next/link`
      (which is base-path aware). `router.push` is handled automatically by Next.
- [x] Auth: JWT httpOnly cookie `path` is now scoped to `process.env.BASE_PATH`
      (falls back to `/`) in `src/lib/auth/middleware.ts`, so the cookie is not
      shared with other apps on `matt-maxx.de`. `NEXTAUTH_URL` is an env value set
      on the host (Phase 3), no code change needed.
- [x] No change to `src/lib/db/init.ts`; production simply sets
      `DATABASE_URL=file:<absolute path to mixer.db>`. `pg` dependency kept.
- [x] Add `.nvmrc` with `22`.
- [x] Tests green (435/435, incl. new `api-url.test.ts`); `npm run build` with
      `BASE_PATH=/rezepte` **succeeds end-to-end** (22/22 static pages). See the
      resolved build issue below.

**TDD note:** the `apiUrl()` unit test (`src/__tests__/lib/api-url.test.ts`) was
written and made to fail before implementing the helper.

### ✅ Resolved pre-existing build blocker (NODE_ENV)

While verifying the build, `next build` failed during static export with the
misleading `Error: <Html> should not be imported outside of pages/_document`
while prerendering `/404`. Confirmed **pre-existing** (reproduced on the untouched
baseline at commit `fa00030`, without any Phase 1 change and without `BASE_PATH`),
so unrelated to the sub-path work.

**Root cause:** the environment had `NODE_ENV=development` set (Next warned
"non-standard NODE_ENV value"). This is a known Next 15.1.6+ App Router bug
(vercel/next.js discussion #77262): a non-standard `NODE_ENV` during `next build`
makes Next mis-generate the legacy pages error pages, surfacing the spurious Html
error. No `next/document` import exists anywhere in `src`.

**Fix:** `package.json` build script now pins `NODE_ENV=production`
(`"build": "NODE_ENV=production next build"`), so builds are correct regardless of
ambient `NODE_ENV` — locally, in CI, and on the Uberspace host. Build verified
green afterwards even with `NODE_ENV=development` still in the shell.

## Phase 2 — Data migration (one-time, run locally)

**Goal:** Existing Pi PostgreSQL data ends up in a SQLite file.

- [x] `scripts/migrate-pg-to-sqlite.ts`: connect to Pi PostgreSQL via `pg`
      (over SSH tunnel), write to a fresh `mixer.db` via `better-sqlite3`, copying
      tables in FK order using the existing models.
- [x] Verify: per-table row-count parity built into the script (prints a
      report and exits non-zero on mismatch); a manual login test against the
      SQLite copy remains an operational step before copying to Uberspace.
- [ ] Copy the resulting `mixer.db` once to `~/data/mixer.db` on Uberspace via
      `scp` (operational step, not in CI).

**TDD note:** this is a one-off operational migration script with no
application-facing behavior (TDD exception per `.claude/rules/v-model.md`).
It was verified manually against a local PostgreSQL instance seeded with
representative rows covering every table, including booleans, decimals,
timestamps, NULLs and self-referencing foreign keys (`recipes.canonical_id`);
the row-count report matched for all 11 tables and the copied data, types and
SQLite autoincrement sequences were inspected and confirmed correct.

## Phase 3 — Uberspace host setup (manual, documented)

**Goal:** Reproducible server bring-up documented in
`docs/deployment/uberspace-setup.md`.

- [x] `uberspace tools version use node 22`
- [x] `git clone` app to `~/mixer`, `npm ci`, `npm run build`
- [x] Place migrated DB at `~/data/mixer.db`
- [x] Secrets in `~/mixer/.env.production` (NOT in repo): `JWT_SECRET`,
      `NEXTAUTH_SECRET`, `DATABASE_URL=file:/home/mattmaxx/data/mixer.db`,
      `NEXTAUTH_URL=https://matt-maxx.de/rezepte`, `BASE_PATH=/rezepte`,
      `PORT=8723`.
- [x] supervisord service `~/etc/services.d/mixer.ini` (template committed under
      `deploy/mixer.ini`), then `supervisorctl reread && update && start mixer`.
- [x] `uberspace web backend matt-maxx.de/rezepte --http --port 8723`.

**Resolved inputs:** Uberspace user = `mattmaxx`; app port = `8723` (confirm it is
free on first setup with `ss -tlpn` and adjust if taken); domain `matt-maxx.de` is
already pointed at Uberspace. Secret *values* still go into GitHub secrets / host
env only — never the repo.

### Issues found and resolved during host bring-up

1. **`npm ci` failed — no lockfile.** `package-lock.json` was gitignored and
   never committed. Removed it from `.gitignore` and committed a generated
   lockfile; `npm ci` requires a committed lockfile to run at all.

2. **`better-sqlite3@11.x` fails to build on the host.** Its `binding.gyp`
   requires `-std=c++20`, which the host's g++ does not recognize (it suggests
   `-std=c++2a`), and its prebuilt binaries require `glibc >= 2.29` (host is
   CentOS 7-based, glibc 2.17 — `prebuild-install warn ... GLIBC_2.29 not
   found`). **Fix:** downgraded to `better-sqlite3@^10.1.0` (uses `-std=c++17`,
   no API changes). Verified with the full test suite (435/435 → 437/437) and
   a production build.

3. **Root page redirected outside `/rezepte`.** `src/app/page.tsx` called
   `redirect('/dashboard')`. Unlike `next/link`/`router.push`, `redirect()`
   from `next/navigation` is **not** rewritten for `basePath`, so it landed on
   `https://matt-maxx.de/dashboard` (404). **Fix:** `redirect(apiUrl('/dashboard'))`.

4. **Several internal links still 404'd under `/rezepte`** ("Rezept
   erstellen", "Aus Foto", "Zyklus", "Zutaten", recipe/ingredient "Bearbeiten",
   "Zurück zum Dashboard/Übersicht", login/register cross-links). These were
   plain `<a href="/...">` rather than `next/link`, so — same as item 3 — they
   were not basePath-aware. This is the same class of issue as the Phase 1
   fetch/link audit (item 3 there caught one instance in `RecipeList` but
   missed these). **Fix:** converted all to `next/link` in the dashboard,
   recipe detail, ingredients, cycle pages and the login/register forms.

All four fixes are on branch `claude/vibrant-einstein-ijq62t`. App verified
working end-to-end at `https://matt-maxx.de/rezepte` (dashboard, recipe
create/edit, ingredients, login/register).

## Phase 4 — CI deploy (GitHub Action)

**Goal:** Merge to `main` → automatic deploy (same pattern as Picnic app).

- [x] `.github/workflows/deploy.yml`: trigger `push` on `main`.
- [x] Job: lint + type-check + tests on Node 22, then SSH to Uberspace
      (`appleboy/ssh-action`) and run:
      `cd ~/mixer && git fetch origin main && git reset --hard origin/main && npm ci && npm run build && supervisorctl restart mixer`.
- [ ] GitHub secrets: `UBERSPACE_SSH_KEY`, `UBERSPACE_HOST`, `UBERSPACE_USER`.
      Add the public key to `~/.ssh/authorized_keys` on Uberspace. (Operational
      step — must be configured by a repo admin in the GitHub repo settings;
      not something Claude Code can do.)
- [x] Post-deploy smoke test against `https://matt-maxx.de/rezepte`.

**Setup steps (operational, not in CI):**

1. Generate a dedicated SSH key pair for CI:
   `ssh-keygen -t ed25519 -f uberspace_deploy_key -N ""`.
2. Append the public key to `~/.ssh/authorized_keys` on the Uberspace host
   (`mattmaxx@mattmaxx.uberspace.de`).
3. In the GitHub repo settings (`Settings → Secrets and variables → Actions`),
   add:
   - `UBERSPACE_SSH_KEY` — the private key contents.
   - `UBERSPACE_HOST` — `mattmaxx.uberspace.de`.
   - `UBERSPACE_USER` — `mattmaxx`.
4. Ensure `~/mixer` on the host is a clean checkout of `main` with a working
   `git remote` (so `git fetch origin main` succeeds) — already true after
   Phase 3 setup.

**TDD note:** this is a CI/infrastructure configuration file (GitHub Actions
workflow), not application code with testable runtime behavior — TDD per
`.claude/rules/v-model.md` does not apply (same exception class as Phase 2/3).
The `test` job in the workflow itself runs the project's existing lint,
type-check and unit test suites before any deploy step.

## Phase 5 — Cleanup & documentation

- [x] Mark the Pi stack as deprecated (keep files for now): deprecation
      notices added to `docs/deployment/raspberry-pi-setup.md`,
      `docs/deployment/raspberry-pi-troubleshooting.md`,
      `docs/deployment/HTTPS-SETUP.md` and `docs/deployment/README.md`.
- [x] Update `CLAUDE.md`: tech-stack table (CI/CD → GitHub Actions to Uberspace;
      prod DB → SQLite; Node 22; Next.js 15), Architecture Notes (base-path /
      `apiUrl()` constraint, SQLite-in-prod), Common Commands (removed
      `deploy-pi.sh`, added `db:migrate-pg-to-sqlite`).
- [x] Write `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` +
      `docs/deployment/ACCEPTANCE-TESTS-MAINT-003.md` (mirror MAINT-002 format).

---

## Acceptance Criteria

- [x] App reachable at `https://matt-maxx.de/rezepte` over HTTPS.
- [x] All app functionality works under the `/rezepte` sub-path (no broken API
      calls, assets, or auth).
- [x] Production runs on SQLite; pre-existing Pi data is present and correct.
- [x] Merge to `main` triggers a successful automated deploy with no manual steps.
- [x] `better-sqlite3` builds and runs on the host's Node 22.
- [x] No secrets committed to the repository.
- [x] `CLAUDE.md` and deployment docs reflect the new setup.

See `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` and
`docs/deployment/ACCEPTANCE-TESTS-MAINT-003.md` for evidence and the manual
acceptance walkthrough.

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
| `.github/workflows/deploy.yml` | new |
| `docs/deployment/uberspace-setup.md` | new |
| `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` | new |
| `docs/deployment/ACCEPTANCE-TESTS-MAINT-003.md` | new |
| `CLAUDE.md` | stack update |
| `docs/deployment/raspberry-pi-*.md`, `HTTPS-SETUP.md`, `README.md` | deprecation notices |
