# Recipe Manager - Project Documentation

## Project Overview

A multi-user recipe management web application with filtering capabilities based on available ingredients. Built as a full-stack Next.js application deployed on a Raspberry Pi with Docker.

**Purpose**: Enable users to manage recipes, input ingredients on hand, and discover recipes they can cook with available ingredients.

**Tech Stack**:
- Frontend: Next.js with React and TypeScript
- Backend: Next.js API Routes (Node.js)
- Database: SQLite (local development), PostgreSQL (production on RPi)
- Authentication: JWT-based
- Testing: Jest, React Testing Library, Cypress
- Containerization: Docker (production on RPi)
- Package Manager: npm

**Deployment**: Docker containers on Raspberry Pi

## Development Methodology

### Process Model
- **V-Model Development**: Requirements → Architecture → Implementation → Testing → Review
- **Lean-Agile**: Minimal initial documentation, evolving with the project
- **Test-Driven Development (TDD)**: Write tests before implementation
- **Code Review**: Local review process with focus on clean code principles

### Clean Code Principles
- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)

### Feedback Loop
Learnings from code reviews feed back into:
1. Future requirement decisions
2. Architecture decisions
3. Development best practices

## Documentation Standards

### Format
- **Language**: English only for all documentation and code
- **Format**: Markdown exclusively
- **Communication with developer**: German

### Documentation Framework
- **Architecture**: Arc42 (in `docs/architecture/arc42.md`)
- **Requirements**: Req42 (in `docs/requirements/`)
- **Roadmap**: Kanban-based in Markdown (in `docs/roadmap/kanban.md`)

## Project Structure

```
mixer/
├── docs/
│   ├── architecture/           # Arc42 architecture documentation
│   │   └── arc42.md
│   ├── requirements/           # Req42 requirements documentation
│   │   ├── req42-template.md
│   │   ├── mvp/               # MVP phase requirements
│   │   └── future/            # Future feature requirements
│   ├── roadmap/               # Project planning
│   │   └── kanban.md
│   ├── code-reviews/          # Code review reports for each ticket
│   │   └── [TICKET-ID].md
│   ├── decisions/             # Architecture Decision Records (ADRs)
│   └── learnings/             # Code review learnings
├── src/
│   ├── app/                   # Next.js app directory
│   ├── components/            # React components
│   ├── lib/                   # Utility functions
│   ├── pages/                 # Legacy pages (if needed)
│   ├── api/                   # API routes
│   ├── styles/                # CSS/styling
│   ├── types/                 # TypeScript types
│   └── __tests__/             # Unit and integration tests
├── tests/
│   ├── e2e/                   # Cypress E2E tests
│   ├── fixtures/              # Test data
│   └── mocks/                 # Mocks and stubs
├── docker-compose.local.yml   # Local development with PostgreSQL
├── docker-compose.yml         # Production RPi setup
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
├── jest.config.js
├── .env.local.example         # Environment template
├── .gitignore
└── README.md

## Development Guidelines

### Commits
- Keep commits focused and well-described
- Follow conventional commits format
- Reference tickets/issues in commit messages

### Code Style
- TypeScript for all code (strict mode)
- Follow ESLint/Prettier configuration
- Maintain consistent naming conventions

### Testing Requirements
- Minimum 80% code coverage
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- TDD approach: write tests first

### Definition of Done
A feature is complete when:
1. ✅ Tests written and passing (80%+ coverage)
2. ✅ Code reviewed and approved
3. ✅ Documentation updated
4. ✅ No breaking changes to existing functionality

### Code Review Process
- **Local review with developer**: Focus on clean code
- **Checklist**:
  - Does it follow SOLID principles?
  - Is it DRY (no duplication)?
  - Is it KISS (simple, understandable)?
  - YAGNI (no over-engineering)?
  - Adequate test coverage?
  - Documentation updated?
- **After approval**: Save review report to `docs/code-reviews/[TICKET-ID].md`
  - Document strengths, observations, and approval status
  - Include acceptance criteria checklist
  - Record key decisions made
  - This creates project history and learning reference

### Architecture Decisions
- Document decisions in Architecture Decision Records (ADRs)
- Location: `docs/decisions/adr-*.md`
- Include: Context, Decision, Consequences, Alternatives

## Environment Setup

### Local Development
```bash
npm install
npm run dev
```

Opens on `http://localhost:3000`

Database: SQLite (auto-created at `.data/app.db`)

### Production on Raspberry Pi
```bash
docker-compose up -d
```

Database: PostgreSQL in Docker container
Access: http://raspberrypi.local:3000

## MVP Scope (Phase 1)

1. **User Management**
   - User registration and login
   - JWT-based authentication
   - User profiles

2. **Recipe Management**
   - Create, read, update, delete recipes
   - Recipe details (name, description, ingredients, instructions)
   - Manual ingredient input

3. **Recipe Filtering**
   - Filter recipes by available ingredients
   - View recipes I can cook with current inventory

**Future Phases**:
- Nutrient-based filtering
- Recipe import from APIs
- Photo-based ingredient recognition
- Meal planning
- Shopping list generation

## Important Notes

- All documentation must be in English and Markdown
- Conversation with developer in German
- Lean-agil approach: documentation grows with features
- Requirements and architecture decisions can be revisited based on learnings
- Code review learnings should inform future development

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter
npm run test             # Run tests
npm run test:coverage    # Test with coverage report

# Docker
docker-compose up -d     # Start with PostgreSQL
docker-compose down      # Stop containers

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
```

## Contact & Support

- Developer: Matthias Bender
- Email: mbender1309@googlemail.com
- Repository: `/Users/matthias/Claude Code/mixer`
