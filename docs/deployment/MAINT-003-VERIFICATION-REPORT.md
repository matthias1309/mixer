# MAINT-003 Verification Report

**Date**: 2026-06-15
**Task**: Phase 5 - Acceptance Criteria Verification
**Status**: ✅ VERIFIED — LIVE IN PRODUCTION

---

## Acceptance Criteria Verification Matrix

| Criteria | Status | Evidence | Notes |
|----------|--------|----------|-------|
| App reachable at `https://matt-maxx.de/rezepte` over HTTPS | ✅ VERIFIED | Manual browser check during Phase 3; CI smoke test (`smoke-test` job in `deploy.yml`) passes on every deploy | TLS handled automatically by the Uberspace web frontend |
| All app functionality works under `/rezepte` (no broken API calls, assets, or auth) | ✅ VERIFIED | Phase 1 `apiUrl()` fetch/link audit + Phase 3 fixes for `redirect()` and remaining `<a href>` links; manual walkthrough (dashboard, recipe create/edit, ingredients, cycle, login/register) | See Phase 3 "Issues found and resolved" |
| Production runs on SQLite; pre-existing Pi data is present and correct | ✅ VERIFIED | Phase 2 migration script with per-table row-count parity report (11/11 tables matched); DB copied to `~/data/mixer.db` on Uberspace | `DATABASE_URL=file:...`, no DB-layer code change |
| Merge to `main` triggers a successful automated deploy with no manual steps | ✅ VERIFIED | `.github/workflows/deploy.yml` — latest run (#9, commit `b4e79c0`) on `main`: `test`, `deploy`, `smoke-test` jobs all green | https://github.com/matthias1309/mixer/actions/runs/27525463447 |
| `better-sqlite3` builds and runs on the host's Node 22 | ✅ VERIFIED | Downgraded to `^10.1.0` (Phase 3, issue 2); deploy workflow rebuilds the native binding if missing and the readiness check confirms the app serves JSON | `node -v` on host reports v22.x |
| No secrets committed to the repository | ✅ VERIFIED | `.env.production` is gitignored; `mixer.db` not tracked; secrets (`JWT_SECRET`, `NEXTAUTH_SECRET`, SSH key) live only in `~/mixer/.env.production` and GitHub Actions secrets | See `docs/deployment/uberspace-setup.md` Step 5 |
| `CLAUDE.md` and deployment docs reflect the new setup | ✅ VERIFIED | This phase: tech-stack table, Architecture Notes, Common Commands updated; Pi docs marked deprecated | See "Changes in this phase" below |

---

## Step 1: Test Suite & Static Checks

Run locally on commit `b4e79c0` (current `main`):

```
✓ npm test        → Test Suites: 54 passed, 54 total / Tests: 437 passed, 437 total
✓ npm run lint    → no errors (--max-warnings=0)
✓ npx tsc --noEmit → no errors
```

---

## Step 2: CI/CD Pipeline Verification

### Results: ✅ LATEST RUN GREEN

```
Workflow: Deploy to Uberspace (.github/workflows/deploy.yml)
Run #9, commit b4e79c0, branch main
  test         → success
  deploy       → success
  smoke-test   → success
```

The `deploy` job builds with `BASE_PATH=/rezepte`, installs/repairs the
`better-sqlite3` native binding, restarts the app via `supervisorctl`, and
waits for a local readiness check before exiting. The `smoke-test` job then
confirms `https://matt-maxx.de/rezepte/api/recipes/ingredients` returns
`200 application/json`.

---

## Step 3: Pi Stack Deprecation

### Results: ✅ MARKED DEPRECATED (FILES KEPT, PER "OUT OF SCOPE")

```
✓ docs/deployment/README.md                  — deprecation notice added
✓ docs/deployment/raspberry-pi-setup.md      — deprecation notice added
✓ docs/deployment/raspberry-pi-troubleshooting.md — deprecation notice added
✓ docs/deployment/HTTPS-SETUP.md             — deprecation notice added
```

`docker-compose.yml`, `docker-compose.production.yml`, `Caddyfile` and
`scripts/deploy-pi.sh` are unchanged and remain in the repository for
reference, per the ticket's "Out of Scope" section.

---

## Step 4: Documentation Updates (this phase)

### `CLAUDE.md`

- Tech-stack table: Runtime → Node.js 22 LTS, Framework → Next.js 15,
  Database → SQLite (local dev & production), CI/CD → GitHub Actions
  auto-deploy to Uberspace, Container → Docker Compose (local dev only).
- Common Commands: removed `scripts/deploy-pi.sh`, added
  `npm run db:migrate-pg-to-sqlite` and a note that deploys are automatic on
  merge to `main`.
- Architecture Notes: added the `apiUrl()` / base-path constraint and the
  SQLite-in-production note.
- Important Notes: clarified that `pg` / PostgreSQL is now only used for the
  local Docker setup and the one-off migration script.
- Project Structure: `docs/deployment/` and `docker-compose.yml` annotations
  updated to point at the Uberspace guide and mark the Pi compose file
  deprecated.

### New files

- `docs/deployment/MAINT-003-VERIFICATION-REPORT.md` (this file)
- `docs/deployment/ACCEPTANCE-TESTS-MAINT-003.md`

---

## Critical Files

| File | Purpose | Status |
|------|---------|--------|
| `docs/deployment/uberspace-setup.md` | Current production setup guide | ✅ In place (Phase 3) |
| `.github/workflows/deploy.yml` | CI test + auto-deploy + smoke test | ✅ Green on `main` |
| `deploy/mixer.ini` | supervisord service template | ✅ In place (Phase 3) |
| `scripts/migrate-pg-to-sqlite.ts` | One-off Pi → SQLite data migration | ✅ Verified (Phase 2) |
| `CLAUDE.md` | Project instructions / stack reference | ✅ Updated (this phase) |
| `docs/deployment/raspberry-pi-*.md`, `HTTPS-SETUP.md`, `README.md` | Pi deployment docs | ✅ Marked deprecated |

---

## Notes

- No code changes in this phase — documentation and cleanup only.
- All MAINT-003 acceptance criteria are met; the app has been live at
  `https://matt-maxx.de/rezepte` since Phase 3/4, confirmed again by the
  latest green CI run on `main`.
- Manual acceptance walkthrough checklist: `ACCEPTANCE-TESTS-MAINT-003.md`.

**Verified by**: Claude Code Agent
**Environment**: Remote execution container (Linux) + GitHub Actions (Uberspace deploy)
**Date**: 2026-06-15
