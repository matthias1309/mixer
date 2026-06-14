# Uberspace Setup Guide

Traces: MAINT-003 (Phase 3 — Uberspace host setup)

This guide documents the one-time, manual bring-up of the Mixer app on
Uberspace. All commands run **on the Uberspace host** via SSH, as the
`mattmaxx` user. Replace `mattmaxx` if your username differs.

Resolved inputs (see `docs/roadmap/tickets/MAINT-003-uberspace-migration.md`):

- Uberspace user: `mattmaxx`
- App port: `8723` (confirm free on first setup, see Step 1)
- Domain: `matt-maxx.de`, sub-path `/rezepte`

---

## 1. Prerequisites

SSH into the host and confirm the target port is free:

```bash
ssh mattmaxx@mattmaxx.uberspace.de
ss -tlpn | grep 8723   # should print nothing
```

If `8723` is already taken, pick another free port above 1024 and use it
consistently for the rest of this guide, `deploy/mixer.ini`, and the
`.env.production` file in Step 4.

## 2. Node version

```bash
uberspace tools version use node 22
node -v   # should print v22.x
```

## 3. Clone and build the app

```bash
git clone https://github.com/matthias1309/mixer.git ~/mixer
cd ~/mixer
npm ci
npm run build
```

`npm run build` runs `NODE_ENV=production next build` (see `package.json`).
`better-sqlite3` is a native module, so it is compiled here on the host
against the Node 22 ABI — do not copy `node_modules` from elsewhere.

## 4. Place the migrated database

The SQLite database is produced once, locally, by the Phase 2 migration
script (`npm run db:migrate-pg-to-sqlite`) and copied to the host:

```bash
# on your local machine
scp mixer.db mattmaxx@mattmaxx.uberspace.de:~/data/mixer.db
```

```bash
# on the host
mkdir -p ~/data
ls -la ~/data/mixer.db
```

## 5. Configure secrets (`~/mixer/.env.production`)

This file is **not** committed to the repository. Generate secrets and
create it on the host:

```bash
cd ~/mixer
JWT_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

cat > .env.production <<EOF
NODE_ENV=production
DATABASE_URL=file:/home/mattmaxx/data/mixer.db
JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://matt-maxx.de/rezepte
BASE_PATH=/rezepte
PORT=8723
EOF

chmod 600 .env.production
```

`NODE_ENV=production` makes Next.js load `.env.production` automatically, so
no extra configuration is needed for the app to pick these up.

## 6. supervisord service

Copy the template from `deploy/mixer.ini` (committed in this repo) to the
Uberspace services directory, adjusting the username/paths if needed:

```bash
mkdir -p ~/logs
cp ~/mixer/deploy/mixer.ini ~/etc/services.d/mixer.ini
supervisorctl reread
supervisorctl update
supervisorctl start mixer
supervisorctl status mixer
```

## 7. Web backend routing

Point the sub-path at the app port:

```bash
uberspace web backend set matt-maxx.de/rezepte --http --port 8723
```

TLS (Let's Encrypt) is handled automatically by the Uberspace web frontend —
no Caddy or manual certificate steps are needed.

## 8. Verification

```bash
curl -I https://matt-maxx.de/rezepte
tail -f ~/logs/mixer.log ~/logs/mixer-error.log
```

Confirm in a browser:

- The app loads at `https://matt-maxx.de/rezepte`.
- Login works (cookie is correctly scoped to `/rezepte`).
- A recipe list/detail page that calls `/api/...` loads data (validates the
  `apiUrl()` base-path fetch audit from Phase 1).

## Troubleshooting

- **Port already bound**: `ss -tlpn | grep <port>`, then pick a new port and
  update `deploy/mixer.ini`, `.env.production` (`PORT=`), and the
  `uberspace web backend` command consistently.
- **`better-sqlite3` build errors**: ensure `node -v` reports v22.x *before*
  running `npm ci` (native bindings are built during install).
- **App restarts in a loop**: check `~/logs/mixer-error.log` — often a missing
  or malformed `.env.production`.
- **404s under `/rezepte/api/...`**: indicates a client-side `fetch()` that
  bypasses `apiUrl()` — see Phase 1 of MAINT-003.

## Redeploying after this initial setup

```bash
cd ~/mixer
git pull
npm ci
npm run build
supervisorctl restart mixer
```

(Phase 4 of MAINT-003 automates this step via a GitHub Action.)
