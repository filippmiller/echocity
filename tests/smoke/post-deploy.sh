#!/usr/bin/env bash
# Post-deploy smoke test. Runs after `prisma migrate deploy` + traffic flip.
#
# Exits non-zero on:
#   - /api/health !=200 or body does not contain "ok":true
#   - /offers !=200 or does not contain expected HTML marker
#   - /api/payments/yokassa/webhook OPTIONS != one of {200, 204, 405}
#
# Called from CI (.github/workflows/ci.yml post-deploy job) and also from
# Coolify's post-deploy hook. Exit codes are used by the deployment system
# to decide whether to roll back.

set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-${BASE_URL:-https://echocity.filippmiller.com}}"
echo "[smoke] Target: $BASE_URL"

failed=0
fail() {
  echo "[smoke] FAIL: $*" >&2
  failed=$((failed + 1))
}

# --- /api/health ---
health_body=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/health" || true)
if [[ "$health_body" != "200" ]]; then
  fail "/api/health returned HTTP $health_body"
else
  body=$(curl -sS "$BASE_URL/api/health")
  if ! grep -q '"ok":true' <<<"$body"; then
    fail "/api/health body missing \"ok\":true — got: $(head -c 200 <<<"$body")"
  else
    echo "[smoke] /api/health OK"
  fi
fi

# --- /offers ---
offers_status=$(curl -sS -o /tmp/smoke-offers.html -w '%{http_code}' "$BASE_URL/offers" || true)
if [[ "$offers_status" != "200" ]]; then
  fail "/offers returned HTTP $offers_status"
else
  # Looks for the app shell title or the H1. Either marker is sufficient.
  if grep -qE 'ГдеСейчас|VseDomaTut|echocity|<main' /tmp/smoke-offers.html; then
    echo "[smoke] /offers OK"
  else
    fail "/offers body missing expected brand/app markers"
  fi
fi

# --- /api/payments/yokassa/webhook OPTIONS ---
wh_status=$(curl -sS -o /dev/null -w '%{http_code}' -X OPTIONS "$BASE_URL/api/payments/yokassa/webhook" || true)
case "$wh_status" in
  200|204|405)
    echo "[smoke] webhook OPTIONS OK (HTTP $wh_status)"
    ;;
  *)
    fail "webhook OPTIONS returned HTTP $wh_status"
    ;;
esac

if [[ "$failed" -gt 0 ]]; then
  echo "[smoke] $failed check(s) failed — deploy should be rolled back." >&2
  exit 1
fi

echo "[smoke] All checks passed."
