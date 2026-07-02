# CLAUDE.md — Project Instructions for Claude Code

This file is the primary system prompt for Claude Code when working in this project.
It is committed to the repository and shared across all team members.
Claude Code reads it automatically at the start of every session.

---

## Project Overview

**Project Name:** Mixer — Recipe Manager
**Purpose:** A multi-user recipe management web application with filtering capabilities based on available ingredients. Users manage recipes, input ingredients on hand, and discover recipes they can cook with what they have.
**Primary Audience:** Developers / End users (home cooks)
**Status:** Active development — MVP shipped, Phase 2 in progress

---

## Tech Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| Language     | TypeScript 5.x (strict mode)                  |
| Runtime      | Node.js 22 LTS                                |
| Framework    | Next.js 15 (App Router)                       |
| Database     | SQLite (local dev & production)               |
| ORM          | better-sqlite3 (raw SQL, no ORM)              |
| Auth         | JWT-based (httpOnly cookies)                  |
| Testing      | Jest + React Testing Library + Cypress        |
| Linting      | ESLint + Prettier                             |
| CI/CD        | GitHub Actions — auto-deploy to Uberspace on merge to `main` |

---

## Key Conventions

All coding and workflow conventions are documented in `.claude/rules/`.
Claude should read those files before writing or modifying code.

- **Coding style:** `.claude/rules/coding-style.md`
- **Testing practices:** `.claude/rules/testing-practices.md`
- **Git workflow:** `.claude/rules/git-workflow.md`
- **V-Model & traceability:** `.claude/rules/v-model.md`
- **Project learnings:** `.claude/rules/learnings.md`

**Before changing or adding a feature, read [`docs/feature-map.md`](docs/feature-map.md).**
It maps each feature to its REQ/ARCH/TEST and key files, lists dependency edges
(depends on / used by), and flags the **shared seams** — files and tables that
multiple features touch, where a change is most likely to break another feature.
The test suite (run in CI) is the actual regression guard; the feature map tells
you which features to re-check.

When in doubt, follow the existing patterns in the codebase rather than inventing new ones.
If a convention is unclear, ask before proceeding.

---

## Common Commands

```bash
# Install dependencies
npm install

# Run development server (SQLite, port 3000)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint:fix

# Type-check
npx tsc --noEmit

# Seed local development data (requires the dev server running)
npm run db:seed
```

Always run tests and linting before considering a task complete.

Production deploys are automatic: pushing to `main` triggers
`.github/workflows/deploy.yml`, which runs lint/type-check/tests, then
deploys to Uberspace (`https://matt-maxx.de/rezepte`) and runs a smoke test.
See `docs/deployment/uberspace-setup.md`.

---

## Project Structure

```
mixer/
├── CLAUDE.md                       # This file
├── CLAUDE.local.md                 # Personal overrides (gitignored)
├── .claude/
│   ├── CLAUDE.md                   # Legacy location (superseded by root CLAUDE.md)
│   ├── rules/                      # Claude conventions
│   │   ├── coding-style.md
│   │   ├── testing-practices.md
│   │   ├── git-workflow.md
│   │   ├── v-model.md
│   │   └── learnings.md
│   ├── commands/                   # Slash-commands
│   │   ├── new-requirement.md      # /new-requirement
│   │   ├── new-arch.md             # /new-arch
│   │   ├── new-test-spec.md        # /new-test-spec
│   │   ├── capture-learning.md     # /capture-learning
│   │   ├── summarize-pr.md         # /summarize-pr
│   │   ├── todo-check.md           # /todo-check
│   │   └── traceability.md         # /traceability
│   ├── hooks/
│   │   ├── pre-tool-use.sh
│   │   └── post-tool-use.sh
│   ├── settings.json
│   └── mcp.json
├── docs/
│   ├── requirements/               # REQ-XXX.md (V-Model user stories)
│   ├── architecture/               # ARCH-XXX.md + arc42.md
│   ├── test-specs/                 # TEST-XXX.md (test specifications)
│   ├── decisions/                  # ADR-XXX (Architecture Decision Records)
│   ├── code-reviews/               # Per-ticket review reports
│   ├── roadmap/                    # kanban.md + tickets
│   └── deployment/                 # Uberspace setup guide (current);
│                                    # Raspberry Pi guides (deprecated)
├── src/
│   ├── app/                        # Next.js App Router pages + API routes
│   ├── components/                 # Reusable React components
│   ├── lib/                        # Shared utilities (db, auth, converters)
│   ├── types/                      # Global TypeScript types
│   └── __tests__/                  # Unit and integration tests
├── tests/
│   └── e2e/                        # Cypress end-to-end tests
└── scripts/                        # Setup and seed scripts
```

---

## V-Model Workflow

Every new feature follows this sequence — Claude must not skip steps:

```
/new-requirement  →  /new-arch  →  /new-test-spec  →  Tests (TDD)  →  Implementation
```

Use `/traceability` to check coverage gaps across all artifacts.

---

## Language

- **All repository content is written in English** — code, comments, rules, commands, docs, commit messages.
- Conversation with the developer happens in German; the repository always stays English.

---

## Important Notes

- **Never commit secrets.** Use environment variables and `.env.local` (gitignored). Provide `.env.local.example` as documentation.
- **Never force-push to `main`.** See `.claude/rules/git-workflow.md`.
- **Prefer small, focused commits** over large, sweeping changes.
- **Write tests for new functionality.** Minimum 80% coverage. TDD: tests first.
- **SQLite-only:** the app runs on SQLite in dev and production. The former
  PostgreSQL/`pg` dual-database support, Docker, and the Pi→SQLite migration
  tooling were removed (see ADR-008). All DB access uses `better-sqlite3` with
  raw SQL.
- **Database migrations** must be reviewed before running in production.
- **Keep this file up to date** when the stack or conventions change.

---

## Architecture Notes

- All database access uses raw SQL (better-sqlite3) — no ORM layer
- Business logic lives in `src/lib/` — API routes are thin
- Authentication uses JWT stored in httpOnly cookies (1h sliding-window token,
  refreshed on every authenticated request, capped at a 24h absolute session
  lifetime — see REQ-020/ARCH-020)
- Next.js App Router: all routes under `src/app/api/`
- Unit conversion system: `src/lib/converters/` — see ADR-006
- Ingredient master list: shared across users, user ingredients reference it via `masterId`
- The app runs under a configurable sub-path (`BASE_PATH=/rezepte` in
  production). All client-side `fetch('/api/...')` calls and internal links
  must use the `apiUrl()` helper (`src/lib/api-url.ts`) or `next/link` /
  `router.push` — plain `<a href="/...">` and `redirect()` are NOT base-path
  aware. See MAINT-003.
- Production runs on SQLite (`DATABASE_URL=file:...`). `DATABASE_URL` selects
  the SQLite file location; a default under `.data/` is used when it is unset
  (`src/lib/db/init.ts`).

---

## Out of Scope (without explicit discussion)

- Upgrading major dependency versions
- Modifying applied database migrations
- Changing the public API contract without updating docs
- Adding new MCP servers or external integrations
