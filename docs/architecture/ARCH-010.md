# ARCH-010 — Menstrual Cycle Tracking

**Traces**: REQ-010
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

---

## 1. Decision Summary

Cycle tracking is **stateless calculation over a single stored profile**. The
only persisted state is one row per user in `user_cycles` (last menstruation
date + cycle length). The current phase is computed on demand from that row and
the current date — nothing about the phase is stored, so it is always correct
without a scheduler or recomputation job.

## 2. Phase Calculation

`src/lib/cycle/calculator.ts`:

- `getDayOfCycle(lastMenstruationDate, cycleLength, today)` →
  `(today − last) mod cycleLength`.
- `findPhaseForDay(dayOfCycle)` maps the day to a phase using
  `PHASE_DEFINITIONS` from `src/lib/cycle/constants.ts`; overlapping ranges
  resolve via `PHASE_PRIORITY` (Ovulation > Follicular/Luteal > Menstruation).
- `calculateCurrentPhase(cycle)` / `calculatePhaseOnDate(cycle, date)` combine
  the two; `validateCycleInfo()` enforces the 21–35 day bound.

Four phases (28-day reference): Menstruation, Follicular, Ovulation, Luteal.

## 3. Data Model

Migration `src/lib/db/migrations/003_create_user_cycles.sql`:

```sql
CREATE TABLE user_cycles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  last_menstruation_date VARCHAR(10) NOT NULL,
  cycle_length_days INTEGER NOT NULL DEFAULT 28,
  created_at ..., updated_at ...
);
```

`user_id` is UNIQUE → exactly one profile per user. Writes use
`INSERT ... ON CONFLICT(user_id) DO UPDATE` (see `UserModel.saveCycle`).

## 4. Components Touched

| File | Role |
|---|---|
| `src/lib/cycle/calculator.ts` | day-of-cycle + phase calculation, validation |
| `src/lib/cycle/constants.ts` | `PHASE_DEFINITIONS`, length bounds, `PHASE_PRIORITY` |
| `src/lib/cycle/types.ts` | `CycleInfo`, `CurrentPhase`, `UserCycle`, … |
| `src/lib/db/models/user.ts` | `saveCycle()`, `getCycle()` (SQLite upsert + read) |
| `src/app/api/users/cycle/route.ts` | `POST` (save/update), `GET` (read + current phase) |
| `src/components/cycle/CycleForm.tsx` | input form (date + length) |
| `src/components/cycle/CycleInfo.tsx` | renders phase, day-of-cycle, progress |
| `src/components/cycle/PhaseIndicator.tsx` | emoji + colour per phase |

## 5. API

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| POST | `/api/users/cycle` | required | upsert profile, return current phase |
| GET | `/api/users/cycle` | required | return stored profile + current phase, or `success:false` when none |

A `PUT` is not separate — re-`POST` updates (upsert).

## 6. Test Strategy

- Unit: `src/__tests__/unit/cycle/calculator.test.ts` covers the pure
  calculation (multiple cycle lengths, boundaries, phase-on-date).
- Integration: `src/__tests__/integration/cycle/cycle-api.test.ts` covers the
  endpoints (auth, validation, persistence, current-phase) using the per-file
  SQLite pattern.

## 7. Out of Scope

- Cycle logging / per-day notes (`cycle_logs` exists in an early migration but
  is unused).
- A `/phases` reference endpoint and a `/phase-on-date` HTTP route (the helper
  exists in the library only).

## 8. Related

REQ-010, REQ-011 (consumes the phase), ADR-008 (SQLite-only).
