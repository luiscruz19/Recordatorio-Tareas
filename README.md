# Recordatorio Tareas

App de **recordatorios de tareas del día**: anotás cosas para hacer hoy (sin hora) y te
llegan recordatorios cada cierto tiempo, dentro de una franja horaria, hasta que las marcás
como hechas. Al iniciar el día, una **revisión obligatoria** te hace decidir qué hacer con lo
que quedó pendiente. Incluye **widget** de pantalla de inicio (Android).

Diseño en Claude Design (proyecto *"Recordatorio tareas"*). Doc funcional y de diseño en [`docs/`](docs).

## Arquitectura

Calca el stack de **fichada** (`/opt/repository/fichada`) y **reusa sus servicios core**:

- **`api/`** — monolito de dominio (Node/Express ESM + Sequelize). Tareas, ajustes de
  recordatorio, dispositivos y notificaciones. Valida el JWT localmente con la `SECRET_KEY`
  **compartida con el auth de fichada** → *mismos usuarios que fichada*. Corre un cron
  (`task-reminder`) que manda push de recordatorio dentro de la franja de cada usuario.
- **`app/`** — Expo / React Native. Implementa el diseño (Hoy / Agregar / Ajustes / Revisión)
  + notificaciones locales + widget Android.
- **auth / mailer** — **no viven acá**: se reusan los de fichada (`fichada_auth` /
  `fichada_mailer`) corriendo en la red compartida `net-shared`.

Infra compartida en `/opt/shared` (Traefik + `mysql_db` en `net-shared`). Base del proyecto:
**`RECORDATORIOS`**.

## Levantar local

Requiere `/opt/shared` y **fichada** levantados (sus servicios auth/mailer).

```bash
make up      # crea api/.env, asegura la base RECORDATORIOS y levanta el api en net-shared
make app     # arranca la app (Expo)
```

- API: `http://recordatorios-api.localhost`
- Login: con un usuario de fichada (p.ej. `admin@fichada.com` / `ChangeMe123!`).

> `SECRET_KEY` y `AUTH_BASIC_*` de `api/.env` deben coincidir con los de fichada.

## Deploy

Ver [`DEPLOY.md`](DEPLOY.md). Resumen: `./deploy.sh test` (build+push GHCR → pull/up en el
server) → `https://recordatorios.sda.ovh`. La app se compila con EAS.
