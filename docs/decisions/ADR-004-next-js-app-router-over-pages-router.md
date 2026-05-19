# ADR-004: Next.js App Router (over Pages Router)

**Status**: Accepted  
**Date**: 2026-05-19  
**Context**: Project uses Next.js for full-stack application. App Router is the modern approach, replacing Pages Router.

## Decision

Use Next.js App Router architecture (directory-based routing under `app/` directory) instead of older Pages Router.

## Consequences

**Advantages**:
- Modern file-based routing system
- Server Components by default (better performance)
- Improved API route organization
- Nested layouts for shared UI
- Route groups for logical organization

**Disadvantages**:
- Newer API (less third-party library support)
- Migration path needed if legacy code uses Pages Router
- Slight learning curve for developers familiar with Pages Router

## Architecture

**File Structure**:
```
app/
├── (auth)/           # Route group for auth pages
│   ├── login/page.tsx
│   └── register/page.tsx
├── api/              # API routes
│   ├── auth/
│   ├── recipes/
│   └── health/route.ts
├── dashboard/page.tsx
├── recipes/
│   ├── [id]/page.tsx (dynamic route)
│   └── new/page.tsx
└── layout.tsx        # Root layout
```

## Key Features Used

1. **Dynamic Routes**: `[id]` syntax for parametric paths
2. **Route Groups**: `(groupName)` for logical organization without URL impact
3. **API Routes**: `route.ts` files for HTTP handlers
4. **Middleware**: `middleware.ts` at project root for request processing
5. **Server Components**: Default rendering strategy

## Related Files

- `src/app/layout.tsx` (root layout)
- `src/app/api/recipes/route.ts` (API example)
- `src/app/recipes/[id]/page.tsx` (dynamic route example)
- `src/middleware.ts` (request middleware)

## Migration Note

Pages Router code still supported but should migrate to App Router for consistency.
