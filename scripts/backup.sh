#!/bin/bash
# ==============================================================================
# Examirror Automatic Backup Script (Database & Uploaded Assets)
# Usage: Run manually or add to crontab:
# 0 2 * * * /var/www/Examirror02/scripts/backup.sh >> /var/log/examirror-backup.log 2>&1
# ==============================================================================

BACKUP_DIR="/var/backups/examirror"
DATE=$(date +"%Y%m%d_%H%M%S")
PROJECT_DIR="/var/www/Examirror02"

mkdir -p "$BACKUP_DIR"

echo "[$DATE] Starting Examirror backup..."

# 1. Backup PostgreSQL database (adjust DB credentials if needed)
if command -v pg_dump &> /dev/null; then
    pg_dump -U postgres examirror > "$BACKUP_DIR/db_$DATE.sql"
    gzip "$BACKUP_DIR/db_$DATE.sql"
    echo "[$DATE] Database backup saved: $BACKUP_DIR/db_$DATE.sql.gz"
fi

# 2. Backup Uploads directory (student photos, marksheet stamps, PDFs)
if [ -d "$PROJECT_DIR/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/backend" uploads
    echo "[$DATE] Uploads backup saved: $BACKUP_DIR/uploads_$DATE.tar.gz"
fi

# 3. Retain only backups from the last 14 days to preserve disk space
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -delete
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[$DATE] Backup completed successfully."
