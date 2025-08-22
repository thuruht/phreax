#!/bin/bash

# Script to generate password hash and set it as a secret

# Check if we need to authenticate with Cloudflare
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "No Cloudflare API token found in environment variables."
    echo "You can either:"
    echo "1. Run 'npx wrangler login' to authenticate interactively, or"
    echo "2. Set the CLOUDFLARE_API_TOKEN environment variable"
    
    read -p "Do you want to log in interactively? (y/n): " CHOICE
    if [[ "$CHOICE" == "y" || "$CHOICE" == "Y" ]]; then
        npx wrangler login
    else
        read -sp "Enter your Cloudflare API token: " API_TOKEN
        echo
        export CLOUDFLARE_API_TOKEN="$API_TOKEN"
    fi
fi

# Get the password from user input
read -sp "Enter the directory password: " PASSWORD
echo

# Generate SHA-256 hash of the password
PASSWORD_HASH=$(echo -n "$PASSWORD" | openssl dgst -sha256 -binary | openssl base64)
echo "Password hash generated: $PASSWORD_HASH"

# Set the password hash as a secret in Cloudflare Workers
echo "Setting the password hash as a secret in Cloudflare Workers..."
echo "$PASSWORD_HASH" | npx wrangler secret put DIRECTORY_PASSWORD_HASH

echo "✅ Directory password has been set successfully!"
