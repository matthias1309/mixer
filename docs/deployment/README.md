# Deployment

Production runs on **Uberspace** at **https://matt-maxx.de/rezepte**, served
under the sub-path `BASE_PATH=/rezepte` on **SQLite**. Deploys are automatic:
merging to `main` triggers `.github/workflows/deploy.yml`
(lint → type-check → tests → deploy → smoke test).

## Current docs

| Doc | Purpose |
|-----|---------|
| [uberspace-setup.md](uberspace-setup.md) | **Start here.** One-time host bring-up (SSH, supervisord, env, build) |
| [ACCEPTANCE-TESTS-MAINT-003.md](ACCEPTANCE-TESTS-MAINT-003.md) | Manual acceptance checklist against the live deployment |
| [MAINT-003-VERIFICATION-REPORT.md](MAINT-003-VERIFICATION-REPORT.md) | Verification record of the production migration |

## How a deploy works

1. Merge a PR to `main`.
2. GitHub Actions runs lint, type-check, and tests.
3. On green, it deploys to the Uberspace host and (re)starts the
   supervisord-managed Node.js process.
4. A smoke test asserts HTTP 200 on `https://matt-maxx.de/rezepte`.

No Docker is involved (removed in ADR-008). TLS is provided by Uberspace.

## Archive (historical / obsolete)

The `archive/` folder holds the **retired Raspberry Pi + Docker + Caddy +
PostgreSQL** deployment and the MAINT-002 (Pi HTTPS) records. These were
superseded by the Uberspace migration (MAINT-003) and the SQLite-only refactor
(ADR-008). Kept for historical reference only:

- `archive/raspberry-pi-deployment-guide.md` (the former Pi deployment manual)
- `archive/raspberry-pi-setup.md`, `archive/raspberry-pi-troubleshooting.md`
- `archive/HTTPS-SETUP.md` (Caddy/TLS on Pi)
- `archive/ACCEPTANCE-TESTS-MAINT-002.md`, `archive/MAINT-002-VERIFICATION-REPORT.md`
