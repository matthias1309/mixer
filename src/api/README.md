# API Routes

Next.js API route handlers following RESTful conventions.

## Structure

- **auth/** - Authentication endpoints (POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout)
- **recipes/** - Recipe endpoints (CRUD operations)
- **users/** - User management endpoints
- **filters/** - Filter/search endpoints

## Conventions

- Named exports for HTTP methods: `export { GET, POST, PUT, DELETE }`
- Route handlers receive `NextRequest` and return `NextResponse`
- Input validation at route handler level
- Consistent error response format
