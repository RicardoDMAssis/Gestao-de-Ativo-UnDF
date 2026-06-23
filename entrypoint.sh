#!/bin/sh

set -e

echo "==> Aguardando banco de dados..."
python manage.py wait_for_db 2>/dev/null || true

echo "==> Aplicando migrações..."
python manage.py migrate --noinput

echo "==> Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "==> Iniciando servidor..."
exec "$@"
