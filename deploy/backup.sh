#!/usr/bin/env bash
# Backup diário do banco e dos arquivos. Agende com: crontab -e
#   30 3 * * * /var/www/portal-petricor/deploy/backup.sh
set -euo pipefail
APP=/var/www/portal-petricor
DEST=/var/backups/portal-petricor
mkdir -p "$DEST"
STAMP=$(date +%F)
sqlite3 "$APP/prisma/portal.db" ".backup '$DEST/portal-$STAMP.db'"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$APP" uploads
# Mantém os últimos 14 dias
find "$DEST" -type f -mtime +14 -delete
