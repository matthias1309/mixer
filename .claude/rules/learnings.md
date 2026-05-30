# Project Learnings

This document grows with the project. New insights are captured with `/capture-learning`.
Claude reads this file every session and factors the entries into suggestions and decisions.

**Format:**
```
## YYYY-MM-DD — Short title
**Context:** When/where was this noticed?
**Learning:** What did we learn?
**Action:** What do we change or watch out for going forward?
```

---

## 2026-05-30 — PostgreSQL/SQLite dual-database requires explicit type casting

**Context:** Integration tests failed on PostgreSQL after passing on SQLite during recipe filtering implementation.
**Learning:** SQLite is lenient with types (strings vs. integers), PostgreSQL is strict. ILIKE vs. LIKE for case-insensitive search.
**Action:** Always use `$1::text` casts in PostgreSQL queries and use `ILIKE` for case-insensitive matching. Test against both databases locally before pushing.

## 2026-05-30 — Test isolation requires fresh database per test file

**Context:** Flaky tests appeared when multiple test files shared the same in-memory SQLite database.
**Learning:** Parallel Jest workers each need their own database instance; shared state causes race conditions and false failures.
**Action:** Each test file initializes its own `:memory:` database. Never share database instances across test files.
