#!/bin/bash

# Development helper script for Phreak Phonebook

show_help() {
    echo "Phreak Phonebook Development Helper"
    echo "Usage: ./dev.sh [command]"
    echo
    echo "Commands:"
    echo "  install    Install dependencies"
    echo "  dev        Start development server"
    echo "  deploy     Deploy to Cloudflare"
    echo "  db-local   Set up local database"
    echo "  db-prod    Set up production database"
    echo "  db-shell   Open database shell"
    echo "  logs       View deployment logs"
    echo "  help       Show this help message"
}

case "$1" in
    "install")
        echo "📦 Installing dependencies..."
        npm install
        ;;
    "dev")
        echo "🚀 Starting development server..."
        wrangler dev
        ;;
    "deploy")
        echo "🌍 Deploying to Cloudflare..."
        npm run deploy
        ;;
    "db-local")
        echo "🗄️  Setting up local database..."
        wrangler d1 execute phreak-phonebook-db --local --file=schema.sql
        echo "✅ Local database ready"
        ;;
    "db-prod")
        echo "🗄️  Setting up production database..."
        wrangler d1 execute phreak-phonebook-db --file=schema.sql
        echo "✅ Production database ready"
        ;;
    "db-shell")
        echo "💻 Opening database shell..."
        wrangler d1 execute phreak-phonebook-db --local --command=".tables"
        echo "Available commands:"
        echo "  .tables  - List all tables"
        echo "  .schema  - Show schema"
        echo "  SELECT * FROM contacts; - List all contacts"
        ;;
    "logs")
        echo "📊 Fetching deployment logs..."
        wrangler tail
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac