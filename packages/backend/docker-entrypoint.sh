#!/bin/sh
set -e

read_secret_or_env() {
  var_name="$1"
  file_var_name="${var_name}_FILE"

  eval "secret_file=\${$file_var_name:-}"
  eval "secret_value=\${$var_name:-}"

  if [ -n "$secret_file" ] && [ -f "$secret_file" ]; then
    secret_value="$(tr -d '\r\n' < "$secret_file")"
  fi

  if [ -z "$secret_value" ]; then
    echo "Missing required secret: $var_name (or $file_var_name)" >&2
    exit 1
  fi

  printf "%s" "$secret_value"
}

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-bmad_todo}"
DB_USER="$(read_secret_or_env POSTGRES_USER)"
DB_PASSWORD="$(read_secret_or_env POSTGRES_PASSWORD)"
DB_USER_ENCODED="$(node -p "encodeURIComponent(process.argv[1])" "$DB_USER")"
DB_PASSWORD_ENCODED="$(node -p "encodeURIComponent(process.argv[1])" "$DB_PASSWORD")"

export DATABASE_URL="postgresql://${DB_USER_ENCODED}:${DB_PASSWORD_ENCODED}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

cd /app/packages/backend
npx drizzle-kit migrate

exec node /app/packages/backend/dist/server.js
