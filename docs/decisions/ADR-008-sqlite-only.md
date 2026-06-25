# ADR-008: SQLite-Only (Remove PostgreSQL, Docker, and Dual-Database Support)

**Status**: Accepted
**Date**: 2026-06-25
**Supersedes**: [ADR-002](ADR-002-sqlite-and-postgresql-dual-database-support.md)

## Context

ADR-002 introduced a dual-database abstraction so the app could run on SQLite
locally and PostgreSQL in production on the Raspberry Pi. Since then:

- **MAINT-003** migrated production from the Raspberry Pi (Docker Compose +
  PostgreSQL + Caddy) to **Uberspace**, where the app runs as a
  supervisord-managed Node.js process on **SQLite**.
- The Pi→SQLite data migration was completed, so the one-off migration script
  (`scripts/migrate-pg-to-sqlite.ts`) was spent.
- Both development and production now use SQLite. The PostgreSQL code paths were
  no longer exercised anywhere: there were no PostgreSQL-specific tests, and CI
  runs entirely on SQLite.

Carrying the dual-database abstraction meant every model duplicated its query
logic across `if (isPostgres())` branches (PG placeholders/`ILIKE`/`RETURNING`
vs. SQLite `?`/`LIKE`), which was dead weight and a maintenance hazard.

## Decision

Make the application **SQLite-only**. Specifically:

- Remove the `pg` driver and `@types/pg` dependencies.
- Remove engine detection (`isPostgres()`) and the `Pool` type from
  `src/lib/db/init.ts`; `getDb()` returns a `better-sqlite3` `Database`.
- Collapse every `if (isPostgres())` branch in the models, API routes, the unit
  converter, and the seed functions to their SQLite implementations.
- Delete the Docker/Pi artifacts that only supported the old PostgreSQL
  deployment: `Dockerfile`, `docker-compose.yml`,
  `docker-compose.production.yml`, `docker-compose.local.yml`, `Caddyfile`,
  `scripts/deploy-pi.sh`, and `scripts/setup-local.sh`.
- Delete the spent migration tool `scripts/migrate-pg-to-sqlite.ts` and the
  `db:start` / `db:stop` / `db:setup` / `db:migrate-pg-to-sqlite` npm scripts.

Migration `.sql` files remain PostgreSQL-flavoured and are converted to SQLite
at load time (e.g. `SERIAL PRIMARY KEY` → `INTEGER PRIMARY KEY AUTOINCREMENT`)
by `runMigrationsSync()`; this keeps the existing migrations working unchanged.

## Consequences

**Positive**
- Removes ~700 lines of duplicated query logic and an entire branch per model.
- Fewer dependencies (no native/`pg` build) and a simpler local setup
  (`npm install` + `npm run dev`, no Docker).
- The code now matches reality: one engine, exercised by the test suite.

**Negative / Trade-offs**
- Reintroducing PostgreSQL later would require re-adding an abstraction.
- The dual-DB type-compatibility safety net (ADR-002 / the related learning) no
  longer applies; there is no PostgreSQL path to test against.

## References

- ADR-002 (superseded), MAINT-003 (Uberspace migration)
- `docs/architecture/arc42.md` §2.1, §4.1, §7.4, §8.9, §9 (ADR-002 note)
