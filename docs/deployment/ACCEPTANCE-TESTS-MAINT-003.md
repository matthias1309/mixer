# MAINT-003 Acceptance Test Checklist

Manual acceptance tests against the live Uberspace deployment at
`https://matt-maxx.de/rezepte`.

## Automated Checks (CI) ✅

- [x] `npm test` — 437/437 tests pass
- [x] `npm run lint` — no errors
- [x] `npx tsc --noEmit` — no errors
- [x] `.github/workflows/deploy.yml` `test` job green on `main`
- [x] `.github/workflows/deploy.yml` `deploy` job green (build with
      `BASE_PATH=/rezepte`, `better-sqlite3` binding present, app ready)
- [x] `.github/workflows/deploy.yml` `smoke-test` job green
      (`/rezepte/api/recipes/ingredients` → `200 application/json`)

## Manual Tests (Production — `https://matt-maxx.de/rezepte`)

### 1. HTTPS & sub-path

- [ ] `https://matt-maxx.de/rezepte` loads over HTTPS with a valid
      Let's Encrypt certificate (no browser warning)
- [ ] `http://matt-maxx.de/rezepte` redirects to HTTPS
- [ ] No assets (JS/CSS/images) 404 in the browser network tab

### 2. Authentication

- [ ] Register a new user at `/rezepte/register`
- [ ] Log in at `/rezepte/login`
- [ ] Session cookie is scoped to `/rezepte` (check DevTools → Application →
      Cookies → Path)
- [ ] Log out and confirm the session ends

### 3. Core navigation (base-path / `apiUrl()` audit)

- [ ] Dashboard loads and shows recipe data
- [ ] "Rezept erstellen" link opens the new-recipe page under `/rezepte/...`
- [ ] "Aus Foto" (OCR import) link works
- [ ] "Zutaten" (ingredients) page loads and lists ingredients
- [ ] "Zyklus" page loads
- [ ] Recipe detail → "Bearbeiten" (edit) works
- [ ] "Zurück zum Dashboard/Übersicht" links return under `/rezepte`
- [ ] No request in the network tab targets `/api/...` without the
      `/rezepte` prefix

### 4. Database / data integrity

- [ ] Pre-existing recipes from the Pi PostgreSQL database are visible after
      migration
- [ ] Create a test recipe, edit it, then delete it — all succeed
- [ ] Ingredient filtering ("recipes I can cook") returns expected results

### 5. Deployment pipeline

- [ ] Push a trivial change to `main` and confirm
      `.github/workflows/deploy.yml` runs `test` → `deploy` → `smoke-test`
      automatically, with no manual SSH steps
- [ ] `supervisorctl status mixer` on the host shows `RUNNING` after deploy
- [ ] `~/logs/mixer-error.log` has no new errors after deploy

## Test Environment Notes

- Production secrets (`JWT_SECRET`, `NEXTAUTH_SECRET`, DB path) live in
  `~/mixer/.env.production` on the Uberspace host — never in the repo.
- `better-sqlite3` must be built on the host against Node 22; if a deploy
  reports a missing binding, the CI step rebuilds it automatically.

## Sign-off

Date: ___________
Tester: _________
Result: [ ] PASS [ ] FAIL
Notes: __________________________________
