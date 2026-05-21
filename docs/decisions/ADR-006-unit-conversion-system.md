# ADR-006: Centralized Unit Conversion System

**Status**: Accepted
**Date**: 2026-05-21
**Ticket**: REC-109
**Context**: Recipes use different measurement units (TL, EL, ml, g, etc.) with no standardization, making recipe scaling and comparison impossible.

## Problem

Ingredients are stored with free-text units (`unit: string | null`). This causes three problems:
1. No recipe scaling — 500g for 4 people can't be automatically adjusted to 8 people
2. No unit conversion — "3 TL" and "15 ml" are treated as different values
3. No normalization — filtering by ingredient quantity is unreliable

## Decision

Implement a **centralized, DB-backed unit conversion system** with three components:

### 1. Database Layer
Three new tables:
- `units` — reference table of all valid units with category (volume/weight/count/pinch)
- `unit_conversions` — conversion factors between compatible units (e.g. 1 TL = 5 ml)
- `ingredient_densities` — ingredient-specific weight per volume (e.g. 1 ml Mehl = 1g)

Ingredients table extended with `normalized_quantity` and `normalized_unit` for efficient querying.

### 2. Service Layer
- **UnitConverter** — loads all unit data at startup, converts between units via in-memory Maps
- **RecipeScaler** — pure in-memory scaling with smart unit promotion (3 TL → 1 EL, 1000 ml → 1 l)

### 3. API Layer
- `POST /api/recipes/{id}/scale` — returns recipe with scaled ingredients (read-only, no DB writes)
- Ingredient creation validates and normalizes units automatically

## Alternatives Considered

### Alternative 1: Hardcoded Conversion Table
Convert units using a hardcoded TypeScript constant.

**Rejected**: Not extensible. Adding new units or densities requires code changes and redeployment.

### Alternative 2: User-Defined Conversions
Allow each user to define their own conversion rules.

**Rejected**: Overkill for MVP. Most users expect standard culinary measurements. Adds significant complexity to the data model and UI. Deferred to future phase.

### Alternative 3: ORM-based Approach
Use an ORM (Prisma, TypeORM) to manage the conversion schema.

**Rejected**: Project established raw SQL pattern (ADR-002). Introducing an ORM for a single subsystem would be inconsistent and add unnecessary dependency.

## Consequences

**Advantages**:
- Extensible — new units/densities added via SQL without code changes
- Accurate — conversion factors stored with NUMERIC precision
- Efficient — conversions are in-memory Map lookups after initialization
- Consistent — one unit table is the single source of truth for the whole app

**Disadvantages**:
- Volume↔weight conversions only possible for ingredients in `ingredient_densities`
- UnitConverter must be initialized before use (async DB load on first request)
- Integer-only quantities in MVP (decimal quantities deferred)

## Supported Units (MVP)

| Unit | Category | Base Unit |
|------|----------|-----------|
| TL | volume | ml |
| EL | volume | ml |
| ml | volume | ml |
| l | volume | ml |
| g | weight | g |
| kg | weight | g |
| Stück | count | count |
| Prise | pinch | pinch |

## Unit Promotion Rules

When scaling, quantities are promoted to the next larger unit:
- ≥ 3 TL → EL
- ≥ 16 EL → ml
- ≥ 1000 ml → l

## Related

- ADR-002: SQLite and PostgreSQL Dual-Database Support (migration patterns)
- `docs/features/unit-conversion.md` (usage guide)
- `docs/code-reviews/REC-109-unit-conversion.md` (implementation review)
