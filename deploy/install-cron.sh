#!/usr/bin/env bash
# Schedules the nightly database backup (03:15, server time) for root:
#   bash deploy/install-cron.sh            install or update
#   bash deploy/install-cron.sh --remove   remove
# The output of each run goes to backups/backup.log. Other cron entries are left alone.
set -euo pipefail
cd "$(dirname "$0")/.."
dir=$(pwd)
mark="# tolie-lab nightly backup"
line="15 3 * * * cd $dir && bash deploy/backup.sh >> backups/backup.log 2>&1 $mark"

command -v crontab >/dev/null 2>&1 || { echo "cron isn't installed on this machine (apt install cron)."; exit 1; }
mkdir -p backups
current=$(crontab -l 2>/dev/null | grep -vF "$mark" || true)
if [ "${1:-}" = "--remove" ]; then
  printf '%s\n' "$current" | sed '/^$/d' | crontab -
  echo "Nightly backup removed."
else
  { [ -n "$current" ] && printf '%s\n' "$current"; echo "$line"; } | crontab -
  echo "Nightly backup scheduled for 03:15. Try it once now: bash deploy/backup.sh"
fi
