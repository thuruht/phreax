/**
 * Images routes for managing uploaded images
 */
import { Hono } from 'hono';
import { Context } from 'hono';
import { Env } from '../types';

// Create a router for images
const imagesRoutes = new Hono<{ Bindings: Env }>();

// Upload a new image
imagesRoutes.post('/', async (c: Context<{ Bindings: Env }>) => {
  try {
    // Check if the user is authenticated (this is protected by auth middleware)
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return c.json({ error: 'No image file provided' }, 400);
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return c.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are supported' 
      }, 400);
    }
    
    // Generate a unique ID for the image
    const imageId = crypto.randomUUID();
    const extension = imageFile.type.split('/')[1];
    const key = `uploads/${imageId}.${extension}`;
    
    // Upload to R2
    await c.env.IMAGES.put(key, imageFile.stream(), {
      httpMetadata: {
        contentType: imageFile.type,
      },
    });
    
    // Generate the public URL
    const imageUrl = `${c.req.url.split('/api/')[0]}/api/images/${key}`;
    
    return c.json({ 
      success: true, 
      imageUrl,
      key
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Get an image by key
imagesRoutes.get('/:key', async (c: Context<{ Bindings: Env }>) => {
  try {
    const key = c.req.param('key');
    
    // Get image from R2
    const image = await c.env.IMAGES.get(key);
    
    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }
    
    // Get headers and stream the image
    const headers = new Headers();
    image.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(image.body, {
      headers
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return c.json({ error: 'Failed to fetch image' }, 500);
  }
});

// Delete an image
imagesRoutes.delete('/:key', async (c: Context<{ Bindings: Env }>) => {
  try {
    // Check if the user is authenticated (this is protected by auth middleware)
    const key = c.req.param('key');
    
    // Delete from R2
    await c.env.IMAGES.delete(key);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
});

export default imagesRoutes;