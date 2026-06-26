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

> **⚠️ Superseded (ADR-008, 2026-06-25):** The app is now **SQLite-only** — PostgreSQL/`pg` and the dual-database code paths were removed. This learning is kept for historical context but no longer applies; there is no PostgreSQL path to test against.

## 2026-05-30 — Test isolation requires fresh database per test file

**Context:** Flaky tests appeared when multiple test files shared the same in-memory SQLite database.
**Learning:** Parallel Jest workers each need their own database instance; shared state causes race conditions and false failures.
**Action:** Each test file initializes its own `:memory:` database. Never share database instances across test files.

## 2026-06-26 — Don't skip the V-Model for "small" requests

**Context:** User asked for a small dashboard tweak (configurable recipe page size). It was implemented directly (explore → code → verify) without first creating REQ/ARCH/TEST-SPEC, even though `.claude/rules/v-model.md` mandates the sequence with no exception for small changes. Docs were created retroactively only after the user asked why the V-Model wasn't followed.
**Learning:** A request's phrasing ("kleine Änderung", "just add X") is not a reliable signal for whether it's in scope of the V-Model. Any change that adds new user-facing behavior is a new requirement, regardless of how small it sounds.
**Action:** Before writing implementation code for a new behavior (not a pure bugfix), ask the user explicitly whether the V-Model should be skipped for this change. Only proceed straight to code if they confirm skipping is fine; otherwise run `/new-requirement` → `/new-arch` → `/new-test-spec` first.

## 2026-06-26 — Check existing project conventions before applying a generic skill template

**Context:** Asked to do a code review on REQ-019, the `/code-review` skill's own generic instructions were followed verbatim (output to `.claude/reviews/pr-<NUMBER>-review.md`, CRITICAL/HIGH/MEDIUM/LOW format), even though this project already has an established, different convention for code reviews (`docs/code-reviews/REQ-XXX-*.md`, e.g. REQ-015/017/018). Had to redo the review in the project's own format after the user pointed it out.
**Learning:** A skill's built-in template is a generic default, not a project-specific instruction — it doesn't know about this repo's existing conventions. `CLAUDE.md` already says "When in doubt, follow the existing patterns in the codebase rather than inventing new ones," and that applies to skill output locations/formats too, not just code.
**Action:** Before writing any artifact a skill produces (reviews, reports, docs), check whether the project already has an established location/format for that artifact type (e.g. `docs/code-reviews/`, `docs/requirements/`) and use that instead of the skill's generic default when the two conflict.
