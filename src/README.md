# Source Code Directory

This directory contains all application source code.

## Structure

- **app/** - Next.js app directory with pages and layouts (App Router)
- **api/** - API route handlers (Next.js API Routes)
- **components/** - React components (organized by feature)
- **lib/** - Utilities, helpers, database, auth, etc.
- **types/** - TypeScript type definitions
- **styles/** - CSS and styling
- **__tests__/** - Unit and integration tests

## Adding New Features

1. Create types in `types/[feature].ts`
2. Create components in `components/[feature]/`
3. Create API routes in `api/[feature]/`
4. Add tests alongside implementation
5. Update constants if needed in `lib/constants.ts`
