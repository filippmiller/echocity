#!/bin/sh
set -eu

mode="${1:-run}"
log_file="/tmp/echocity-prisma-migrate.log"

run_migrate() {
  rm -f "$log_file"
  if npx prisma migrate deploy >"$log_file" 2>&1; then
    cat "$log_file"
    return 0
  fi

  cat "$log_file"
  return 1
}

if ! run_migrate; then
  if grep -q "Error: P3009" "$log_file" && grep -q 'The `0_init` migration' "$log_file"; then
    echo "Resolving production baseline migration 0_init as applied."
    npx prisma migrate resolve --applied 0_init
    run_migrate
  fi
fi

if [ ! -s "$log_file" ] || ! grep -q "All migrations have been successfully applied" "$log_file"; then
  echo "Prisma migration step did not complete successfully."
  if [ "$mode" = "diagnose" ]; then
    echo "Diagnostic mode: keeping container alive for log inspection."
    sleep 1800
  fi
  exit 1
fi

exec npm start
