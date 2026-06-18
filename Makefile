.PHONY: help env dbs up down logs ps restart build clean app-install app

SHARED_ENV := /opt/shared/.env
DB_PW := $(shell grep -E '^DB_MYSQL_ROOT_PASSWORD' $(SHARED_ENV) 2>/dev/null | cut -d= -f2- | tr -d "'\"")

help:
	@echo "Recordatorio Tareas — usa la infra compartida de /opt/shared (Traefik + mysql_db en net-shared)."
	@echo "Reusa los servicios auth/mailer de fichada → fichada debe estar levantado (mismos usuarios)."
	@echo ""
	@echo "  make up          .env + base + levanta el api en net-shared"
	@echo "  make dbs         Crea/asegura la base RECORDATORIOS"
	@echo "  make down        Baja el api (no toca la infra compartida ni fichada)"
	@echo "  make logs|ps     Logs / estado"
	@echo "  make app-install Instala dependencias de la app (Expo)"
	@echo "  make app         Arranca la app (Expo / Metro)"
	@echo ""
	@echo "Acceso: api http://recordatorios-api.localhost"
	@echo "Login: con un usuario de fichada (p.ej. admin@fichada.com / ChangeMe123!)."
	@echo "Requiere /opt/shared y fichada levantados."

# Crea el .env del api desde el .env.example e inyecta el password del MySQL compartido.
# Nota: SECRET_KEY y AUTH_BASIC_* deben coincidir con los de fichada (revisar a mano).
env:
	@if [ ! -f api/.env ]; then cp api/.env.example api/.env && echo "creado api/.env"; fi
	@if [ -z "$(DB_PW)" ]; then echo "⚠ No pude leer DB_MYSQL_ROOT_PASSWORD de $(SHARED_ENV)"; else \
	  sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$(DB_PW)|" api/.env; \
	  echo "✓ password del MySQL compartido inyectado en api/.env"; fi

# Crea la base del proyecto en el MySQL compartido (idempotente).
dbs:
	@docker exec mysql_db sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "\
	  CREATE DATABASE IF NOT EXISTS RECORDATORIOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"' \
	  && echo "✓ base RECORDATORIOS asegurada"

up: env dbs
	docker compose up -d --build

down:
	docker compose down

clean: down

logs:
	docker compose logs -f

ps:
	docker compose ps

restart:
	docker compose restart

build:
	docker compose build

# --- App mobile (Expo) — corre local, no en Docker (necesita Metro + device/emulador) ---
app-install:
	cd app && npm install

app:
	cd app && npx expo start
