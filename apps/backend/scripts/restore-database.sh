#!/bin/bash

# Database restore script for Oda Fashion Platform
# Usage: ./restore-database.sh <backup_file>

set -e

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a backup file"
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la backups/*.sql* 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database connection details from DATABASE_URL
DB_URL=${DATABASE_URL}
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "🔄 Starting database restore..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Detected compressed backup file"
    RESTORE_COMMAND="gunzip -c '$BACKUP_FILE' | PGPASSWORD='$DB_PASS' psql -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME'"
else
    RESTORE_COMMAND="PGPASSWORD='$DB_PASS' psql -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME' -f '$BACKUP_FILE'"
fi

# Confirm restore operation
echo ""
echo "⚠️  WARNING: This will replace all data in the database '$DB_NAME'"
echo "Are you sure you want to continue? (yes/no)"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Create a backup before restore
echo "📦 Creating pre-restore backup..."
PRE_RESTORE_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups
PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$PRE_RESTORE_BACKUP" \
    --clean \
    --if-exists \
    --create \
    --no-owner \
    --no-privileges

echo "✅ Pre-restore backup created: $PRE_RESTORE_BACKUP"

# Perform restore
echo "🔄 Restoring database..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --quiet
else
    PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$BACKUP_FILE" \
        --quiet
fi

echo "✅ Database restore completed successfully!"

# Verify restore
echo "🔍 Verifying restore..."
TABLE_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

echo "📊 Verification results:"
echo "   Tables: $TABLE_COUNT"

# Run Prisma generate to ensure client is up to date
if command -v npx &> /dev/null; then
    echo "🔧 Regenerating Prisma client..."
    npx prisma generate --schema=prisma/schema.prisma
    echo "✅ Prisma client regenerated"
fi

echo "🎉 Database restore process completed!"
echo ""
echo "📋 Summary:"
echo "   Restored from: $BACKUP_FILE"
echo "   Pre-restore backup: $PRE_RESTORE_BACKUP"
echo "   Tables restored: $TABLE_COUNT"