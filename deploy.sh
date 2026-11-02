#!/bin/bash
set -euo pipefail
# Uso: ./deploy.sh [test]
# Variables en .env.deploy.<entorno>: DEPLOY_USER, DEPLOY_SERVER, DEPLOY_PORT, DEPLOY_PATH, DEPLOY_TAG,
# DEPLOY_SSH_KEY (por defecto ~/.ssh/id_ed25519), GITHUB_REGISTRY_USER y GITHUB_REGISTRY_TOKEN
# (PAT con write:packages).

ENVIRONMENT="${1:-test}"
ENV_FILE=".env.deploy.${ENVIRONMENT}"
[ -f "$ENV_FILE" ] || { echo "✗ No se encontró $ENV_FILE"; exit 1; }

set -a; # shellcheck disable=SC1090
source "$ENV_FILE"; set +a

: "${DEPLOY_USER:?falta DEPLOY_USER}"
: "${DEPLOY_SERVER:?falta DEPLOY_SERVER}"
: "${DEPLOY_PORT:?falta DEPLOY_PORT}"
: "${DEPLOY_PATH:?falta DEPLOY_PATH}"

TAG="${DEPLOY_TAG:-TEST}"; export TAG
REG_USER="${GITHUB_REGISTRY_USER:-luiscruz19}"
REG_TOKEN="${GITHUB_REGISTRY_TOKEN:?falta GITHUB_REGISTRY_TOKEN (PAT con write:packages)}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519}"
# ~ no se expande dentro de variables.
SSH_KEY="${SSH_KEY/#\~/$HOME}"
SSH="ssh -i $SSH_KEY -p $DEPLOY_PORT -o StrictHostKeyChecking=accept-new"
SCP="scp -i $SSH_KEY -P $DEPLOY_PORT -o StrictHostKeyChecking=accept-new"

echo "── RECORDATORIOS deploy ($ENVIRONMENT) · TAG=$TAG → $DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH ──"

echo "→ login GHCR (local)"
echo "$REG_TOKEN" | docker login ghcr.io -u "$REG_USER" --password-stdin
echo "→ build"
docker compose -f docker-compose.prod.yml build
echo "→ push"
docker compose -f docker-compose.prod.yml push

# El bloque build: del compose no tiene efecto en pull/up.
echo "→ copiar docker-compose.prod.yml → $DEPLOY_PATH/docker-compose.yml"
$SSH "$DEPLOY_USER@$DEPLOY_SERVER" "mkdir -p '$DEPLOY_PATH'"
$SCP docker-compose.prod.yml "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH/docker-compose.yml"

# Heredoc sin comillas: TAG y las credenciales se expanden acá, no en el servidor.
echo "→ pull + up en el server"
$SSH "$DEPLOY_USER@$DEPLOY_SERVER" bash -s <<EOF
set -e
echo "$REG_TOKEN" | docker login ghcr.io -u "$REG_USER" --password-stdin >/dev/null
cd "$DEPLOY_PATH"
export TAG="$TAG"
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
if docker compose ps | grep -E "(Exit|unhealthy)" >/dev/null 2>&1; then
  echo "✗ Hay contenedores en estado no saludable"; exit 1
fi
EOF

echo "✓ Deploy completado (TAG=$TAG) → https://recordatorios.sda.ovh"
