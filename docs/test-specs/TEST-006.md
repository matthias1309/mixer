# TEST-006 — Mobile Navigation & Löschen-Modal

**Status:** draft
**Created:** 2026-06-11
**Traces:** ARCH-006
**Verifies:** REQ-006 (AC-006-01, AC-006-02)

## Test Cases

### TC-006-01 — Mobile nav: hamburger button present

**Maps to:** AC-006-01
**Type:** unit
**File:** `src/__tests__/components/Navigation.mobile.test.tsx`

```gherkin
Given a user views the navigation bar
When the component renders
Then a hamburger icon button is present in the DOM
And the mobile link menu is not rendered initially
```

**Notes:** JSDOM does not apply CSS media queries, so we cannot test `hidden md:flex`
visibility at the CSS level. Instead verify DOM presence of the hamburger button and
absence of the mobile menu container before it is opened.

---

### TC-006-02 — Mobile nav: menu opens and closes

**Maps to:** AC-006-01
**Type:** unit
**File:** `src/__tests__/components/Navigation.mobile.test.tsx`

```gherkin
Given the hamburger menu is closed
When the user clicks the hamburger button
Then the mobile menu links become visible in the DOM
And when the user clicks the backdrop
Then the mobile menu links are removed from the DOM
```

**Notes:** Backdrop is a fixed full-screen div rendered behind the menu when open.
Click it to verify close behaviour.

---

### TC-006-03 — Delete modal: opens on button click without browser confirm

**Maps to:** AC-006-02
**Type:** unit
**File:** `src/__tests__/app/recipes/detail.delete.test.tsx`

```gherkin
Given a logged-in user is on a recipe detail page they can delete
When they click the "Löschen" button
Then a confirmation modal appears in the page
And window.confirm is never called
```

**Notes:** Mock `window.confirm` with `jest.fn()`. After clicking Löschen, assert modal heading
is visible AND `window.confirm` was not called.

---

### TC-006-04 — Delete modal: cancel closes without deleting

**Maps to:** AC-006-02
**Type:** unit
**File:** `src/__tests__/app/recipes/detail.delete.test.tsx`

```gherkin
Given the delete confirmation modal is open
When the user clicks "Abbrechen"
Then the modal closes
And no DELETE request is sent
And the user remains on the recipe detail page
```

**Notes:** Assert modal heading disappears. Assert `fetch` was not called with `DELETE` method
after the Abbrechen click.

---

### TC-006-05 — Delete modal: confirm deletes and redirects

**Maps to:** AC-006-02
**Type:** unit
**File:** `src/__tests__/app/recipes/detail.delete.test.tsx`

```gherkin
Given the delete confirmation modal is open
When the user clicks "Löschen" inside the modal
Then a DELETE request is sent for the recipe
And the user is redirected to the dashboard
```

**Notes:** Mock `fetch` to return `{ ok: true }` for DELETE. Assert `router.push` called with
`'/dashboard'`.
