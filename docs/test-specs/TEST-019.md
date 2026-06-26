# TEST-019 — Configurable Recipe Page Size

**Status:** Implemented — documented retroactively
**Created:** 2026-06-26
**Traces:** ARCH-019
**Verifies:** REQ-019 (AC-019-01, AC-019-02, AC-019-03, AC-019-04, AC-019-05, AC-019-06, AC-019-07)

## Test Cases

### TC-019-01 — Page-size control with fixed options

**Maps to:** AC-019-01
**Type:** unit
**File:** `src/__tests__/components/PageSizeDropdown.test.tsx`

```gherkin
Given the page-size dropdown is rendered with value 10
When it renders
Then it shows options 10, 20, 50, and 100 with 10 selected
```

**Notes:** Mirrors `SortDropdown.test.tsx` structure; query via `getByLabelText('Rezepte pro Seite')`.

---

### TC-019-02 — Selecting a page size emits the new value

**Maps to:** AC-019-02
**Type:** unit
**File:** `src/__tests__/components/PageSizeDropdown.test.tsx`

```gherkin
Given the page-size dropdown
When the user picks a different page size
Then it calls onChange with the selected page size as a number
```

**Notes:** Assert the emitted value is a `number`, not a string (the component parses `e.target.value`).

---

### TC-019-03 — RecipeList includes pageSize in the API request

**Maps to:** AC-019-02
**Type:** unit
**File:** `src/__tests__/components/RecipeList.test.tsx`

```gherkin
Given RecipeList is rendered with pageSize=20
When it fetches recipes
Then the request URL includes pageSize=20
```

**Notes:** Mock `global.fetch`, inspect the URL passed to it.

---

### TC-019-04 — Changing pageSize resets the current page to 1

**Maps to:** AC-019-03
**Type:** unit
**File:** `src/__tests__/components/RecipeList.test.tsx`

```gherkin
Given RecipeList is on page 3
When the pageSize prop changes
Then the next request is made for page=1
```

**Notes:** Render with `page` advanced via a `Pagination` interaction (or rerender with a different `pageSize` prop) and assert the second fetch call's URL contains `page=1`.

---

### TC-019-05 — pageSize above 100 is clamped to 100

**Maps to:** AC-019-04
**Type:** integration
**File:** `src/__tests__/unit/api/recipes/crud.test.ts`

```gherkin
Given a request to GET /api/recipes?pageSize=500
When the request is handled
Then the response pageSize is 100
```

---

### TC-019-06 — Invalid pageSize falls back to the default of 10

**Maps to:** AC-019-05
**Type:** integration
**File:** `src/__tests__/unit/api/recipes/crud.test.ts`

```gherkin
Given a request to GET /api/recipes?pageSize=not-a-number
When the request is handled
Then the response pageSize is 10
```

---

### TC-019-07 — totalPages reflects the requested pageSize

**Maps to:** AC-019-06
**Type:** integration
**File:** `src/__tests__/unit/api/recipes/crud.test.ts`

```gherkin
Given 25 recipes exist
When GET /api/recipes?pageSize=5 is requested
Then totalPages is 5
```

---

### TC-019-08 — Quality gates pass

**Maps to:** AC-019-07
**Type:** n/a (CI gate, not a test case)
**File:** n/a

```gherkin
Given the changes for REQ-019
When npm run lint, npx tsc --noEmit, and npm test are run
Then all of them succeed
```

**Notes:** Verified manually via CI / local commands, not a dedicated test case.
