#!/bin/bash

# Setup test database script
set -e

echo "🔧 Setting up test database..."

# Check if TEST_DATABASE_URL is set
if [ -z "$TEST_DATABASE_URL" ]; then
    echo "⚠️  TEST_DATABASE_URL not set, using default test database"
    export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
fi

# Reset the test database
echo "🗑️  Resetting test database..."
npx prisma migrate reset --force --skip-seed

# Run migrations
echo "📦 Running migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding test database..."
npx tsx src/prisma/seed.ts

echo "✅ Test database setup complete!"
echo "📊 Database URL: $TEST_DATABASE_URL"
