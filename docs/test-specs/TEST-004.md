# TEST-004 — Public Read Access Test Specification

**Traces**: ARCH-004
**Verifies**: REQ-004 (AC-004-01 through AC-004-15)
**Version**: 1.0
**Date**: 2026-05-30
**Status**: Implemented

---

## 1. Scope

Tests covering unauthenticated access to read-only pages and enforcement of auth on write operations.

---

## 2. Test Cases

### TC-004-01: Dashboard accessible without login
**Verifies**: AC-004-01, AC-004-04
```
Given an unauthenticated user (no session cookie)
When they visit /dashboard
Then the recipe list is rendered
And no redirect to /login occurs
```

### TC-004-02: Recipe detail accessible without login
**Verifies**: AC-004-02
```
Given an unauthenticated user
When they visit /recipes/[id]
Then the recipe detail is rendered
And no redirect to /login occurs
```

### TC-004-03: Ingredient and phase filters work without login
**Verifies**: AC-004-03
```
Given an unauthenticated user on /dashboard
When the page loads
Then IngredientFilter and PhaseFilter components are rendered
And GET /api/recipes returns 200
```

### TC-004-04: Ingredient list accessible without login
**Verifies**: AC-004-05, AC-004-06
```
Given an unauthenticated user
When they visit /ingredients
Then the ingredient table is rendered
And the search input is functional
```

### TC-004-05: CRUD controls hidden for unauthenticated users
**Verifies**: AC-004-07
```
Given an unauthenticated user on /ingredients
Then no "Zutat hinzufügen" button is rendered
And no "Bearbeiten" or "Löschen" links are rendered in the table
And no "Aktionen" column header is rendered
```

### TC-004-06: Write pages redirect to login
**Verifies**: AC-004-08, AC-004-09, AC-004-10
```
Given an unauthenticated user
When they visit /recipes/new
Then they are redirected to /login

Given an unauthenticated user
When they visit /recipes/[id]/edit
Then they are redirected to /login

Given an unauthenticated user
When they visit /ingredients/new
Then they are redirected to /login
```

### TC-004-07: API write endpoints reject unauthenticated requests
**Verifies**: AC-004-11
```
Given a request with no session cookie
When POST /api/recipes is called
Then the response status is 401

When PUT /api/recipes/[id] is called
Then the response status is 401

When DELETE /api/recipes/[id] is called
Then the response status is 401

When POST /api/ingredients-master is called
Then the response status is 401
```

### TC-004-08: Homepage redirects to dashboard
**Verifies**: AC-004-12
```
Given any user (authenticated or not)
When they visit /
Then they are redirected to /dashboard
```

### TC-004-09: Public navigation links always visible
**Verifies**: AC-004-13, AC-004-14, AC-004-15
```
Given an unauthenticated user
When the Navigation component renders
Then "Rezepte" link is visible
And "Zutaten" link is visible
And "Anmelden" link is visible
And "Registrieren" link is visible
And "Zyklus" link is NOT visible
And "Abmelden" button is NOT visible

Given an authenticated user
When the Navigation component renders
Then "Rezepte" link is visible
And "Zutaten" link is visible
And "Zyklus" link is visible
And "Abmelden" button is visible
And "Anmelden" link is NOT visible
```

---

## 3. Test Implementation Notes

- TC-004-01 through TC-004-05 are covered by component tests mocking `useAuth` to return `{ user: null }`
- TC-004-07 is covered by existing API integration tests (auth already enforced before this change)
- TC-004-08 is covered by the Next.js redirect in `src/app/page.tsx`
- TC-004-09 can be added as a Navigation component unit test
