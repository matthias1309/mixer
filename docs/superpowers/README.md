# Superpowers — Archived Planning Docs

These are the original `superpowers` **plans** and **specs** that drove the
MVP and Phase-2 work, before the project adopted the formal V-Model
(`docs/requirements` / `docs/architecture` / `docs/test-specs`). They are kept
under `archive/` for historical context.

**They are not the source of truth.** For current behaviour use the V-Model
docs and the code. Where a feature has since been formalised, the table below
points to its REQ/ARCH/TEST.

## Status mapping

| Superpowers doc(s) | Status | Authoritative V-Model artifact |
|---|---|---|
| recipe-manager-implementation, recipe-manager-frontend, recipe-app-design | Formalised | `requirements/mvp/*`, ARCH-004, MVP tickets |
| e2e-user-journey (+ design) | Formalised | TEST-105 |
| phase1/phase2/phase3 UI, german-ui, phase2-ingredient-autocomplete | Implemented | partly REQ-005/006/007; small UI items tracked via kanban (not separately formalised) |
| cycle-tracking (+ design) | Formalised (retroactive) | REQ-010 / ARCH-010 / TEST-010 |
| cycle-based-filtering (+ design) | Formalised (retroactive) | REQ-011 / ARCH-011 / TEST-011 |
| nutrition-database-calculation (+ design) | Formalised (retroactive) | REQ-012 / ARCH-012 / TEST-012 (+ REQ-008 endpoint fix) |
| unit-conversion-recipe-scaling (+ design) | Formalised (retroactive) | REQ-013 / ARCH-013 / TEST-013 (+ ADR-006, REC-109) |
| photo-upload-ocr (+ design) | Formalised (retroactive) | REQ-014 / ARCH-014 / TEST-014 (photo display: REQ-009) |
| raspberry-pi-deployment (plan + design), deployment-guide | **Obsolete** | retired in MAINT-003; Docker removed in ADR-008 — see `deployment/uberspace-setup.md` |

> "Formalised (retroactive)" means the feature shipped first and the V-Model
> docs were written afterwards to capture the as-built behaviour; the tests were
> not derived from those specs.
