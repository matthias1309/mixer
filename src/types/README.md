# Types Directory

TypeScript type definitions and interfaces.

## Structure

- **index.ts** - Central export file for all types
- **auth.ts** - Authentication-related types (User, Token, etc.)
- **recipe.ts** - Recipe-related types
- **user.ts** - User profile types
- **api.ts** - API request/response types

## Conventions

- Export all types from index.ts for easy importing
- Use interfaces for objects, types for unions/aliases
- Prefix union type discriminators with type: `type Role = 'admin' | 'user'`
- Document complex types with JSDoc comments
