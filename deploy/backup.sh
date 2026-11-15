#!/usr/bin/env bash
# Saves the database to ./backups (keeps the latest 14). Run nightly by deploy/install-cron.sh.
# With BACKUP_RCLONE_REMOTE set in .env (and rclone installed), the file is also copied off the droplet.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
stamp=$(date +%Y%m%d-%H%M)
file="backups/lab-$stamp.sql.gz"
docker compose exec -T db pg_dump -U lab lab | gzip > "$file.part"
# An empty or cut-off dump must not replace a good backup or push an older one out.
gzip -t "$file.part" && [ "$(gzip -dc "$file.part" | head -c 200 | wc -c)" -gt 0 ] || { rm -f "$file.part"; echo "Backup failed: the dump is empty or damaged." >&2; exit 1; }
mv "$file.part" "$file"
ls -1t backups/lab-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
echo "Saved $file"

remote=$(grep -E '^BACKUP_RCLONE_REMOTE=' .env 2>/dev/null | cut -d= -f2- || true)
if [ -n "$remote" ]; then
  command -v rclone >/dev/null 2>&1 || { echo "BACKUP_RCLONE_REMOTE is set but rclone is not installed." >&2; exit 1; }
  rclone copy "$file" "$remote"
  echo "Copied to $remote"
fi
