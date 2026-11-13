#!/usr/bin/env bash
# Update and (re)start the lab:  bash /opt/tolie-lab/deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "No .env yet. Run: bash deploy/setup.sh"; exit 1; }
git pull --ff-only
docker compose up -d --build
docker compose ps
