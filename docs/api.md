# API Documentation

## Overview

This document provides complete API reference for all endpoints in the Recipe Manager application. The API follows RESTful principles and returns JSON responses for all endpoints.

**Base URL**: `http://localhost:3000/api` (development) or `http://raspberrypi.local/api` (production)

---

## Authentication

Most endpoints require authentication via a **sessionToken** cookie. This is an HttpOnly, Secure, SameSite=Strict cookie set on user registration/login.

**Authentication Flow**:
1. User registers or logs in
2. Server sets `sessionToken` cookie (JWT, 1-hour expiration)
3. All subsequent requests include this cookie automatically
4. Server validates token and refreshes cookie on each response (sliding-window session)
5. Token expires after 1 hour of inactivity
6. User logs out to clear cookie

**Protected Endpoints**: Require valid `sessionToken` cookie, return 401 if missing or invalid.

**Optional Auth**: Some endpoints accept the token if present but don't require it (public access with optional user context).

---

## Endpoints

### Authentication

#### POST /api/auth/register

Register a new user account.

**Auth**: None required

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| email | string | yes | Valid email, max 255 chars |
| password | string | yes | Min 8 characters |

**Success Response (201)**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```
Sets `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Email and password are required" }` |
| 400 | `{ "error": "Invalid email format" }` |
| 400 | `{ "error": "Password must be at least 8 characters" }` |
| 400 | `{ "error": "Email already exists" }` |
| 500 | `{ "error": "Registration failed" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

---

#### POST /api/auth/login

Authenticate with email and password, receive session token.

**Auth**: None required

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes |

**Success Response (200)**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```
Sets `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Email and password are required" }` |
| 401 | `{ "error": "Invalid email or password" }` |
| 500 | `{ "error": "Login failed" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}' \
  -c cookies.txt
```

---

#### POST /api/auth/logout

Clear session token and logout user.

**Auth**: None required (clears cookie unconditionally)

**Request**: No body

**Success Response (200)**:
```json
{ "message": "Logged out successfully" }
```
Clears `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 500 | `{ "error": "Logout failed" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

---

#### GET /api/auth/me

Get current authenticated user profile.

**Auth**: `sessionToken` cookie required (401 if missing/invalid)

**Request**: No body, no query params

**Success Response (200)**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2026-05-15T10:30:00Z"
  }
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Not authenticated" }` |
| 401 | `{ "error": "Invalid token" }` |
| 404 | `{ "error": "User not found" }` |
| 500 | `{ "error": "Internal server error" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: sessionToken=<token>"
```

---

### User Management

#### GET /api/users/cycle

Get the current user's menstrual cycle information and current phase.

**Auth**: `sessionToken` cookie required

**Request**: No body, no query params

**Success Response (200) — cycle exists**:
```json
{
  "success": true,
  "data": {
    "last_menstruation_date": "2026-05-01",
    "cycle_length_days": 28,
    "current_phase": {
      "phase": {
        "name": "Menstruation",
        "day_start": 0,
        "day_end": 5,
        "description": "Menstruation phase (days 1-5)"
      },
      "day_of_cycle": 3,
      "cycle_progress": 10.71
    }
  }
}
```

**Success Response (200) — no cycle data**:
```json
{ "success": false, "data": null }
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Must be logged in" }` |
| 500 | `{ "error": "Failed to get cycle data" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/users/cycle \
  -H "Cookie: sessionToken=<token>"
```

---

#### POST /api/users/cycle

Save or update the user's menstrual cycle information.

**Auth**: `sessionToken` cookie required

**Request**:
```json
{
  "last_menstruation_date": "2026-05-01",
  "cycle_length_days": 28
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| last_menstruation_date | string (date) | yes | Non-empty |
| cycle_length_days | number | yes | Integer, 21-35 (inclusive) |

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* cycle row from database */ }
}
```
Refreshes `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Must be logged in to save cycle data" }` |
| 400 | `{ "error": "Last menstruation date is required" }` |
| 400 | `{ "error": "Cycle length must be between 21 and 35 days" }` |
| 500 | `{ "error": "Failed to save cycle data" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/users/cycle \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"last_menstruation_date":"2026-05-01","cycle_length_days":28}'
```

---

### Recipes

#### GET /api/recipes

List recipes with optional filtering, searching, and sorting.

**Auth**: Optional. Public endpoint with optional user context.

**Query Parameters**:
| Param | Type | Default | Constraints | Notes |
|-------|------|---------|-------------|-------|
| page | number | 1 | min 1 | pagination page number |
| pageSize | number | 10 | 1-100 | items per page |
| sort | string | "date" | "date" \| "name" \| "ingredients" | sort by field |
| search | string | — | — | search recipe name |
| ingredients | string | — | comma-separated list | filter by ingredients (AND logic) |
| phase | string | — | phase name | score by menstrual phase |

**Success Response (200)**:
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "servings": 2,
      "creatorId": 5,
      "creatorName": "Chef Maria",
      "ingredients": [
        { "name": "Pasta", "quantity": 400, "unit": "g" }
      ],
      "nutrients": { "protein": 45.2, "iron": 3.5 },
      "score": 85,
      "createdAt": "2026-05-10T14:30:00Z",
      "isDuplicate": false
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 500 | `{ "error": "Failed to list recipes" }` |

**curl**:
```bash
curl -X GET "http://localhost:3000/api/recipes?page=1&pageSize=10&sort=name&ingredients=spinach,chicken"
```

---

#### POST /api/recipes

Create a new recipe.

**Auth**: `sessionToken` cookie required

**Request**:
```json
{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta with bacon and eggs",
  "instructions": "Boil pasta, fry bacon, mix with eggs...",
  "servings": 2,
  "ingredients": [
    { "name": "Pasta", "quantity": 400, "unit": "g" },
    { "name": "Bacon", "quantity": 200, "unit": "g" },
    { "name": "Eggs", "quantity": 3, "unit": "pieces" }
  ]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | yes | Non-empty, max 100 chars |
| description | string | no | Max 500 chars |
| instructions | string | no | Max 2000 chars |
| servings | number | no | Positive integer |
| ingredients | array | no | Max 50 items; see constraints below |

Per ingredient:
| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| quantity | number | yes |
| unit | string | no |

**Success Response (201)**:
```json
{
  "id": 42,
  "name": "Pasta Carbonara",
  "creatorId": 1,
  "canonicalId": null,
  "isDuplicate": false
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Must be logged in to create recipes" }` |
| 400 | Validation errors for any field |
| 500 | `{ "error": "Failed to create recipe" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"name":"Pasta Carbonara","ingredients":[{"name":"Pasta","quantity":400,"unit":"g"}]}'
```

---

#### GET /api/recipes/[id]

Get detailed information about a specific recipe.

**Auth**: Optional. `canEdit`/`canDelete` true only if authenticated user is creator.

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, recipe ID |

**Success Response (200)**:
```json
{
  "id": 1,
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "instructions": "Boil pasta, fry bacon...",
  "servings": 2,
  "creatorId": 5,
  "creatorName": "Chef Maria",
  "ingredients": [
    { "name": "Pasta", "quantity": 400, "unit": "g" }
  ],
  "nutrients": {
    "kcal": 450.5,
    "protein": 45.2,
    "fat": 15.3,
    "carbohydrates": 52.1,
    "fiber": 2.5,
    "iron": 3.5,
    "magnesium": 125.0
  },
  "canonicalId": null,
  "isDuplicate": false,
  "createdAt": "2026-05-10T14:30:00Z",
  "updatedAt": "2026-05-10T14:30:00Z",
  "canEdit": true,
  "canDelete": true
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid recipe ID" }` |
| 404 | `{ "error": "Recipe not found" }` |
| 500 | `{ "error": "Failed to get recipe" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/recipes/42
```

---

#### PUT /api/recipes/[id]

Update an existing recipe (creator only).

**Auth**: `sessionToken` cookie required. User must be recipe creator (403 otherwise).

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, recipe ID |

**Request** (all fields optional):
```json
{
  "name": "Updated Pasta Carbonara",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "servings": 4,
  "ingredients": [
    { "name": "Pasta", "quantity": 500, "unit": "g" }
  ]
}
```

**Success Response (200)**:
```json
{
  "id": 42,
  "name": "Updated Pasta Carbonara",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "servings": 4,
  "creatorId": 1,
  "ingredients": [
    { "name": "Pasta", "quantity": 500, "unit": "g" }
  ],
  "createdAt": "2026-05-10T14:30:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid recipe ID" }` |
| 401 | `{ "error": "Must be logged in to update recipes" }` |
| 403 | `{ "error": "You can only update recipes you created" }` |
| 404 | `{ "error": "Recipe not found" }` |
| 400 | Validation errors |
| 500 | `{ "error": "Failed to update recipe" }` |

**curl**:
```bash
curl -X PUT http://localhost:3000/api/recipes/42 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"name":"Updated Pasta Carbonara","servings":4}'
```

---

#### DELETE /api/recipes/[id]

Delete a recipe (creator only).

**Auth**: `sessionToken` cookie required. User must be recipe creator (403 otherwise).

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, recipe ID |

**Success Response (204)**: No content. Refreshes `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid recipe ID" }` |
| 401 | `{ "error": "Must be logged in to delete recipes" }` |
| 403 | `{ "error": "You can only delete recipes you created" }` |
| 404 | `{ "error": "Recipe not found" }` |
| 500 | `{ "error": "Failed to delete recipe" }` |

**curl**:
```bash
curl -X DELETE http://localhost:3000/api/recipes/42 \
  -H "Cookie: sessionToken=<token>"
```

---

#### GET /api/recipes/ingredients

Get list of all unique ingredient names used across recipes.

**Auth**: Optional. Public endpoint.

**Query Parameters**: None

**Success Response (200)**:
```json
{
  "ingredients": [
    "Pasta",
    "Bacon",
    "Eggs",
    "Spinach",
    "Chicken",
    "Garlic",
    "Olive Oil"
  ],
  "total": 7
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 500 | `{ "error": "Failed to get ingredients" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/recipes/ingredients
```

---

#### POST /api/recipes/ocr

Upload a recipe photo for OCR (Optical Character Recognition) text extraction.

**Auth**: `sessionToken` cookie required

**Request**: `multipart/form-data`
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| file | File | yes | JPG or PNG, max 5 MB |

**Success Response (200)**:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "estimatedTime": 5
}
```
OCR processing is asynchronous. Poll `GET /api/recipes/ocr/[uploadId]` for results.

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Unauthorized" }` |
| 400 | `{ "error": "No file provided" }` |
| 400 | `{ "error": "File must be smaller than 5MB" }` |
| 400 | `{ "error": "Only JPG and PNG files are supported" }` |
| 500 | `{ "error": "Upload failed" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/recipes/ocr \
  -H "Cookie: sessionToken=<token>" \
  -F "file=@recipe.jpg"
```

---

#### GET /api/recipes/ocr/[uploadId]

Check the status of OCR processing and retrieve extracted ingredients.

**Auth**: None required (relies on uploadId received from POST)

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| uploadId | string | UUID from POST /api/recipes/ocr |

**Success Response (200) — still processing**:
```json
{
  "status": 200,
  "data": { "status": "processing" }
}
```

**Success Response (200) — complete**:
```json
{
  "status": 200,
  "data": {
    "status": "complete",
    "raw_text": "Pasta Carbonara\n400g pasta\n200g bacon...",
    "ingredients": [
      { "name": "Pasta", "quantity": 400, "unit": "g" },
      { "name": "Bacon", "quantity": 200, "unit": "g" }
    ]
  }
}
```

**Success Response (200) — error during OCR**:
```json
{
  "status": 200,
  "data": { "status": "error", "error": "OCR processing failed" }
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 404 | `{ "error": "Upload not found" }` |
| 500 | `{ "error": "Status check failed" }` |

**curl**:
```bash
curl -X GET "http://localhost:3000/api/recipes/ocr/550e8400-e29b-41d4-a716-446655440000"
```

---

#### POST /api/recipes/[id]/calculate

Calculate and store nutritional information for a recipe.

**Auth**: `sessionToken` cookie required. User must be recipe creator (401/404 otherwise).

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, recipe ID |

**Request**:
```json
{
  "portions": 2
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| portions | number | yes | Must be > 0 |

**Success Response (200)**:
```json
{
  "status": 200,
  "data": {
    "total": {
      "kcal": 900.5,
      "protein": 90.4,
      "fat": 30.6,
      "carbohydrates": 104.2,
      "fiber": 5.0,
      "iron": 7.0,
      "magnesium": 250.0
    },
    "per_portion": {
      "kcal": 450.25,
      "protein": 45.2,
      "fat": 15.3,
      "carbohydrates": 52.1,
      "fiber": 2.5,
      "iron": 3.5,
      "magnesium": 125.0
    }
  }
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid recipe ID" }` |
| 401 | `{ "error": "Unauthorized" }` |
| 400 | `{ "error": "Portions must be > 0" }` |
| 404 | `{ "error": "Recipe not found" }` |
| 400 | `{ "error": "Recipe has no ingredients" }` |
| 500 | `{ "status": 500, "error": "Calculation failed" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/recipes/42/calculate \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"portions":2}'
```

---

### Ingredients Master

The Ingredients Master database stores nutritional information for individual ingredients. This data is used to calculate recipe nutrition and provide phase-based recipe recommendations.

#### GET /api/ingredients-master

List all ingredients with optional search and pagination.

**Auth**: None required (public endpoint)

**Query Parameters**:
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| page | number | 1 | min 1 |
| pageSize | number | 20 | 1-100 |
| search | string | — | Search by ingredient name (case-insensitive) |

**Success Response (200)**:
```json
{
  "ingredients": [
    {
      "id": 1,
      "name": "Spinach",
      "category": "Vegetables",
      "base_unit": "g",
      "base_size": 100,
      "kcal": 23,
      "protein": 2.7,
      "fat": 0.4,
      "carbohydrates": 3.6,
      "fiber": 2.2,
      "sodium": 71,
      "calcium": 99,
      "vitamin_d": 0,
      "magnesium": 79,
      "vitamin_b6": 0.2,
      "vitamin_b12": 0,
      "vitamin_e": 2.0,
      "iron": 2.7,
      "zinc": 0.5,
      "sugar": 0.4,
      "created_at": "2026-05-15T10:00:00Z",
      "updated_at": "2026-05-15T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 500 | `{ "error": "Failed to list ingredients" }` |

**curl**:
```bash
curl -X GET "http://localhost:3000/api/ingredients-master?page=1&pageSize=20&search=spinach"
```

---

#### POST /api/ingredients-master

Create a new ingredient with nutritional values.

**Auth**: `sessionToken` cookie required

**Request**:
```json
{
  "name": "Spinach",
  "category": "Vegetables",
  "base_unit": "g",
  "base_size": 100,
  "kcal": 23,
  "protein": 2.7,
  "fat": 0.4,
  "carbohydrates": 3.6,
  "fiber": 2.2,
  "sodium": 71,
  "calcium": 99,
  "magnesium": 79,
  "iron": 2.7,
  "zinc": 0.5
}
```

All nutrition fields are optional (defaults to 0). Fields with >= 0 constraint are validated.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | yes | Non-empty, max 255 chars, **unique** |
| category | string | no | — |
| base_unit | string | no | Defaults to "g" |
| base_size | number | no | Defaults to 100 |
| kcal, protein, fat, carbohydrates, fiber, sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, iron, zinc, sugar | number | no | >= 0, finite |

**Success Response (201)**:
```json
{
  "id": 42,
  "name": "Spinach",
  "category": "Vegetables",
  "base_unit": "g",
  "base_size": 100,
  "kcal": 23,
  "protein": 2.7,
  "fat": 0.4,
  "carbohydrates": 3.6,
  "fiber": 2.2,
  "sodium": 71,
  "calcium": 99,
  "vitamin_d": 0,
  "magnesium": 79,
  "vitamin_b6": 0.2,
  "vitamin_b12": 0,
  "vitamin_e": 2.0,
  "iron": 2.7,
  "zinc": 0.5,
  "sugar": 0.4,
  "created_at": "2026-05-15T10:00:00Z",
  "updated_at": "2026-05-15T10:00:00Z"
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 401 | `{ "error": "Must be logged in to create ingredients" }` |
| 400 | Validation errors |
| 409 | `{ "error": "Ingredient with this name already exists" }` |
| 500 | `{ "error": "Failed to create ingredient" }` |

**curl**:
```bash
curl -X POST http://localhost:3000/api/ingredients-master \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"name":"Spinach","category":"Vegetables","kcal":23,"protein":2.7,"iron":2.7}'
```

---

#### GET /api/ingredients-master/[id]

Get detailed information about a specific ingredient.

**Auth**: None required (public endpoint)

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, ingredient ID |

**Success Response (200)**:
```json
{
  "id": 1,
  "name": "Spinach",
  "category": "Vegetables",
  "base_unit": "g",
  "base_size": 100,
  "kcal": 23,
  "protein": 2.7,
  "fat": 0.4,
  "carbohydrates": 3.6,
  "fiber": 2.2,
  "sodium": 71,
  "calcium": 99,
  "vitamin_d": 0,
  "magnesium": 79,
  "vitamin_b6": 0.2,
  "vitamin_b12": 0,
  "vitamin_e": 2.0,
  "iron": 2.7,
  "zinc": 0.5,
  "sugar": 0.4,
  "created_at": "2026-05-15T10:00:00Z",
  "updated_at": "2026-05-15T10:00:00Z"
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid ingredient ID" }` |
| 404 | `{ "error": "Ingredient not found" }` |
| 500 | `{ "error": "Failed to get ingredient" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/ingredients-master/1
```

---

#### PUT /api/ingredients-master/[id]

Update an ingredient's nutritional values (any authenticated user).

**Auth**: `sessionToken` cookie required

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, ingredient ID |

**Request** (all fields optional):
```json
{
  "name": "Updated Spinach",
  "category": "Green Vegetables",
  "kcal": 25,
  "iron": 2.8
}
```

Same field constraints as POST.

**Success Response (200)**:
```json
{
  "id": 1,
  "name": "Updated Spinach",
  "category": "Green Vegetables",
  "kcal": 25,
  "iron": 2.8,
  "updated_at": "2026-05-15T11:00:00Z"
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid ingredient ID" }` |
| 401 | `{ "error": "Must be logged in to update ingredients" }` |
| 404 | `{ "error": "Ingredient not found" }` |
| 400 | Validation errors |
| 409 | `{ "error": "Ingredient with this name already exists" }` |
| 500 | `{ "error": "Failed to update ingredient" }` |

**curl**:
```bash
curl -X PUT http://localhost:3000/api/ingredients-master/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<token>" \
  -d '{"kcal":25,"iron":2.8}'
```

---

#### DELETE /api/ingredients-master/[id]

Delete an ingredient (any authenticated user).

**Auth**: `sessionToken` cookie required

**Path Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| id | number | Positive integer, ingredient ID |

**Success Response (204)**: No content. Refreshes `sessionToken` cookie.

**Error Responses**:
| Status | Error |
|--------|-------|
| 400 | `{ "error": "Invalid ingredient ID" }` |
| 401 | `{ "error": "Must be logged in to delete ingredients" }` |
| 404 | `{ "error": "Ingredient not found" }` |
| 500 | `{ "error": "Failed to delete ingredient" }` |

**curl**:
```bash
curl -X DELETE http://localhost:3000/api/ingredients-master/1 \
  -H "Cookie: sessionToken=<token>"
```

---

### Nutrition

#### GET /api/nutrition/ingredients

Get all ingredients with their nutritional data (alternative to ingredients-master endpoint).

**Auth**: None required (public endpoint)

**Query Parameters**: None

**Success Response (200)**:
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "Spinach",
      "category": "Vegetables",
      "kcal": 23,
      "protein": 2.7,
      "iron": 2.7,
      "magnesium": 79
    }
  ],
  "total": 45
}
```

**Error Responses**:
| Status | Error |
|--------|-------|
| 500 | `{ "status": 500, "error": "Failed to fetch ingredients" }` |

**curl**:
```bash
curl -X GET http://localhost:3000/api/nutrition/ingredients
```

---

## Global Status Codes

| Status | Meaning | Common Causes |
|--------|---------|--------------|
| 200 | OK | Successful GET request or successful state update |
| 201 | Created | Successful resource creation (POST) |
| 204 | No Content | Successful deletion (DELETE) |
| 400 | Bad Request | Validation errors, invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions (e.g., not recipe creator) |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Unique constraint violation (e.g., duplicate ingredient name) |
| 500 | Internal Server Error | Unhandled server error |

---

## Error Response Format

Most errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

Some endpoints may use alternative formats:

```json
{
  "status": 500,
  "error": "Error message"
}
```

Always check the HTTP status code to determine if a request succeeded or failed.

---

## Rate Limiting

Currently, there is no rate limiting on the API. This may be added in future versions.

---

## Version

**API Version**: 1.0  
**Last Updated**: 2026-05-15
