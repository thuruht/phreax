#!/bin/bash

# Simple script to generate a password hash for Cloudflare

# Get the password from user input
read -sp "Enter the directory password: " PASSWORD
echo

# Generate SHA-256 hash of the password
PASSWORD_HASH=$(echo -n "$PASSWORD" | openssl dgst -sha256 -binary | openssl base64)
echo "Password hash: $PASSWORD_HASH"
echo
echo "Use this hash value in the Cloudflare Dashboard as described in the instructions."
