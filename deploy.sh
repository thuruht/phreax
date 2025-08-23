#!/bin/bash

# Production deployment script for Phreaky Phonebook

echo "📞 Preparing to deploy Phreaky Phonebook..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Verify wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing globally..."
    npm install -g wrangler
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
npm run deploy

# Deploy the database schema if needed
read -p "Do you want to apply the database schema? (y/n) " apply_schema
if [[ $apply_schema == "y" ]]; then
    echo "📊 Applying database schema..."
    npm run db:execute
fi

echo "✅ Deployment complete! Your Phreaky Phonebook is now live."
echo "   Check the logs with: npm run logs"