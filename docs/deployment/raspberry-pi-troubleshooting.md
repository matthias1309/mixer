# Raspberry Pi Deployment Troubleshooting

> **⚠️ DEPRECATED (MAINT-003):** Production has moved to Uberspace. See
> `docs/deployment/uberspace-setup.md` for the current setup and
> troubleshooting. This guide is kept for reference only.

## See Implementation Plan

Complete troubleshooting documentation is available in:
`docs/superpowers/plans/2026-05-16-raspberry-pi-deployment-implementation.md` → **Task 6**

## Quick Reference Commands

### Check Services Status
```bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps'
```

### View Application Logs
```bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs -f mixer-app'
```

### View Database Logs
```bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-db'
```

### Restart Services
```bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart'
```

### Access Database
```bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-db psql -U mixer_user -d mixer'
```

### Check Docker Stats
```bash
ssh dockerhome 'docker stats mixer-app'
```

## Common Issues

| Issue | Solution |
|-------|----------|
| App won't start | Check logs: `docker compose logs mixer-app` |
| Database connection fails | Verify DB is running: `docker compose logs mixer-db` |
| Port 3001 already in use | Check: `ssh dockerhome 'lsof -i :3001'` |
| SSH connection fails | Test: `ssh dockerhome "exit"` |

## Full Troubleshooting Guide

For detailed troubleshooting steps, see the complete guide in the implementation plan.
