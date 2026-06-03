#!/bin/bash
# Script de push automático — usa /tmp (Linux) para evitar lock files del Mac
# Uso: bash .cowork-push.sh "mensaje del commit"

set -e

TOKEN="${GH_TOKEN}"
REPO_URL="https://consultor-debug:${TOKEN}@github.com/consultor-debug/sistema-comercial.git"
TMP_DIR="/tmp/sc-git-push"
SRC_DIR="/sessions/admiring-funny-tesla/mnt/Sistema Comercial/sistema-comercial"
MSG="${1:-chore: update via cowork}"

# Si ya existe el clon, solo hacer pull; si no, clonar fresco
if [ -d "$TMP_DIR/.git" ]; then
    echo "→ Actualizando clon existente..."
    cd "$TMP_DIR"
    git pull --rebase origin main 2>&1 | tail -3
else
    echo "→ Clonando repo fresco en /tmp..."
    rm -rf "$TMP_DIR"
    git clone --depth=1 "$REPO_URL" "$TMP_DIR" 2>&1 | tail -3
fi

# Sincronizar archivos fuente
echo "→ Sincronizando archivos..."
rsync -a --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env*' \
    --exclude='.cowork-push.sh' \
    "$SRC_DIR/" "$TMP_DIR/"

cd "$TMP_DIR"
git config user.email "cowork@sistema-comercial.dev"
git config user.name "Cowork Bot"

# Verificar si hay cambios
if git diff --quiet && git diff --staged --quiet; then
    echo "✓ Sin cambios que commitear."
    exit 0
fi

git add -A
git commit -m "$MSG"
git push origin main
echo "✓ Push exitoso: $(git log -1 --format='%h %s')"
