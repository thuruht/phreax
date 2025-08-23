#!/bin/bash

# Phreak Phonebook Setup Script
# This script helps you set up the Cloudflare Workers application

echo "🔥 Phreak Phonebook Setup Script"
echo "================================="
echo

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler is installed"

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 You need to log in to Cloudflare:"
    wrangler login
fi

echo "✅ Logged in to Cloudflare"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create D1 Database
echo "🗄️  Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create phreak-phonebook-db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID from output
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
if [ -n "$DB_ID" ]; then
    echo "📝 Database ID: $DB_ID"
    # Update wrangler.toml with the database ID
    sed -i "s/YOUR_DATABASE_ID/$DB_ID/g" wrangler.toml
    echo "✅ Updated wrangler.toml with database ID"
else
    echo "⚠️  Could not extract database ID. Please update wrangler.toml manually."
fi

# Create KV namespaces
echo "🗂️  Creating KV namespaces..."

# Session store
SESSION_OUTPUT=$(wrangler kv namespace create SESSION_STORE 2>&1)
echo "$SESSION_OUTPUT"
SESSION_ID=$(echo "$SESSION_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
if [ -n "$SESSION_ID" ]; then
    sed -i "s/YOUR_SESSION_KV_ID/$SESSION_ID/g" wrangler.toml
    echo "✅ Updated session store KV ID"
fi

# Password store (although not used in current implementation)
PASSWORD_OUTPUT=$(wrangler kv namespace create PASSWORD_STORE 2>&1)
echo "$PASSWORD_OUTPUT"
PASSWORD_ID=$(echo "$PASSWORD_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
if [ -n "$PASSWORD_ID" ]; then
    sed -i "s/YOUR_PASSWORD_KV_ID/$PASSWORD_ID/g" wrangler.toml
    echo "✅ Updated password store KV ID"
fi

# Create R2 bucket
echo "🪣 Creating R2 bucket..."
wrangler r2 bucket create phreak-phonebook-images

# Initialize database with schema
echo "🏗️  Setting up database schema..."
wrangler d1 execute phreak-phonebook-db --file=schema.sql

# Generate password hash
echo
echo "🔑 Setting up directory password..."
read -s -p "Enter the directory password: " DIRECTORY_PASSWORD
echo

# Create a simple Node.js script to hash the password
cat << 'EOF' > hash_password.js
const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
    console.log('Usage: node hash_password.js <password>');
    process.exit(1);
}

const encoder = new TextEncoder();
const data = encoder.encode(password);
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = Buffer.from(hashArray).toString('base64');
    console.log(hashBase64);
}).catch(err => {
    // Fallback for older Node versions
    const hash = crypto.createHash('sha256').update(password).digest('base64');
    console.log(hash);
});
EOF

# Hash the password
PASSWORD_HASH=$(node hash_password.js "$DIRECTORY_PASSWORD")
rm hash_password.js

# Set secrets
echo "🔒 Setting secrets..."
echo "$PASSWORD_HASH" | wrangler secret put DIRECTORY_PASSWORD_HASH

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET

echo
echo "✅ Setup complete!"
echo
echo "📋 Next steps:"
echo "   1. Review your wrangler.toml file"
echo "   2. Test locally: npm run dev"
echo "   3. Deploy: npm run deploy"
echo
echo "🔑 Directory password: $DIRECTORY_PASSWORD"
echo "   (Save this - you'll need it to log in!)"
echo