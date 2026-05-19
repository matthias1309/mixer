# MAINT-002 Acceptance Test Checklist

These tests must be performed on a Raspberry Pi or staging environment with actual HTTPS access.

## Automated Checks (Local Development) ✅

- [x] Caddyfile syntax valid
- [x] docker-compose.production.yml syntax valid
- [x] NEXTAUTH_URL configured in docker-compose
- [x] Documentation files created
- [x] Application builds without errors

## Manual Tests (Raspberry Pi Deployment)

### 1. HTTPS Accessibility
- [ ] Access `https://raspberrypi.local` in browser
- [ ] Verify SSL certificate (self-signed is expected)
- [ ] App loads without network errors

### 2. HTTP to HTTPS Redirect
- [ ] Access `http://raspberrypi.local` in browser
- [ ] Verify automatic redirect to `https://raspberrypi.local`
- [ ] No mixed content warnings in browser console

### 3. Docker Services
- [ ] Run: `docker-compose -f docker-compose.production.yml ps`
- [ ] Verify all 3 services running: mixer-app, mixer-caddy, mixer-postgres
- [ ] Verify no service restarts in recent logs

### 4. Screen Wake Lock API
- [ ] Log in to the application
- [ ] Navigate to the app (logged in state)
- [ ] Verify "Wake Lock" toggle is visible in navigation
- [ ] Click the toggle and verify screen doesn't sleep (test with screen timeout)
- [ ] Verify browser console shows no HTTPS-related errors

### 5. Database Connectivity
- [ ] Create a test recipe
- [ ] Edit the test recipe
- [ ] Filter recipes by ingredients
- [ ] Delete the test recipe
- [ ] Verify all operations work correctly over HTTPS

### 6. Caddy Logs
- [ ] Run: `docker logs mixer-caddy`
- [ ] Verify no errors or warnings
- [ ] Check certificate generation logs (should appear on first startup)

## Test Environment Notes

- Local domain resolution (.local) requires mDNS (avahi-daemon on RPi)
- Browser certificate warning is expected for self-signed certs
- All tests assume NEXTAUTH_SECRET is properly set in environment

## Sign-off

Date: ___________
Tester: _________ 
Result: [ ] PASS [ ] FAIL
Notes: __________________________________
