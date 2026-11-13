#!/usr/bin/env bash
# First-time setup: creates .env (database password and secret key).
#   bash deploy/setup.sh
# Email sending is optional; see README.md ("Email verifikasi").
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null 2>&1 || { echo "Docker isn't installed on this machine."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose (the 'docker compose' command) isn't available."; exit 1; }

if [ -f .env ]; then
  echo ".env already exists, so nothing was changed."
  exit 0
fi

rand() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

umask 077
{
  echo "POSTGRES_PASSWORD=$(rand)"
  echo "LAB_SECRET_KEY=$(rand)"
  echo "LAB_SITE_URL=https://lab.tolie.space"
  echo "LAB_EMAIL_VERIFICATION=0"
} > .env

echo "Done. .env is ready. Next: docker compose up -d --build"
