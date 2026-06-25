# ADR-002: SQLite and PostgreSQL Dual-Database Support

**Status**: Superseded by [ADR-008](ADR-008-sqlite-only.md) (2026-06-25)  
**Date**: 2026-05-19  
**Context**: Application needs to work locally (SQLite) for development and on Raspberry Pi (PostgreSQL) for production.

> **⚠️ Superseded:** After production moved to Uberspace on SQLite (MAINT-003),
> the PostgreSQL/`pg` dual-database support was removed entirely. The app is now
> SQLite-only — see [ADR-008](ADR-008-sqlite-only.md). This record is kept for
> historical context.

## Decision

Implement database abstraction layer that supports both SQLite (development) and PostgreSQL (production) through environment configuration.

**Database Selection Logic**:
- Development: SQLite (file-based, zero configuration)
- Production (RPi): PostgreSQL (robust, scalable, concurrent access)
- Selection via `DATABASE_URL` environment variable

## Consequences

**Advantages**:
- Local development without external dependencies
- Production database scales with users
- Easy to test database migrations
- Supports CI/CD pipelines (both databases)

**Disadvantages**:
- Code must handle SQL dialect differences
- Migration testing requires both database types
- Some SQLite-only features not available in PostgreSQL

## Database Patterns Established

1. **Schema Migrations**:
   - Separate migration files per feature
   - Location: `src/lib/db/migrations/`
   - Naming: `NNN_description.sql`

2. **Model Layer**:
   - Raw SQL with prepared statements
   - Type safety through TypeScript interfaces
   - Location: `src/lib/db/models/`
   - Examples: `UserModel`, `RecipeModel`, `IngredientMasterModel`

3. **Query Execution**:
   - Direct SQL (not ORM)
   - Consistent error handling
   - Connection pooling managed by database libraries

## Implementation Details

- **Driver**: `better-sqlite3` (development), `pg` (production)
- **Connection**: `src/lib/db/connection.ts` (handles both)
- **Initialization**: `src/lib/db/init.ts` (auto-runs migrations)
- **Models**: Business logic abstraction over raw SQL

## SQL Dialect Compatibility

### Tested Compatibility
- Auto-increment: `AUTOINCREMENT` (SQLite), `SERIAL` (PostgreSQL)
- Transactions: Both support `BEGIN TRANSACTION`
- Foreign keys: Both support `FOREIGN KEY` constraints
- UNIQUE constraints: Both support unique columns

### Known Differences
- JSON support: PostgreSQL `jsonb`, SQLite uses TEXT
- Date functions: Different syntax between databases
- String functions: Minor differences in functions

## Related Files

- `src/lib/db/init.ts` (initialization)
- `src/lib/db/connection.ts` (connection management)
- `src/lib/db/models/` (model implementations)
- `src/lib/db/migrations/` (schema migrations)
