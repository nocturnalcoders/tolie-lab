#!/usr/bin/env bash
# Saves the database to ./backups (keeps the latest 14). Copy the file off the droplet as well.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
stamp=$(date +%Y%m%d-%H%M)
docker compose exec -T db pg_dump -U lab lab | gzip > "backups/lab-$stamp.sql.gz"
ls -1t backups/lab-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
echo "Saved backups/lab-$stamp.sql.gz"
