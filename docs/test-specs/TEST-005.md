# TEST-005 — UX/UI Verbesserungen Phase 1

**Status:** draft
**Created:** 2026-06-11
**Traces:** ARCH-005
**Verifies:** REQ-005 (AC-005-01, AC-005-02, AC-005-03, AC-005-04)

## Test Cases

### TC-005-01 — Recipe detail: logical content order

**Maps to:** AC-005-01
**Type:** unit
**File:** `src/__tests__/app/recipes/detail.ux.test.tsx`

```gherkin
Given a user opens a recipe detail page
When the page finishes loading
Then the content appears in this order: description → ingredients → instructions → nutrients
```

**Notes:** Mock `fetch`, `useParams`, `useRouter`, `useAuth`, `useFilter`. Use
`document.body.innerHTML` index comparison to verify DOM order. Provide a fixture recipe with
all fields populated.

---

### TC-005-02 — Recipe detail: nutrients collapsed by default

**Maps to:** AC-005-01
**Type:** unit
**File:** `src/__tests__/app/recipes/detail.ux.test.tsx`

```gherkin
Given a user opens a recipe detail page with nutrient data
When the page finishes loading
Then the nutrient values are not visible
And when the user clicks the nutrients toggle
Then the nutrient values become visible
```

**Notes:** Same mocks as TC-005-01. Check for absence/presence of a specific nutrient value
(e.g. `kcal`) before and after clicking the toggle button.

---

### TC-005-03 — Dashboard: primary CTA appears above recipe list

**Maps to:** AC-005-02
**Type:** unit
**File:** `src/__tests__/app/dashboard/page.ux.test.tsx`

```gherkin
Given a logged-in user opens the dashboard
When the page finishes loading
Then the "Rezept erstellen" link appears in the DOM before the recipe list container
And only one button carries the primary filled style
```

**Notes:** Mock `useAuth` (user logged in), `fetch` (empty recipe list response), `FilterContext`.
Use `compareDocumentPosition` or index-based check to assert DOM order.

---

### TC-005-04 — Phase filter: chips instead of dropdown

**Maps to:** AC-005-03
**Type:** unit
**File:** `src/__tests__/components/PhaseFilter.test.tsx`

```gherkin
Given a user is on the dashboard
When they look at the phase filter
Then no <select> dropdown is present
And four clickable phase buttons are visible
And the currently active phase button is visually highlighted
And clicking a chip calls onFilterChange with the correct phase
```

**Notes:** Render `<PhaseFilter onFilterChange={mockFn} currentPhase="follicular" />`.
Check for absence of `select` element. Verify four buttons with phase labels.
Check that the "follicular" button has the active class.

---

### TC-005-05 — Wake lock: icon instead of text label

**Maps to:** AC-005-04
**Type:** unit
**File:** `src/__tests__/unit/components/Navigation.wakeLock.test.tsx`

```gherkin
Given any user views the navigation bar
When the wake lock button is displayed
Then the button does not contain the text "Bildschirm: AN" or "Bildschirm: AUS"
And the button contains an SVG element
And the active/inactive state is visually distinguishable via CSS class
```

**Notes:** Add to existing describe block in `Navigation.wakeLock.test.tsx`. Reuse existing
mocks. Check for absence of text label and presence of `<svg>`.
