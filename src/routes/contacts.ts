/**
 * Contacts routes for managing phonebook entries
 */
import { Hono } from 'hono';
import { Context } from 'hono';
import { Env, ContactInput, PublicContact } from '../types';
import { hashPassword, verifyPassword } from '../auth';
import { executeQuery, executeWrite } from '../lib/database';

// Create a router for contacts
const contactsRoutes = new Hono<{ Bindings: Env }>();

// Get all contacts
contactsRoutes.get('/', async (c: Context<{ Bindings: Env }>) => {
  try {
    const result = await executeQuery<PublicContact>(c.env.DB, `
      SELECT id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, created_at, updated_at
      FROM contacts
      ORDER BY name COLLATE NOCASE
    `);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to fetch contacts' }, 500);
    }
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.json({ error: 'Failed to fetch contacts' }, 500);
  }
});

// Search contacts
contactsRoutes.get('/search/:query', async (c: Context<{ Bindings: Env }>) => {
  try {
    const query = c.req.param('query');
    const searchTerm = `%${query}%`;
    
    const result = await executeQuery<PublicContact>(c.env.DB, `
      SELECT id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, created_at, updated_at
      FROM contacts
      WHERE name LIKE ? OR phone LIKE ? OR discord LIKE ? OR instagram LIKE ? 
        OR telegram LIKE ? OR signal LIKE ? OR address LIKE ? OR notes LIKE ?
      ORDER BY name COLLATE NOCASE
    `, [
      searchTerm, searchTerm, searchTerm, searchTerm, 
      searchTerm, searchTerm, searchTerm, searchTerm
    ]);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to search contacts' }, 500);
    }
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return c.json({ error: 'Failed to search contacts' }, 500);
  }
});

// Get contact by ID
contactsRoutes.get('/:id', async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    
    const result = await executeQuery<PublicContact>(c.env.DB, `
      SELECT id, name, phone, discord, instagram, telegram, signal, address, notes, image_url, created_at, updated_at
      FROM contacts
      WHERE id = ?
    `, [id]);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to fetch contact' }, 500);
    }
    
    if (!result.results || result.results.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    return c.json(result.results[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return c.json({ error: 'Failed to fetch contact' }, 500);
  }
});

// Create new contact
contactsRoutes.post('/', async (c: Context<{ Bindings: Env }>) => {
  try {
    const contactData = await c.req.json() as ContactInput;
    const { personal_code, ...contact } = contactData;
    
    // Validate required fields
    if (!contact.name || !contact.name.trim()) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    // Hash personal code (use default 'please' if none provided)
    const personalCodeHash = await hashPassword(personal_code || 'please');
    
    // Generate ID and timestamps
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    // Insert contact
    const result = await executeWrite(c.env.DB, `
      INSERT INTO contacts (
        id, name, phone, discord, instagram, telegram, signal, address, notes, 
        image_url, personal_code_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to create contact' }, 500);
    }
    
    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error creating contact:', error);
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

// Update existing contact
contactsRoutes.put('/:id', async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const contactData = await c.req.json() as ContactInput & { personal_code: string };
    const { personal_code, ...contact } = contactData;
    
    // Validate required fields
    if (!contact.name || !contact.name.trim()) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    if (!personal_code) {
      return c.json({ error: 'Personal code is required' }, 400);
    }
    
    // First verify the personal code
    const codeResult = await executeQuery<{ personal_code_hash: string }>(
      c.env.DB,
      'SELECT personal_code_hash FROM contacts WHERE id = ?',
      [id]
    );
    
    if (!codeResult.success || !codeResult.results || codeResult.results.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    const storedHash = codeResult.results[0].personal_code_hash;
    const isValid = await verifyPassword(personal_code, storedHash);
    
    if (!isValid) {
      return c.json({ error: 'Invalid personal code' }, 401);
    }
    
    // Update contact
    const now = Math.floor(Date.now() / 1000);
    const result = await executeWrite(c.env.DB, `
      UPDATE contacts 
      SET name = ?, phone = ?, discord = ?, instagram = ?, telegram = ?, 
          signal = ?, address = ?, notes = ?, image_url = ?, updated_at = ?
      WHERE id = ?
    `, [
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
    ]);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to update contact' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating contact:', error);
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

// Delete contact
contactsRoutes.delete('/:id', async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json() as { personal_code: string };
    const { personal_code } = data;
    
    if (!personal_code) {
      return c.json({ error: 'Personal code is required' }, 400);
    }
    
    // First verify the personal code
    const codeResult = await executeQuery<{ personal_code_hash: string }>(
      c.env.DB,
      'SELECT personal_code_hash FROM contacts WHERE id = ?',
      [id]
    );
    
    if (!codeResult.success || !codeResult.results || codeResult.results.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    const storedHash = codeResult.results[0].personal_code_hash;
    const isValid = await verifyPassword(personal_code, storedHash);
    
    if (!isValid) {
      return c.json({ error: 'Invalid personal code' }, 401);
    }
    
    // Delete contact
    const result = await executeWrite(c.env.DB, `
      DELETE FROM contacts WHERE id = ?
    `, [id]);
    
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to delete contact' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

export default contactsRoutes;