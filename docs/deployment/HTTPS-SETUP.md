# HTTPS Setup für Raspberry Pi

> **⚠️ DEPRECATED (MAINT-003):** Production läuft jetzt auf Uberspace; TLS
> wird dort automatisch vom Uberspace-Webfrontend bereitgestellt (kein Caddy
> nötig). Siehe `docs/deployment/uberspace-setup.md`. Dieses Dokument bleibt
> nur als Referenz erhalten.

## Automatische HTTPS mit Caddy

Die App läuft hinter Caddy als Reverse Proxy mit automatischem HTTPS für lokale Domains.

### Voraussetzungen

- Raspberry Pi mit Docker & Docker Compose installiert
- `.local` Domains müssen im lokalen Netzwerk auflösen (mDNS - meist automatisch)

### Erste Einrichtung

1. **Caddyfile konfigurieren** (bereits im Repo)
   - Caddy erstellt automatisch ein selbstsigniertes Zertifikat beim ersten Start

2. **Docker Compose starten:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Im Browser zugreifen:**
   - `https://raspberrypi.local` (HTTPS)
   - HTTP-Zugriffe werden automatisch umgeleitet

### Lokale CA akzeptieren (Browser)

Beim ersten Zugriff zeigt der Browser eine Warnung (selbstsigniertes Zertifikat):

**Firefox:**
- "Erweitert" → "Fehler akzeptieren" → Fortfahren ✓

**Chrome/Chromium:**
- "Nicht sicher" → "Zertifikat ansehen" → ggf. "Lokal installieren" (RPi)

**Safari (macOS):**
- Zertifikat zur Schlüsselbund hinzufügen: `Keychain Access` → Add Certificate

### Screen Wake Lock API

Nachdem HTTPS läuft:
1. Einloggen
2. Navigations-Toggle "Wake Lock" sollte sichtbar sein
3. Testen durch Klick → Screen sollte nicht schlafen gehen

### Caddy Logs ansehen

```bash
docker logs mixer-caddy
```

### Konfiguration anpassen

Hostname ändern in `Caddyfile`:
```
mixer.local {           # statt raspberrypi.local
  reverse_proxy mixer-app:3001
}
```

Dann `docker-compose restart mixer-caddy`
