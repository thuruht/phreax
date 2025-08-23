# Phreaky Phonebook Production Deployment Guide

This guide will help you deploy the refactored Phreaky Phonebook application to Cloudflare Workers.

## Prerequisites

1. Cloudflare account with Workers subscription
2. Wrangler CLI installed (`npm install -g wrangler`)
3. D1 database, KV namespaces, and R2 bucket created

## Configuration

The following secrets must be set in your Cloudflare dashboard or via Wrangler:

```bash
# Set the directory password hash
wrangler secret put DIRECTORY_PASSWORD_HASH

# Set the session secret for enhanced security
wrangler secret put SESSION_SECRET
```

## Deployment Steps

1. Install dependencies:

```bash
npm install
```

2. Initialize your D1 database:

```bash
npm run db:execute
```

3. Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Structure

The application follows a modular architecture:

- `/src` - Main application code
  - `/middleware` - CORS, Auth, and Error handling middleware
  - `/routes` - API route handlers
  - `/types` - TypeScript interfaces
  - `/utils` - Utility functions
  - `/lib` - Database and helper functions
- `/public` - Static assets

## Security Features

- Password-protected directory access
- Personal codes for contact management
- Secure session handling with HTTP-only cookies
- CORS protection
- Input validation and sanitization

## Cloudflare Resources

- D1 Database: Stores contact information
- KV: Manages sessions and settings
- R2: Stores profile images
- Workers: Runs the API and serves static content

## Maintenance

Monitor your application logs:

```bash
npm run logs
```

## Troubleshooting

If you encounter issues:

1. Check Cloudflare Workers logs
2. Verify all secrets are properly set
3. Ensure database migrations ran successfully

---

**Farewell & Friends Phreaky Phonebook** - Keeping the community connected! 📞