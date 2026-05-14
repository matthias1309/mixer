# Recipe Manager MVP

A community recipe management application with ingredient-based filtering. Built with Next.js 14+, React, and TypeScript.

## Features

### User Authentication
- User registration with email/password
- Login/logout with JWT-based auth
- Automatic token refresh (1h inactivity timeout)
- Protected routes for authenticated users

### Recipe Management
- Create, view, edit, delete recipes
- Recipes are community-accessible (all users see all recipes)
- Automatic recipe deduplication
- Ingredient management with normalization
- Recipe details include creator name and timestamps

### Ingredient Filtering
- Filter recipes by ingredients you have on hand
- Multiple ingredient selection
- AND logic (recipes must have ALL selected ingredients)
- Real-time recipe list updates
- Unique ingredient list across all recipes

### Frontend
- Responsive design (mobile-first)
- Next.js 14+ with App Router
- React Context for state management
- Tailwind CSS styling
- E2E tests with Cypress

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (Cypress UI)
npm run test:e2e

# Run E2E tests (headless)
npm run test:e2e:headless
```

## Architecture

### Backend (API Routes)
- 8 RESTful endpoints
- SQLite (local) / PostgreSQL (production)
- JWT authentication with sliding-window refresh
- Parameterized SQL queries (SQL injection protection)
- Request validation and error handling

### Frontend (React + Next.js)
- Authentication pages (login, register)
- Dashboard with recipe list and filtering
- Recipe detail, create, and edit pages
- Ingredient filter component
- Protected routes for authenticated pages
- E2E tests for critical user flows

### State Management
- AuthContext - User auth state
- FilterContext - Ingredient selection state
- Custom hooks for component access

## Project Structure

```
mixer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   ├── dashboard/         # Recipe list (protected)
│   │   ├── recipes/           # Recipe routes
│   │   │   ├── [id]/          # Detail and edit
│   │   │   └── new/           # Create
│   │   └── api/               # API routes
│   ├── components/             # React components
│   │   ├── forms/             # Form components
│   │   ├── Navigation.tsx      # Header
│   │   ├── RecipeList.tsx      # Recipe grid
│   │   ├── RecipeCard.tsx      # Recipe item
│   │   ├── IngredientFilter.tsx# Filter UI
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   └── ...
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx     # User auth state
│   │   └── FilterContext.tsx   # Ingredient selection
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Access auth context
│   │   └── useFilter.ts       # Access filter context
│   ├── lib/                   # Utilities
│   │   ├── api.ts             # API client
│   │   └── validation.ts      # Form validation
│   ├── styles/                # CSS
│   │   └── globals.css        # Tailwind imports
│   └── __tests__/             # Unit tests
├── tests/
│   └── e2e/                   # E2E tests (Cypress)
├── cypress/                   # Cypress configuration
├── docs/
│   ├── architecture/          # Arc42 documentation
│   ├── requirements/          # Requirements (Req42)
│   ├── superpowers/           # Plans and specs
│   └── IMPLEMENTATION_NOTES.md# Implementation details
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── cypress.config.ts
└── .env.local.example         # Environment template
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Docker (Raspberry Pi)
```bash
docker-compose up -d
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: React Context API
- **Testing**: Cypress (E2E), Jest (unit)
- **HTTP**: fetch API

### Backend
- **Framework**: Next.js API Routes
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT with sliding-window refresh
- **Security**: Bcrypt (password hashing)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Recipes
- `GET /api/recipes` - List recipes (paginated, searchable, filterable)
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe detail
- `PUT /api/recipes/:id` - Update recipe (owner only)
- `DELETE /api/recipes/:id` - Delete recipe (owner only)

### Filtering
- `GET /api/recipes/ingredients` - List unique ingredients

## Security

### XSS Protection
- React auto-escapes JSX
- No innerHTML usage
- Input validation on forms

### SQL Injection Prevention
- Parameterized SQL queries
- ORM-style model layer (better-sqlite3)

### CSRF Protection
- httpOnly cookies with SameSite=strict
- POST requests require token from cookie

### Authentication
- Passwords hashed with bcrypt (cost 10)
- JWT tokens auto-refresh on each request
- 1-hour inactivity timeout

## Development

### Code Style
- TypeScript strict mode
- ESLint for linting
- Prettier for formatting

### Testing Requirements
- 80%+ code coverage target
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for user flows

### Git Workflow
- Feature branches from main
- Conventional commits
- Pull request reviews
- Merge to main when approved

## Known Limitations

### MVP Scope
- Single-session authentication (no concurrent logins)
- No password reset
- No advanced user profiles
- No recipe ratings/reviews
- No images/media
- Community-read-only (recipes shared but not rated)

### Performance
- Designed for <100 recipes, <200 ingredients
- Pagination required for large collections
- No caching layer (future optimization)

## Future Enhancements

### Phase 2
- Recipe ratings and reviews
- User profiles with preferences
- Nutrient-based filtering
- Ingredient substitution suggestions

### Phase 3
- Photo-based ingredient recognition
- Recipe recommendation engine
- Meal planning
- Shopping list generation

## Support

For issues or questions:
- Check IMPLEMENTATION_NOTES.md for architecture details
- Review requirements in docs/requirements/mvp/
- See Arc42 documentation in docs/architecture/

## License

MIT

## Contributors

- Matthias Bender
