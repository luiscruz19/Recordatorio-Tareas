# Deploy — Recordatorio Tareas (test)

Dos partes independientes: el **backend** (1 imagen Docker en un server) y la **app**
(APK/AAB que se compila y distribuye).

---

## 1) Backend

### Idea
El servidor **no compila nada**: baja la **imagen ya construida** (GHCR) y la levanta. La infra
pesada (Traefik, MySQL) es **compartida** (`/opt/shared`, red `net-shared`). Los servicios
**auth/mailer se reusan de fichada** (`/opt/test/fichada`), que debe estar desplegado en el
mismo server / misma `net-shared`.

```
PC ──build──▶ imagen en GHCR ──pull──▶ Server /opt/test/recordatorios
                                       + infra core /opt/shared (net-shared)
                                       + auth/mailer de /opt/test/fichada
                                       Cloudflare → Traefik → https://recordatorios.sda.ovh
```

### Ruteo
- **`/`** (raíz de `recordatorios.sda.ovh`) → api de dominio. La app pega a
  `https://recordatorios.sda.ovh`. Sin backoffice.
- **auth / mailer** → los de fichada, internos (sin Traefik).

### Piezas
- **Imagen** — `ghcr.io/luiscruz19/recordatorios-api:TEST` (desde `api/Dockerfile.production`).
- **`docker-compose.prod.yml`** — el servicio `recordatorios_api` con `build` + `image` + labels Traefik.
- **`deploy.sh`** — login GHCR → `build` + `push` → copia el compose por SSH → `pull` + `up -d`.
- **`.env.deploy.test`** (no versionado) — destino SSH + tag. El PAT de GHCR sale del entorno.
- **`.env`** en el server (`/opt/test/recordatorios/.env`, no versionado) — secretos runtime
  (ver `.env.production.example`). **`SECRET_KEY` y `AUTH_BASIC_*` deben ser los mismos que
  `/opt/test/fichada/.env`** (mismos usuarios + validación de JWT compartida).

### Redeploy (lo normal)
```bash
cd /opt/repository/recordatorio-tareas
./deploy.sh test          # build + push + pull/up en el server (toma GITHUB_REGISTRY_TOKEN del entorno)
```

### Primera vez en el server
1. Infra core arriba: `/opt/shared` (red `net-shared`) y **fichada** desplegado (auth/mailer).
2. Crear la base: `docker exec mysql_db mysql -uroot -p... -e "CREATE DATABASE IF NOT EXISTS \`RECORDATORIOS\`;"`
3. Crear `/opt/test/recordatorios/.env` (desde `.env.production.example`; copiar `SECRET_KEY`/`AUTH_BASIC_*` de fichada).
4. `./deploy.sh test`.

---

## 2) App (Expo / EAS)

### Cómo elige el backend (`app/eas.json`)
- **`preview-test`** → `https://recordatorios.sda.ovh` → APK contra el server (cualquier red).
- **`preview-local`** → `http://<IP_LAN>:4010` → backend local (mismo WiFi + `make up`).
- **`production`** → AAB (`https://recordatorios.sda.ovh`) para Play Store.

El código (`app/src/api.js`) lee `process.env.EXPO_PUBLIC_API_URL` con **precedencia**; si no
está, cae al gateway local de Traefik (header `Host: recordatorios-api.localhost`).

### Pasos
```bash
cd app
npx eas-cli login            # cuenta Expo (owner: luiscruzz.salta)
npx eas-cli init             # crea el proyecto y escribe extra.eas.projectId en app.json
# El widget Android requiere development build (no corre en Expo Go):
npx eas-cli build -p android --profile development     # dev client con widget
npx eas-cli build -p android --profile preview-test    # APK contra el server → link/QR
```

---

## Resumen

| | Backend | App |
|---|---|---|
| Se entrega | 1 imagen Docker en GHCR | APK/AAB |
| Corre en | Server `/opt/test/recordatorios` (Traefik + infra compartida + auth/mailer de fichada) | El celular |
| Se publica con | `./deploy.sh test` | `eas build` (nube) → link/QR |
| URL | api `recordatorios.sda.ovh` | consume el api |
