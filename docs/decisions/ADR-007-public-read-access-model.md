# ADR-007 — Public Read Access Model

**Date**: 2026-05-30
**Status**: Accepted
**Deciders**: Matthias Bender

---

## Context

The application was originally built with full authentication enforcement: every page required a valid session. For a home-server use case (Raspberry Pi), this created unnecessary friction — household members or guests could not browse recipes without creating an account.

## Decision

Adopt a **read-public / write-protected** access model:

- All `GET` API endpoints and read-only pages are publicly accessible without authentication
- All mutation operations (`POST`, `PUT`, `DELETE`) continue to require a valid JWT session
- Client-side UI adapts to auth state (hiding write controls for unauthenticated users)
- The security boundary remains server-side; client-side hiding is UX-only

## Consequences

**Positive**:
- Reduced friction for casual visitors and household users
- Consistent with the app's nature as a shared recipe collection
- No architectural changes required — API auth was already split correctly
- `/` redirects to `/dashboard`, simplifying navigation

**Negative**:
- The ingredient master list (previously admin-only) is now publicly visible — acceptable since it contains no sensitive data
- Cycle tracking (`/cycle`) remains protected as it contains personal health data

## Alternatives Considered

- **Keep full auth enforcement**: Rejected — creates unnecessary friction for the target use case
- **Optional auth with separate public/private recipes**: Rejected — over-engineered for a single-household app
