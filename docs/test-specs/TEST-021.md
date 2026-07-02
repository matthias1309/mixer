# TEST-021 — Rate Limit for OCR Uploads

**Status:** draft
**Created:** 2026-07-02
**Traces:** ARCH-021
**Verifies:** REQ-021 (AC-021-01, AC-021-02, AC-021-03)

## Test Cases

### TC-021-01 — Uploads within the limit are accepted / limit blocks beyond it

**Maps to:** AC-021-01, AC-021-02
**Type:** unit
**File:** `src/__tests__/unit/api/recipes/ocr-rate-limit.test.ts`

```gherkin
Given an authenticated user who has made fewer than 10 OCR uploads in the last 10 minutes
When they submit another recipe photo for OCR
Then the upload is accepted (HTTP 200)

Given an authenticated user who has made 10 OCR uploads in the last 10 minutes
When they submit another recipe photo for OCR
Then the request is rejected with HTTP 429
And the response includes a Retry-After header
```

**Notes:** Tesseract is mocked so the test exercises only the route's limiting
behaviour. The first 10 uploads assert 200; the 11th asserts 429 and a
truthy `Retry-After` header. Combined into one test as they share setup.

---

### TC-021-02 — Limits are per user

**Maps to:** AC-021-03
**Type:** unit
**File:** `src/__tests__/unit/api/recipes/ocr-rate-limit.test.ts`

```gherkin
Given one user has reached the OCR upload limit
When a different authenticated user submits a recipe photo for OCR
Then that user's upload is accepted (HTTP 200)
```

**Notes:** Two distinct users/tokens; user 1 is driven to 429, then user 2's
upload must still return 200. Rate-limit store cleared in `beforeEach`.
