import { Hono } from 'hono';
import { createSession, validateSession, destroySession, hashPassword, verifyPassword } from './auth';

// Types
interface Contact {
    id: string;
    name: string;
    phone?: string;
    discord?: string;
    instagram?: string;
    telegram?: string;
    signal?: string;
    address?: string;
    notes?: string;
    image_url?: string;
    personal_code_hash: string;
    created_at: number;
    updated_at: number;
}

interface Env {
    DB: D1Database;
    PHON_K: KVNamespace;
    PHREAK_KV: KVNamespace;
    phr3img: R2Bucket;
    ASSETS: Fetcher;
    DIRECTORY_PASSWORD_HASH: string;
    SESSION_SECRET: string;
    SESSION_DURATION: string;
    ENVIRONMENT?: string;
}

// App
const app = new Hono<{ Bindings: Env }>();

// Basic CORS headers for API routes
app.use('/api/*', async (c, next) => {
    // Add CORS headers
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');
    
    if (c.req.method === 'OPTIONS') {
        return c.text('', 200);
    }
    
    return next();
});

// Middleware to check authentication
app.use('/api/*', async (c, next) => {
    // Allow login requests without authentication
    if (c.req.path === '/api/auth/login' || c.req.path === '/api/auth/status') {
        return next();
    }
    
    const userId = await validateSession(c);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    return next();
});

// Auth routes
app.post('/api/auth/login', async (c) => {
    try {
        const { password } = await c.req.json();
        
        // Verify password
        const isValid = await verifyPassword(password, c.env.DIRECTORY_PASSWORD_HASH);
        if (!isValid) {
            return c.json({ error: 'Invalid password' }, 401);
        }
        
        // Create session
        await createSession(c, 'admin');
        
        return c.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.post('/api/auth/logout', async (c) => {
    await destroySession(c);
    return c.json({ success: true });
});

app.get('/api/auth/status', async (c) => {
    const userId = await validateSession(c);
    return c.json({ authenticated: !!userId });
});

// Contacts routes
app.get('/api/contacts', async (c) => {
    try {
        // Check authentication first
        const userId = await validateSession(c);
        if (!userId) {
            return c.json({ error: 'Authentication required' }, 401);
        }
        
        const { results } = await c.env.DB.prepare(`
            SELECT id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, created_at, updated_at
            FROM contacts
            ORDER BY name COLLATE NOCASE
        `).all();
        
        return c.json(results);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return c.json({ error: 'Failed to fetch contacts' }, 500);
    }
});

app.post('/api/contacts', async (c) => {
    try {
        // Check authentication first
        const userId = await validateSession(c);
        if (!userId) {
            return c.json({ error: 'Authentication required' }, 401);
        }
        
        const contactData = await c.req.json();
        const { personal_code, ...contact } = contactData;
        
        // Validate required fields
        if (!contact.name || !contact.name.trim()) {
            return c.json({ error: 'Name is required' }, 400);
        }
        
        // Hash personal code
        const personalCodeHash = await hashPassword(personal_code || 'please');
        
        // Generate ID and timestamps
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        
        // Insert contact
        const { success } = await c.env.DB.prepare(`
            INSERT INTO contacts (id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, personal_code_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            contact.name.trim(),
            contact.phone || null,
            contact.discord || null,
            contact.instagram || null,
            contact.telegram || null,
            contact.signal || null,
            contact.address || null,
            contact.notes || null,
            contact.image_url || null,
            personalCodeHash,
            now,
            now
        ).run();
        
        if (!success) {
            return c.json({ error: 'Failed to create contact' }, 500);
        }
        
        return c.json({ success: true, id });
    } catch (error) {
        console.error('Error creating contact:', error);
        return c.json({ error: 'Failed to create contact' }, 500);
    }
});

app.put('/api/contacts/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const contactData = await c.req.json();
        const { personal_code, ...contact } = contactData;
        
        // Validate required fields
        if (!contact.name || !contact.name.trim()) {
            return c.json({ error: 'Name is required' }, 400);
        }
        
        if (!personal_code) {
            return c.json({ error: 'Personal code is required' }, 400);
        }
        
        // First verify the personal code
        const { results } = await c.env.DB.prepare(`
            SELECT personal_code_hash FROM contacts WHERE id = ?
        `).bind(id).all();
        
        if (results.length === 0) {
            return c.json({ error: 'Contact not found' }, 404);
        }
        
        const storedHash = results[0].personal_code_hash as string;
        const isValid = await verifyPassword(personal_code, storedHash);
        if (!isValid) {
            return c.json({ error: 'Invalid personal code' }, 401);
        }
        
        // Update contact
        const now = Math.floor(Date.now() / 1000);
        const { success } = await c.env.DB.prepare(`
            UPDATE contacts 
            SET name = ?, phone = ?, discord = ?, instagram = ?, telegram = ?, signal = ?, address = ?, notes = ?, image_url = ?, updated_at = ?
            WHERE id = ?
        `).bind(
            contact.name.trim(),
            contact.phone || null,
            contact.discord || null,
            contact.instagram || null,
            contact.telegram || null,
            contact.signal || null,
            contact.address || null,
            contact.notes || null,
            contact.image_url || null,
            now,
            id
        ).run();
        
        if (!success) {
            return c.json({ error: 'Failed to update contact' }, 500);
        }
        
        return c.json({ success: true });
    } catch (error) {
        console.error('Error updating contact:', error);
        return c.json({ error: 'Failed to update contact' }, 500);
    }
});

app.delete('/api/contacts/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const { personal_code } = await c.req.json();
        
        if (!personal_code) {
            return c.json({ error: 'Personal code is required' }, 400);
        }
        
        // First verify the personal code
        const { results } = await c.env.DB.prepare(`
            SELECT personal_code_hash FROM contacts WHERE id = ?
        `).bind(id).all();
        
        if (results.length === 0) {
            return c.json({ error: 'Contact not found' }, 404);
        }
        
        const storedHash = results[0].personal_code_hash as string;
        const isValid = await verifyPassword(personal_code, storedHash);
        if (!isValid) {
            return c.json({ error: 'Invalid personal code' }, 401);
        }
        
        // Delete contact
        const { success } = await c.env.DB.prepare(`
            DELETE FROM contacts WHERE id = ?
        `).bind(id).run();
        
        if (!success) {
            return c.json({ error: 'Failed to delete contact' }, 500);
        }
        
        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return c.json({ error: 'Failed to delete contact' }, 500);
    }
});

// Search contacts
app.get('/api/contacts/search/:query', async (c) => {
    try {
        const query = c.req.param('query');
        const searchTerm = `%${query}%`;
        
        const { results } = await c.env.DB.prepare(`
            SELECT id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, created_at, updated_at
            FROM contacts
            WHERE name LIKE ? OR phone LIKE ? OR discord LIKE ? OR instagram LIKE ? OR telegram LIKE ? OR signal LIKE ? OR address LIKE ? OR notes LIKE ?
            ORDER BY name COLLATE NOCASE
        `).bind(
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        ).all();
        
        return c.json(results);
    } catch (error) {
        console.error('Error searching contacts:', error);
        return c.json({ error: 'Failed to search contacts' }, 500);
    }
});

// Image upload
app.post('/api/images/upload', async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            return c.json({ error: 'Only image files are allowed' }, 400);
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return c.json({ error: 'File size must be less than 5MB' }, 400);
        }
        
        // Generate unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        
        // Upload to R2
        await c.env.phr3img.put(fileName, file.stream(), {
            httpMetadata: {
                contentType: file.type
            }
        });
        
        // Generate public URL using your custom domain
        const imageUrl = `https://phr3img.farewellcafe.com/${fileName}`;
        
        return c.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        return c.json({ error: 'Failed to upload image' }, 500);
    }
});

// Image retrieval (fallback for direct API access)
app.get('/api/images/:key', async (c) => {
    const key = c.req.param('key');
    
    try {
        const object = await c.env.phr3img.get(key);
        
        if (!object) {
            return c.json({ error: 'Image not found' }, 404);
        }
        
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('cache-control', 'public, max-age=31536000'); // Cache for 1 year
        
        return new Response(object.body, { headers });
    } catch (error) {
        console.error('Error retrieving image:', error);
        return c.json({ error: 'Failed to retrieve image' }, 500);
    }
});

// Static files - use the Assets binding for modern static asset serving
app.get('/*', async (c) => {
    // For any remaining requests, try to serve from static assets
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
