# ARCH-011 — Cycle-Based Recipe Scoring

**Traces**: REQ-011
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

---

## 1. Decision Summary

Phase scoring is **computed inline when listing recipes**, not stored. The
recipe list query already aggregates each recipe's nutrients via a
`LEFT JOIN ingredients_master` (see REQ-012); the model passes those aggregates
to `calculateScore(nutrients, phase)` and attaches the result as `score` on each
list item. This keeps scores always-fresh (they reflect current ingredient data)
at the cost of recomputation per request, which is acceptable at this scale.

The design originally proposed separate recommendation endpoints; they were not
built. Scoring rides on `GET /api/recipes?phase=`.

## 2. Scoring Algorithm

`src/lib/scoring/phaseScore.ts`:

```
for each nutrient n with phase weight w(n):
  normalized(n) = min(amount(n) / reference(n), 1.0)
  phaseSpecific = Σ(normalized(n)·w(n)) / Σ w(n)        # 0..1
general        = mean(normalized of non-phase nutrients) # 0..1 (0.5 if none)
score          = round( (phaseSpecific·0.7 + general·0.3) · 100 )  # 0..100
```

- Phase weights (`PHASE_WEIGHTS`) e.g. Menstruation: iron 3, magnesium 2,
  protein 2, calcium 1; Luteal: magnesium 3, B6 2, calcium 2, fiber 1;
  Follicular: B6/B12/protein; Ovulation: protein/E/zinc/D.
- `REFERENCE_VALUES` normalise raw amounts; capping at 1.0 stops one nutrient
  from dominating.

## 3. Components Touched

| File | Role |
|---|---|
| `src/lib/scoring/phaseScore.ts` | `calculateScore(nutrients, phase)`, `PHASE_WEIGHTS`, `REFERENCE_VALUES` |
| `src/lib/db/models/recipe-async.ts` | `listAllWithScoreAsync()` — aggregates nutrients, calls `calculateScore`, returns `score` per item |
| `src/lib/db/models/recipe.ts` | synchronous variant of the same scoring |
| `src/app/api/recipes/route.ts` | `GET` accepts `phase`, delegates to `listAllWithScoreAsync`, returns scored list |
| `src/lib/constants.ts` | `PHASE_OPTIONS`, `DEFAULT_PHASE`, sort options |
| `src/lib/cycle-recommendations/*` | auxiliary scorer/targets — present, **not wired** into the API |

## 4. API

| Method | Path | Query | Behaviour |
|---|---|---|---|
| GET | `/api/recipes` | `phase`, `search`, `sort`, `page`, `pageSize` | returns recipes; each item carries `score` (or `null` if no master-ingredient matched) for the given phase |

## 5. Test Strategy

- Unit (algorithm): `src/__tests__/lib/scoring/phaseScore.test.ts` — range,
  unknown/empty phase, per-phase prioritisation, capping, 70/30 blend.
- Unit (auxiliary scorer): `src/__tests__/unit/cycle-recommendations/scorer.test.ts`.
- Integration (endpoint): `src/__tests__/integration/cycle-recommendations/filtering-api.test.ts`
  — score field present, per-phase variance, auth, pagination.

## 6. Related

REQ-011, REQ-010 (phase source), REQ-012 (nutrient aggregation), ADR-008.
