# REC-101: Database Schema Design

**Type**: Chore  
**Effort**: 3 story points  
**Priority**: P0 (Blocker)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 11th  

---

## Description

Design and create database schema for users, recipes, and ingredients. Create migrations for both SQLite and PostgreSQL.

## Acceptance Criteria

- [ ] Users table created (id, email, passwordHash, createdAt, updatedAt)
- [ ] Recipes table created (id, userId, name, description, instructions, servings, createdAt, updatedAt)
- [ ] Ingredients table created (id, recipeId, name, quantity, unit)
- [ ] Foreign key constraints working
- [ ] Indexes on frequently queried columns (userId, recipeId)
- [ ] Schema works with SQLite (dev) and PostgreSQL (prod)
- [ ] Migration scripts created
- [ ] Seeding script for test data (optional)
- [ ] Database client configured
- [ ] Connection pooling configured (for PostgreSQL)
- [ ] Unit tests for schema validation

## Dependencies

- INFRA-102: Project Structure
- TEST-101: Test Infrastructure

## Implementation Notes

- Database client library: use both sqlite3 and pg
- Create migrations in `src/lib/db/migrations/`
- Schema files:
  - `src/lib/db/schema.ts` - type definitions
  - `src/lib/db/client.ts` - database connection
  - `src/lib/db/migrations/` - migration scripts
- Indexes:
  - users.email (unique)
  - recipes.userId
  - ingredients.recipeId

## Testing

- Unit tests for schema structure
- Connection tests
- Constraint tests (foreign keys)
- Migration tests

## Definition of Done

- [ ] Schema created and documented
- [ ] Migrations working for both databases
- [ ] Database client configured
- [ ] Indexes created
- [ ] Tests passing
- [ ] Code review approved
- [ ] Documentation updated

## Related Documents

- Arc42: Section 5.2 (Building Blocks - Data Layer)
- Req42: 02-recipe-management.md (Database requirements)
