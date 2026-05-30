# ARCH-004 — Public Read Access Architecture

**Traces**: REQ-004
**Version**: 1.0
**Date**: 2026-05-30
**Status**: Implemented

---

## 1. Decision Summary

The application adopts a **read-public / write-protected** access model. All GET endpoints and read-only pages are publicly accessible. Mutation endpoints (POST, PUT, DELETE) and mutation pages continue to require a valid JWT session.

---

## 2. Affected Components

### 2.1 Frontend Pages

| Page | Before | After |
|---|---|---|
| `/` (homepage) | Landing page with login/register | Server-side redirect → `/dashboard` |
| `/dashboard` | `ProtectedRoute` (redirect to login) | Public — no auth check |
| `/ingredients` | `ProtectedRoute` (redirect to login) | Public — CRUD controls hidden conditionally |
| `/recipes/new` | `ProtectedRoute` | Unchanged (protected) |
| `/recipes/[id]/edit` | `ProtectedRoute` | Unchanged (protected) |
| `/recipes/upload` | `ProtectedRoute` | Unchanged (protected) |
| `/ingredients/new` | `ProtectedRoute` | Unchanged (protected) |
| `/ingredients/[id]/edit` | `ProtectedRoute` | Unchanged (protected) |
| `/cycle` | `ProtectedRoute` | Unchanged (protected — personal data) |

### 2.2 Navigation

- "Rezepte" (`/dashboard`) and "Zutaten" (`/ingredients`) links are always rendered
- Auth-specific items (Zyklus, email display, Abmelden) rendered only when `user !== null`
- Anmelden/Registrieren shown when `user === null`

### 2.3 API Endpoints (unchanged)

All API routes were already correctly split:

| Method | Auth required | Reason |
|---|---|---|
| `GET /api/recipes` | No | Public read |
| `GET /api/recipes/[id]` | No | Public read |
| `GET /api/ingredients-master` | No | Public read |
| `POST /api/recipes` | Yes | Write operation |
| `PUT /api/recipes/[id]` | Yes | Write operation |
| `DELETE /api/recipes/[id]` | Yes | Write operation |
| `POST /api/ingredients-master` | Yes | Write operation |
| `PUT/DELETE /api/ingredients-master/[id]` | Yes | Write operation |

No API changes were required.

---

## 3. Auth State Handling in Public Pages

### Dashboard (`/dashboard`)

The cycle-phase fetch (`GET /api/users/cycle`) is conditional on `user !== null`:

```typescript
useEffect(() => {
  if (!user) return;          // skip for unauthenticated visitors
  fetchCurrentPhase();
}, [user]);
```

Action buttons (create recipe, upload, cycle, manage ingredients) are rendered only when `user` is truthy.

### Ingredients page (`/ingredients`)

`useAuth()` is called to read auth state. The "Zutat hinzufügen" button and the Aktionen table column are rendered only when `user !== null`. The data fetch itself has no auth requirement.

---

## 4. Security Boundary

Client-side conditional rendering is a **UX measure only**. The actual security boundary is the server-side auth check in each API mutation handler:

```typescript
const auth = await authMiddlewareWithRefresh(request);
if (!auth) {
  return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
}
```

A user bypassing the frontend cannot perform write operations without a valid JWT cookie.

---

## 5. Related Decisions

- See ADR-007 for the rationale behind this access model change
- See ADR-001 for the JWT authentication mechanism
