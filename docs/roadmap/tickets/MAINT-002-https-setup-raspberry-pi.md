# MAINT-002: HTTPS auf Raspberry Pi einrichten

**Status:** Open  
**Priority:** Medium  
**Effort:** 3 pts  
**Created:** 2026-05-17  

---

## Summary

Die Anwendung läuft auf dem Raspberry Pi über HTTP (`http://raspberrypi.local:3001`). Bestimmte Browser-APIs — insbesondere die **Screen Wake Lock API** — sind aus Sicherheitsgründen nur in sicheren Kontexten (HTTPS oder `localhost`) verfügbar. Ohne HTTPS bleibt der Wake Lock Toggle dauerhaft deaktiviert.

---

## Problem

Die [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) erfordert einen **Secure Context**:

- ✅ `https://` — erlaubt
- ✅ `http://localhost` — erlaubt
- ❌ `http://raspberrypi.local:3001` — **blockiert**

`navigator.wakeLock` ist `undefined` → der Toggle erscheint nicht in der Navigation (weil `isSupported === false`).

---

## Lösung

**Caddy als Reverse Proxy** mit automatischem HTTPS für das lokale Netzwerk.

Caddy ist die einfachste Option:
- Automatische Zertifikatsverwaltung
- Minimale Konfiguration
- Läuft als Docker Container neben der App

### Alternativen (nicht empfohlen)

| Option | Aufwand | Nachteil |
|--------|---------|----------|
| Nginx + selbstsigniertes Zertifikat | Mittel | Browser-Warnung bei jedem Aufruf |
| Let's Encrypt via Certbot | Hoch | Benötigt öffentliche Domain |
| Caddy (empfohlen) | Gering | Benötigt lokale CA im Browser |

---

## Acceptance Criteria

- [ ] App ist über HTTPS erreichbar (z.B. `https://raspberrypi.local` oder `https://mixer.local`)
- [ ] HTTP-Aufrufe werden automatisch auf HTTPS weitergeleitet
- [ ] Screen Wake Lock Toggle erscheint in der Navigation nach dem Login
- [ ] Kein Breaking Change an der bestehenden Docker-Konfiguration
- [ ] Deployment-Skript wird bei Bedarf angepasst

---

## Implementation Notes

### Caddy in docker-compose.production.yml ergänzen

```yaml
mixer-caddy:
  image: caddy:2-alpine
  container_name: mixer-caddy
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
  depends_on:
    - mixer-app
  restart: unless-stopped
```

### Beispiel Caddyfile

```
raspberrypi.local {
  reverse_proxy mixer-app:3001
}
```

### Port-Anpassung

Der aktuelle Port `3001` wird nur noch intern genutzt. Nach außen läuft alles über Caddy auf Port `80`/`443`.

---

## Referenzen

- [Caddy Dokumentation](https://caddyserver.com/docs/)
- [Screen Wake Lock API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- Verwandtes Feature: Screen Wake Lock Toggle (implementiert in `src/hooks/useWakeLock.ts`)
