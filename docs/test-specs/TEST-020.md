# TEST-020 — Absolute Session Lifetime

**Status:** draft
**Created:** 2026-07-02
**Traces:** ARCH-020
**Verifies:** REQ-020 (AC-020-01, AC-020-02, AC-020-03, AC-020-04)

## Test Cases

### TC-020-01 — Active session within the absolute lifetime keeps working

**Maps to:** AC-020-01
**Type:** unit
**File:** `src/__tests__/lib/auth/session-lifetime.test.ts`

```gherkin
Given a user who logged in less than 24 hours ago
When they make an authenticated API request
Then the request succeeds
And a refreshed session token is issued (sliding window unchanged)
```

**Notes:** Fake timers (`jest.useFakeTimers` + `setSystemTime`); token passed
via `sessionToken` cookie on a `NextRequest`; no database needed —
`authMiddlewareWithRefresh` is pure JWT logic.

---

### TC-020-02 — Session ends 24 hours after login despite continuous activity

**Maps to:** AC-020-02
**Type:** unit
**File:** `src/__tests__/lib/auth/session-lifetime.test.ts`

```gherkin
Given a user who logged in more than 24 hours ago
And whose token has been refreshed continuously since then
When they make an authenticated API request
Then the request is treated as unauthenticated
And no refreshed session token is issued
```

**Notes:** Simulates the refresh chain by minting a fresh (non-expired) token
via `refreshToken` that carries an `authTime` older than 24h — exactly what a
continuously refreshed session looks like.

---

### TC-020-03 — Refreshed tokens preserve the original login time

**Maps to:** AC-020-03
**Type:** unit
**File:** `src/__tests__/lib/auth/session-lifetime.test.ts`

```gherkin
Given a session token issued at login
When the token is refreshed during an authenticated request
Then the new token carries the original login timestamp
And the new token's remaining absolute lifetime is not extended
```

**Notes:** Decode `newToken` returned by the middleware and compare its
`authTime` claim with the login time.

---

### TC-020-04 — A fresh login restarts the absolute lifetime

**Maps to:** AC-020-04
**Type:** unit
**File:** `src/__tests__/lib/auth/session-lifetime.test.ts`

```gherkin
Given a user whose previous session reached its absolute lifetime
When they log in again with valid credentials
Then a new session is created
And its absolute lifetime starts from the new login time
```

**Notes:** `generateToken` (used by login/register) must stamp the current
time as `authTime`.

---

### TC-020-05 — Legacy tokens without authTime fall back to iat

**Maps to:** AC-020-01 _(backwards-compatibility edge case, see ARCH-020)_
**Type:** unit
**File:** `src/__tests__/lib/auth/session-lifetime.test.ts`

```gherkin
Given a session token minted before the authTime claim existed
When it is used within its sliding-window validity
Then the request succeeds
And the refreshed token carries the legacy token's iat as authTime
```

**Notes:** Sign a token manually with `jsonwebtoken` omitting `authTime` to
simulate a pre-deploy token.
