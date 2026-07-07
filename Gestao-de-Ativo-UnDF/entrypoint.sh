#!/bin/sh

set -e

echo "==> Aguardando conexão com o banco de dados (Supabase)..."
# wait_for_db tenta conectar ao DATABASE_URL configurado.
# Com o Supabase remoto, a conexão deve estar disponível imediatamente.
# O || true garante que o script não falhe caso o comando não exista.
python manage.py wait_for_db 2>/dev/null || true

echo "==> Aplicando migrações..."
python manage.py migrate --noinput

echo "==> Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "==> Iniciando servidor..."
exec "$@"
