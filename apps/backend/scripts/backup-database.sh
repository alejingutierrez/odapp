#!/bin/bash

# Database backup script for Oda Fashion Platform
# Usage: ./backup-database.sh [backup_name]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_NAME=${1:-"manual_$(date +%Y%m%d_%H%M%S)"}
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
METADATA_FILE="${BACKUP_DIR}/${BACKUP_NAME}.json"

# Extract database connection details from DATABASE_URL
DB_URL=${DATABASE_URL}
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "🗄️  Starting database backup..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup using Docker to match PostgreSQL version
echo "📦 Creating backup..."
docker run --rm \
    --network host \
    -e PGPASSWORD="$DB_PASS" \
    -v "$(pwd)/$BACKUP_DIR:/backup" \
    postgres:15-alpine \
    pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "/backup/$(basename $BACKUP_FILE)" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --no-owner \
    --no-privileges

# Get backup file size
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "unknown")

# Create metadata file
cat > "$METADATA_FILE" << EOF
{
  "name": "$BACKUP_NAME",
  "file": "$BACKUP_FILE",
  "database": "$DB_NAME",
  "host": "$DB_HOST:$DB_PORT",
  "size": $BACKUP_SIZE,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "created_by": "$(whoami)",
  "environment": "${NODE_ENV:-development}",
  "version": "${APP_VERSION:-1.0.0}"
}
EOF

echo "✅ Backup completed successfully!"
echo "📁 Backup file: $BACKUP_FILE"
echo "📊 Backup size: $(numfmt --to=iec $BACKUP_SIZE 2>/dev/null || echo "$BACKUP_SIZE bytes")"
echo "📋 Metadata: $METADATA_FILE"

# Optional: Compress backup
if command -v gzip &> /dev/null; then
    echo "🗜️  Compressing backup..."
    gzip "$BACKUP_FILE"
    COMPRESSED_SIZE=$(stat -f%z "${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "${BACKUP_FILE}.gz" 2>/dev/null || echo "unknown")
    echo "✅ Compressed to: ${BACKUP_FILE}.gz"
    echo "📊 Compressed size: $(numfmt --to=iec $COMPRESSED_SIZE 2>/dev/null || echo "$COMPRESSED_SIZE bytes")"
    
    # Update metadata with compressed info
    cat > "$METADATA_FILE" << EOF
{
  "name": "$BACKUP_NAME",
  "file": "${BACKUP_FILE}.gz",
  "original_file": "$BACKUP_FILE",
  "database": "$DB_NAME",
  "host": "$DB_HOST:$DB_PORT",
  "size": $BACKUP_SIZE,
  "compressed_size": $COMPRESSED_SIZE,
  "compression_ratio": $(echo "scale=2; $COMPRESSED_SIZE * 100 / $BACKUP_SIZE" | bc 2>/dev/null || echo "unknown"),
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "created_by": "$(whoami)",
  "environment": "${NODE_ENV:-development}",
  "version": "${APP_VERSION:-1.0.0}"
}
EOF
fi

echo "🎉 Database backup process completed!"