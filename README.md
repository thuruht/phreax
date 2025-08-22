# Farewell & Friends Phreak Phonebook

A secure, community-driven phonebook application built with Cloudflare Workers, featuring:

- 🔐 Password-protected directory access
- 👥 Community member contact management
- 🖼️ Profile image support with R2 storage
- 🔍 Real-time search functionality
- ✏️ Personal code-based contact editing
- 📱 Mobile-responsive retro terminal design

## Features

### Security & Privacy
- Directory password protection
- Personal codes for individual contact management
- Secure session management with HTTP-only cookies
- Input validation and sanitization
- No contact data exposed without authentication

### Contact Management
- Add contacts with multiple communication methods (Phone, Discord, Instagram, Telegram, Signal)
- Upload profile images or use image URLs
- Edit your own contacts using personal codes
- Delete contacts with verification
- Real-time search across all contact fields

### Technical Stack
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for images
- **Session Management**: Cloudflare KV
- **Static Assets**: Cloudflare Workers Static Assets (modern approach)
- **Frontend**: Vanilla HTML/CSS/JavaScript with retro terminal aesthetic

## Setup Instructions

### Prerequisites
- Node.js (v16 or later)
- Cloudflare account
- Wrangler CLI installed globally

### Quick Setup

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Run the setup script**:
   ```bash
   cd phreak-phonebook
   ./setup.sh
   ```

   The setup script will:
   - Install dependencies
   - Create D1 database and KV namespaces
   - Create R2 bucket for images
   - Set up database schema
   - Generate password hash and secrets
   - Update configuration files

### Manual Setup

If you prefer manual setup:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create Cloudflare resources**:
   ```bash
   # Create D1 database
   wrangler d1 create phreak-phonebook-db
   
   # Create KV namespaces
   wrangler kv namespace create SESSION_STORE
   wrangler kv namespace create PASSWORD_STORE
   
   # Create R2 bucket
   wrangler r2 bucket create phreak-phonebook-images
   ```

3. **Update `wrangler.toml`** with the resource IDs returned by the above commands.

4. **Initialize database**:
   ```bash
   wrangler d1 execute phreak-phonebook-db --file=schema.sql
   ```

5. **Set secrets**:
   ```bash
   # Generate and set directory password hash
   wrangler secret put DIRECTORY_PASSWORD_HASH
   
   # Generate and set session secret
   wrangler secret put SESSION_SECRET
   ```

## Development

### Local Development
```bash
npm run dev
```
Access the application at `http://localhost:8787`

### Database Management
```bash
# Execute SQL commands
wrangler d1 execute phreak-phonebook-db --local --command="SELECT * FROM contacts"

# Apply schema changes
wrangler d1 execute phreak-phonebook-db --file=schema.sql
```

## Deployment

```bash
npm run deploy
```

## Configuration

### Environment Variables (Secrets)
- `DIRECTORY_PASSWORD_HASH`: SHA-256 hash of the directory access password
- `SESSION_SECRET`: Random secret for session management

### Wrangler Configuration
The `wrangler.toml` file contains:
- `main`: Entry point to the Worker script
- D1 database binding
- KV namespace bindings for sessions
- R2 bucket binding for image storage
- Static assets configuration with the modern `[assets]` approach
- Compatibility settings

## Usage

### For Directory Administrators
1. Access the phonebook with the directory password
2. View all community contacts
3. Search and filter contacts
4. Manage the directory

### For Community Members
1. Ask an administrator for directory access
2. Add your contact information
3. Set a personal code for future edits
4. Update your information anytime using your personal code

### Personal Codes
- Set when adding a contact (defaults to "please" if left blank)
- Required for editing or deleting your contact
- Keep it secure - it's your key to managing your information

## Security Features

- **Password Hashing**: Uses SHA-256 for password storage
- **Session Management**: Secure HTTP-only cookies with expiration
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Configured for Worker domains
- **Personal Verification**: Contact modifications require personal codes

## File Structure

```
phreak-phonebook/
├── src/
│   ├── index.ts          # Main Worker application
│   └── auth.ts           # Authentication utilities
├── public/
│   ├── index.html        # Frontend HTML
│   ├── style.css         # Retro terminal styling
│   └── script.js         # Frontend JavaScript
├── schema.sql            # Database schema
├── package.json          # Dependencies and scripts
├── wrangler.toml         # Cloudflare configuration
├── tsconfig.json         # TypeScript configuration
├── setup.sh             # Automated setup script
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Directory login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check authentication status

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Add new contact
- `PUT /api/contacts/:id` - Update contact (requires personal code)
- `DELETE /api/contacts/:id` - Delete contact (requires personal code)
- `GET /api/contacts/search/:query` - Search contacts

### Images
- `POST /api/images/upload` - Upload profile image
- `GET /api/images/:key` - Retrieve uploaded image

## Troubleshooting

### Common Issues

1. **Authentication failures**: Check that secrets are set correctly
2. **Database errors**: Ensure schema is applied and D1 binding is correct
3. **Image upload issues**: Verify R2 bucket exists and binding is configured
4. **Local development**: Use `--local` flag with D1 commands for local testing

### Error Messages
The application provides helpful error messages for:
- Invalid personal codes
- Missing required fields
- Authentication failures
- Server errors

## Contributing

This is a community project. Contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Use it, modify it, share it with your community!

---

**Farewell & Friends Phreak Phonebook** - Keeping the community connected! 📞