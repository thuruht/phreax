#!/bin/bash

# Cloudflare setup helper script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Phreak Phonebook Cloudflare Setup  ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check if wrangler is installed
if ! command -v npx wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler is not installed properly.${NC}"
    echo "   Installing latest version..."
    npm install --save-dev wrangler@latest
else
    WRANGLER_VERSION=$(npx wrangler --version)
    echo -e "${GREEN}✅ Wrangler is installed: $WRANGLER_VERSION${NC}"
fi

# Authentication
echo
echo -e "${BLUE}=== Cloudflare Authentication ===${NC}"
echo "You need to authenticate with Cloudflare to deploy your application."
echo "Visit https://dash.cloudflare.com/profile/api-tokens to create a token with:"
echo "- Account Workers (Edit) permissions"
echo "- Zone Workers Routes (Edit) permissions"
echo
echo "Choose your authentication method:"
echo "1. API Token (recommended)"
echo "2. Interactive login (browser-based)"
read -p "Select option (1/2): " AUTH_OPTION

if [ "$AUTH_OPTION" = "1" ]; then
    read -sp "Enter your Cloudflare API token: " API_TOKEN
    echo
    
    # Create .dev.vars file for local development
    echo "CLOUDFLARE_API_TOKEN=$API_TOKEN" > .dev.vars
    
    # Export for current session
    export CLOUDFLARE_API_TOKEN="$API_TOKEN"
    
    echo -e "${GREEN}✅ API Token set in environment and saved to .dev.vars${NC}"
    echo "   (You should add .dev.vars to your .gitignore)"
elif [ "$AUTH_OPTION" = "2" ]; then
    echo "Logging in to Cloudflare..."
    npx wrangler login
else
    echo -e "${RED}❌ Invalid option selected.${NC}"
    exit 1
fi

# Verify authentication
echo
echo -e "${BLUE}=== Verifying Authentication ===${NC}"
if npx wrangler whoami &> /dev/null; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Please check your API token has sufficient permissions:"
    echo "- Account Workers (Edit)"
    echo "- Zone Workers Routes (Edit)"
    exit 1
fi

# Ask about setting directory password
echo
echo -e "${BLUE}=== Directory Password ===${NC}"
read -p "Do you want to set the directory password now? (y/n): " SET_PASSWORD

if [[ "$SET_PASSWORD" == "y" || "$SET_PASSWORD" == "Y" ]]; then
    # Get the password from user input
    read -sp "Enter the directory password: " PASSWORD
    echo

    # Generate SHA-256 hash of the password
    PASSWORD_HASH=$(echo -n "$PASSWORD" | openssl dgst -sha256 -binary | openssl base64)
    echo "Password hash generated"

    # Set the password hash as a secret in Cloudflare Workers
    echo "Setting the password hash as a secret in Cloudflare Workers..."
    echo "$PASSWORD_HASH" | npx wrangler secret put DIRECTORY_PASSWORD_HASH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Directory password has been set successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to set directory password${NC}"
        echo "   You can try again later with: npx wrangler secret put DIRECTORY_PASSWORD_HASH"
    fi
fi

# Create SESSION_SECRET if needed
echo
echo -e "${BLUE}=== Session Secret ===${NC}"
read -p "Do you want to set a secure SESSION_SECRET now? (y/n): " SET_SECRET

if [[ "$SET_SECRET" == "y" || "$SET_SECRET" == "Y" ]]; then
    # Generate a random secret
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Set the session secret in Cloudflare Workers
    echo "Setting SESSION_SECRET in Cloudflare Workers..."
    echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Session secret has been set successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to set session secret${NC}"
        echo "   You can try again later with: npx wrangler secret put SESSION_SECRET"
    fi
fi

# Ask about deploying
echo
echo -e "${BLUE}=== Deployment ===${NC}"
read -p "Do you want to deploy the application now? (y/n): " DEPLOY

if [[ "$DEPLOY" == "y" || "$DEPLOY" == "Y" ]]; then
    echo "Deploying to Cloudflare Workers..."
    npx wrangler deploy
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        echo "   Check the error message above for details."
    fi
fi

echo
echo -e "${GREEN}Setup complete!${NC}"
echo
echo -e "${BLUE}=== Next Steps ===${NC}"
echo "1. Run 'npx wrangler dev' to test your application locally"
echo "2. Visit your Workers URL to see your deployed application"
echo "3. Set up your custom domain in the Cloudflare dashboard if needed"
