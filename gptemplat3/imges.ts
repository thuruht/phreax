import { Hono } from 'hono'
import { validateSession } from '../middleware/auth'

const imagesRoutes = new Hono()

// Huge whitelist of allowed file extensions
const allowedExtensions = [
  // Images
  'jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico','heic','heif','avif',
  // Docs
  'pdf','txt','md','doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','rtf','csv','json','xml','yaml','yml',
  // Media
  'mp3','wav','ogg','flac','mp4','webm','mov','avi','mkv','m4a',
  // Archives
  'zip','rar','7z','tar','gz','bz2'
]

imagesRoutes.post('/upload', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) return c.json({ error: 'No file provided' }, 400)

  const ext = (file.name && file.name.includes('.'))
    ? file.name.split('.').pop()!.toLowerCase()
    : ''

  if (!allowedExtensions.includes(ext)) {
    return c.json({ error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` }, 400)
  }

  const key = `${crypto.randomUUID()}.${ext}`

  await c.env.phr3img.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  })

  return c.json({
    success: true,
    key,
    url: `https://imagedelivery.net/${c.env.IMAGES_ACCOUNT_HASH}/${key}/public`
  })
})

imagesRoutes.get('/', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const list = await c.env.phr3img.list()
  return c.json(list.objects.map((o: any) => o.key))
})

imagesRoutes.delete('/:key', async (c) => {
  if (!validateSession(c)) return c.json({ error: 'Unauthorized' }, 401)

  const key = c.req.param('key')
  await c.env.phr3img.delete(key)
  return c.json({ success: true })
})

export default imagesRoutes
