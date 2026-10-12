#!/bin/bash
# ==============================================================================
# Examirror Automatic Backup Script (MySQL Database & Uploaded Assets)
# Usage: Run manually or add to crontab:
# 0 2 * * * /var/www/Examirror02/scripts/backup.sh >> /var/log/examirror-backup.log 2>&1
# ==============================================================================

BACKUP_DIR="/var/backups/examirror"
DATE=$(date +"%Y%m%d_%H%M%S")
PROJECT_DIR="/var/www/Examirror02"

mkdir -p "$BACKUP_DIR"

# Source backend/.env if available
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/backend/.env" | xargs)
fi

DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-e2}"
DB_HOST="${DB_HOST:-127.0.0.1}"

echo "[$DATE] Starting Examirror backup..."

# 1. Backup MySQL Database
if command -v mysqldump &> /dev/null; then
    if [ -n "$DB_PASSWORD" ]; then
        mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/db_${DATE}.sql" 2>/dev/null
    else
        mysqldump -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_${DATE}.sql" 2>/dev/null
    fi
    gzip -f "$BACKUP_DIR/db_${DATE}.sql"
    echo "[$DATE] MySQL backup saved: $BACKUP_DIR/db_${DATE}.sql.gz"
fi

# 2. Backup Uploads directory (student photos, marksheet stamps, PDFs)
if [ -d "$PROJECT_DIR/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" -C "$PROJECT_DIR/backend" uploads
    echo "[$DATE] Uploads backup saved: $BACKUP_DIR/uploads_${DATE}.tar.gz"
fi

# 3. Retain only backups from the last 14 days to preserve disk space
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -delete
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[$DATE] Backup completed successfully."
