# Recipe Manager

A multi-user recipe management web application with ingredient-based filtering, designed to help users discover recipes they can cook with ingredients they have on hand.

## Features (MVP)

- **User Management**: Register, login, and manage your profile with JWT authentication
- **Recipe Management**: Create, read, update, and delete recipes with ingredients and instructions
- **Ingredient Filtering**: Filter recipes by available ingredients to discover what you can cook
- **Multi-User Support**: Each user has their own recipe collection and profile

## Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Backend**: Next.js API Routes (Node.js)
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT-based
- **Testing**: Jest + React Testing Library + Cypress
- **Containerization**: Docker

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Update .env.local with your values (especially JWT_SECRET)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
# Unit and integration tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## Production Deployment

### On Raspberry Pi with Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

See `docker-compose.yml` for configuration details.

## Project Structure

```
mixer/
├── docs/                    # Documentation
│   ├── architecture/        # Arc42 architecture documentation
│   ├── requirements/        # Req42 requirements documentation
│   └── roadmap/            # Project planning and kanban board
├── src/                    # Application source code
│   ├── app/               # Next.js app directory (routes, layouts)
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   ├── api/              # API route handlers
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # CSS and styling
│   └── __tests__/        # Unit and integration tests
├── tests/
│   ├── e2e/             # Cypress E2E tests
│   └── fixtures/        # Test data and mocks
├── docker-compose.yml   # Production Docker setup
├── jest.config.js       # Jest configuration
├── next.config.js       # Next.js configuration
└── tsconfig.json        # TypeScript configuration
```

## Documentation

### For Developers

- **Architecture**: See `docs/architecture/arc42.md` for system architecture, design decisions, and deployment information
- **Requirements**: See `docs/requirements/` for detailed feature requirements and specifications
- **Roadmap**: See `docs/roadmap/kanban.md` for project plan, tickets, and progress tracking

### Key Documents

- `.claude/CLAUDE.md` - Project guidelines, development methodology, and important constraints
- `docs/requirements/req42-template.md` - Requirements documentation template and structure
- `docs/roadmap/kanban.md` - Kanban board with tickets for MVP features

## Development Methodology

This project follows the **V-Model** development approach with **Lean-Agile** practices:

1. **Requirements** → Detailed in Req42 format (see `docs/requirements/`)
2. **Architecture** → Documented in Arc42 format (see `docs/architecture/`)
3. **Implementation** → TDD approach with comprehensive tests
4. **Testing** → Unit (80%+ coverage target), integration, and E2E tests
5. **Review** → Code review focusing on clean code principles (DRY, KISS, YAGNI)
6. **Feedback Loop** → Learnings feed back into future decisions

### Code Quality Standards

- **Minimum Test Coverage**: 80%
- **Clean Code Principles**:
  - DRY (Don't Repeat Yourself)
  - KISS (Keep It Simple, Stupid)
  - YAGNI (You Aren't Gonna Need It)
- **Definition of Done**:
  - All acceptance criteria met
  - Tests written and passing
  - Code reviewed and approved
  - Documentation updated

## Contribution Guidelines

See `.claude/CLAUDE.md` for detailed contribution guidelines including:

- Commit conventions
- Code style requirements
- Testing requirements
- Code review checklist
- Definition of done

## Environment Variables

Copy `.env.example` to `.env.local` and update:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Development or production | `development` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-secret-key-change-in-production` |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` |
| `DATABASE_URL` | Database connection string | `file:./.data/app.db` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## Troubleshooting

### Database Issues

```bash
# Reset SQLite database (development only)
rm .data/app.db
npm run dev  # Will recreate database
```

### Port Already in Use

```bash
# Change port in npm scripts or use:
PORT=3001 npm run dev
```

## Future Phases

### Phase 2: Enhancements
- Nutrient-based filtering
- Recipe import from external APIs
- Meal planning features

### Phase 3: Advanced
- Photo-based ingredient recognition
- Recipe recommendation engine
- Advanced nutrition tracking

## License

Private project

## Contact

- Developer: Matthias Bender
- Email: mbender1309@googlemail.com

---

**Last Updated**: 2026-05-09  
**Version**: 0.1.0 (MVP in development)
