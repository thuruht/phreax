#!/bin/bash

# Simple Cloudflare authentication test script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Cloudflare Authentication Test${NC}"
echo -e "${BLUE}=============================${NC}"
echo

# Check if API token is already set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    # Try to get it from .dev.vars if it exists
    if [ -f ".dev.vars" ]; then
        source .dev.vars
        echo "Loaded API token from .dev.vars"
    else
        # Ask for token
        read -sp "Enter your Cloudflare API token: " API_TOKEN
        echo
        export CLOUDFLARE_API_TOKEN="$API_TOKEN"
    fi
fi

# Test authentication
echo "Testing authentication with Cloudflare..."
npx wrangler whoami

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Authentication successful!${NC}"
    
    # Direct deployment with inline secrets
    echo
    echo -e "${BLUE}=== Direct Deployment With Secrets ===${NC}"
    echo "This will deploy directly to production with inline secrets."
    
    # Get directory password
    read -sp "Enter the directory password: " PASSWORD
    echo
    
    # Generate SHA-256 hash of the password
    PASSWORD_HASH=$(echo -n "$PASSWORD" | openssl dgst -sha256 -binary | openssl base64)
    echo "Password hash generated"
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 32)
    echo "Session secret generated"
    
    # Deploy with inline variables
    echo "Deploying to Cloudflare Workers..."
    npx wrangler deploy --var DIRECTORY_PASSWORD_HASH:"$PASSWORD_HASH" --var SESSION_SECRET:"$SESSION_SECRET"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo "Your application is now live with the secrets embedded."
    else
        echo -e "${RED}❌ Deployment failed${NC}"
    fi
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo
    echo "Common authentication issues:"
    echo "1. The API token might be incorrect or expired"
    echo "2. The API token might not have the right permissions"
    echo "3. There might be network connectivity issues to Cloudflare"
    echo "4. Your account may have 2FA or other security requirements"
    echo
    echo "Try generating a new token with these permissions:"
    echo "- Account Workers (Edit)"
    echo "- Zone Workers Routes (Edit)"
    echo "- Workers KV Storage (Edit)"
    echo "- Workers R2 Storage (Edit)"
fi
echo "Test complete"
