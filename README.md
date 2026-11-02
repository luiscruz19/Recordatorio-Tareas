# Recordatorio Tareas

App móvil para anotar las tareas de hoy, sin hora, y recibir avisos hasta marcarlas como hechas.

**Estado:** no está en tiendas. Se compila con EAS y se instala como APK en Android.

## Qué hace

- **Hoy:** tareas pendientes y hechas del día, con opción de posponer al día siguiente o anotar para otro día.
- **Revisión de inicio del día:** las pendientes de días anteriores hay que pasarlas a hoy, marcarlas o borrarlas antes de seguir.
- **Dos recordatorios por usuario**, cada uno con su franja e intervalo. Valores por defecto:
  - planificación: de 09:00 a 12:00, cada 30 min sin tareas cargadas para hoy y cada 90 min con tareas;
  - cierre: de 18:00 a 20:00, cada 60 min mientras queden pendientes.
- **Avisos** por push del servidor y por notificaciones locales de la app.
- **Widget de Android** con las pendientes de hoy y un botón para agregar.
- **Ingreso** con email y contraseña la primera vez; después, con PIN de 4 dígitos o biometría.

## Estructura

- `api/`: Node, Express 4, Sequelize 6 y MySQL. Rutas `/auth`, `/tasks`, `/settings`, `/devices`, `/notifications` y `/health`. Un cron cada 15 minutos (`TASK_REMINDER_CRON`) evalúa los recordatorios y envía los push con Expo.
- `app/`: Expo SDK 54 y React Native 0.81.

## Dependencia de Fichada

La autenticación es la de Fichada, un proyecto aparte que no está en este repositorio: la API reenvía el login y el PIN a `fichada_api` (`FICHADA_API_URL`) y valida los JWT con la misma `SECRET_KEY`. No hay usuarios propios y sin Fichada no se puede iniciar sesión.

## Levantar en local

Requiere Docker y, en la red `net-shared`, Traefik, el contenedor `mysql_db` y `fichada_api`. El Makefile toma la contraseña de MySQL de `/opt/shared/.env`.

```bash
make up           # crea api/.env y la base RECORDATORIOS, y levanta la API
make app-install  # instala las dependencias de la app
make app          # arranca Expo
```

La `SECRET_KEY` de `api/.env` tiene que coincidir con la de Fichada. La API responde en `http://recordatorios-api.localhost` por Traefik y en `http://localhost:4010` sin Traefik; `GET /health` sirve para comprobarlo.

La app usa `EXPO_PUBLIC_API_URL`; sin esa variable apunta a Traefik desde el emulador de Android. El widget y los push no funcionan en Expo Go: hace falta un build de desarrollo.

```bash
cd app && npx eas-cli build -p android --profile development
```

## Despliegue

Ver [`DEPLOY.md`](DEPLOY.md).

## Firebase

`app/google-services.json` no se versiona. Para compilar la app, copialo en `app/`. En EAS, cargalo como variable de tipo archivo:

```bash
cd app
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
```
