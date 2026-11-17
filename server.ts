import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  clearSessionCookie,
  getAuthenticatedUser,
  hashPassword,
  ownerCount,
  requireAuth,
  requireOwner,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
  type AuthedRequest,
} from './server/auth.ts';
import { db, getUploadsDir, writeAuditLog } from './server/db.ts';
import { seedInitialData } from './server/seed.ts';
import { extractYouTubeVideoId } from './src/utils/youtube.ts';

seedInitialData();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = getUploadsDir();

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = EXT_BY_MIME[file.mimetype] || '.bin';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, and WebP images up to 3 MB are permitted.'));
      return;
    }
    cb(null, true);
  },
});

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return base || `video-${crypto.randomBytes(3).toString('hex')}`;
}

function uniqueVideoSlug(preferred: string, excludeId?: number): string {
  let candidate = slugify(preferred);
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db.prepare(`SELECT id FROM videos WHERE slug = ? AND id != ?`).get(candidate, excludeId) as { id: number } | undefined)
      : (db.prepare(`SELECT id FROM videos WHERE slug = ?`).get(candidate) as { id: number } | undefined);
    if (!existing) return candidate;
    candidate = `${slugify(preferred)}-${counter++}`;
  }
}

function getSettingsMap(): Record<string, string> {
  const rows = db.prepare(`SELECT key, value FROM site_settings`).all() as Array<{ key: string; value: string }>;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function removeUploadedFileIfUnused(urlPath: string | null | undefined): void {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  const filename = path.basename(urlPath);
  const refsVideos = (
    db.prepare(`SELECT COUNT(*) as cnt FROM videos WHERE custom_thumbnail_url = ?`).get(urlPath) as { cnt: number }
  ).cnt;
  if (refsVideos > 0) return;

  db.prepare(`DELETE FROM media_library WHERE url = ?`).run(urlPath);
  const fullPath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // ignore disk cleanup failures
    }
  }
}

function resolveBaseUrl(req: express.Request, settings: Record<string, string>): string {
  if (settings.canonical_base_url && settings.canonical_base_url.trim()) {
    return settings.canonical_base_url.trim().replace(/\/+$/, '');
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// ---------- SEO ENDPOINTS ----------

app.get('/robots.txt', (req, res) => {
  const settings = getSettingsMap();
  const base = resolveBaseUrl(req, settings);
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /owner',
      'Disallow: /owner/',
      'Disallow: /api/',
      '',
      `Sitemap: ${base}/sitemap.xml`,
    ].join('\n')
  );
});

app.get('/sitemap.xml', (req, res) => {
  const settings = getSettingsMap();
  const base = resolveBaseUrl(req, settings);
  const videos = db
    .prepare(`SELECT slug, updated_at, published_at FROM videos WHERE status = 'published' ORDER BY display_order ASC`)
    .all() as Array<{ slug: string; updated_at: string; published_at: string | null }>;

  const staticPaths = [
    '/',
    '/documentaries',
    '/mysteries',
    '/real-stories',
    '/shorts',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  const urls = [
    ...staticPaths.map(
      (p) => `  <url>\n    <loc>${base}${p}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
    ),
    ...videos.map((v) => {
      const lastmod = (v.updated_at || v.published_at || '').slice(0, 10);
      return `  <url>\n    <loc>${base}/watch/${encodeURIComponent(v.slug)}</loc>${
        lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      }\n    <changefreq>monthly</changefreq>\n  </url>`;
    }),
  ];

  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
        '\n'
      )}\n</urlset>`
    );
});

// ---------- AUTHENTICATION ROUTES ----------

app.get('/api/auth/status', (req, res) => {
  const user = getAuthenticatedUser(req);
  res.json({
    ownerExists: ownerCount() > 0,
    authenticated: Boolean(user),
    user,
  });
});

app.post('/api/auth/setup-owner', (req, res) => {
  if (ownerCount() > 0) {
    writeAuditLog({
      actorEmail: String(req.body?.email || 'unknown'),
      action: 'OWNER_SETUP_BLOCKED',
      entityType: 'user',
      result: 'denied',
      details: 'Attempted initial owner setup after owner already exists.',
      ipAddress: req.ip || '',
    });
    res.status(403).json({ error: 'Initial Owner setup is permanently locked.' });
    return;
  }

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (name.length < 2) {
    res.status(400).json({ error: 'Owner name must be at least 2 characters.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const info = db
    .prepare(
      `INSERT INTO users (email, name, role, password_hash, password_salt, last_login_at)
       VALUES (?, ?, 'owner', ?, ?, datetime('now'))`
    )
    .run(email, name, hash, salt);

  const createdUser = db
    .prepare(`SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as {
    id: number;
    email: string;
    name: string;
    role: 'owner';
    created_at: string;
    last_login_at: string | null;
  };

  const token = signSessionToken({ id: createdUser.id, role: 'owner' });
  setSessionCookie(res, token);

  writeAuditLog({
    actorId: createdUser.id,
    actorEmail: createdUser.email,
    action: 'OWNER_CREATED',
    entityType: 'user',
    entityId: createdUser.id,
    result: 'success',
    details: 'Initial Owner account created and public setup locked.',
    ipAddress: req.ip || '',
  });

  res.status(201).json({ user: createdUser });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db
    .prepare(`SELECT id, email, name, role, password_hash, password_salt, created_at, last_login_at FROM users WHERE email = ?`)
    .get(email) as
    | {
        id: number;
        email: string;
        name: string;
        role: 'owner' | 'editor';
        password_hash: string;
        password_salt: string;
        created_at: string;
        last_login_at: string | null;
      }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    writeAuditLog({
      actorEmail: email,
      action: 'LOGIN_FAILED',
      entityType: 'auth',
      result: 'denied',
      details: 'Invalid email or password.',
      ipAddress: req.ip || '',
    });
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(row.id);
  const token = signSessionToken({ id: row.id, role: row.role });
  setSessionCookie(res, token);

  writeAuditLog({
    actorId: row.id,
    actorEmail: row.email,
    action: 'LOGIN_SUCCESS',
    entityType: 'auth',
    entityId: row.id,
    result: 'success',
    ipAddress: req.ip || '',
  });

  res.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.created_at,
      last_login_at: new Date().toISOString(),
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const user = getAuthenticatedUser(req);
  clearSessionCookie(res);
  if (user) {
    writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: user.id,
      result: 'success',
      ipAddress: req.ip || '',
    });
  }
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAuth, (req: AuthedRequest, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' });
    return;
  }

  const row = db
    .prepare(`SELECT password_hash, password_salt FROM users WHERE id = ?`)
    .get(req.authUser!.id) as { password_hash: string; password_salt: string };

  if (!verifyPassword(currentPassword, row.password_hash, row.password_salt)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare(`UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?`).run(hash, salt, req.authUser!.id);

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'PASSWORD_CHANGED',
    entityType: 'user',
    entityId: req.authUser!.id,
    result: 'success',
    ipAddress: req.ip || '',
  });

  res.json({ ok: true });
});

app.post('/api/auth/invite-editor', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    res.status(400).json({ error: 'Valid name, email, and 8+ character password are required.' });
    return;
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const info = db
    .prepare(
      `INSERT INTO users (email, name, role, password_hash, password_salt, invited_by)
       VALUES (?, ?, 'editor', ?, ?, ?)`
    )
    .run(email, name, hash, salt, req.authUser!.id);

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'EDITOR_INVITED',
    entityType: 'user',
    entityId: Number(info.lastInsertRowid),
    result: 'success',
    details: `Invited limited editor ${email}`,
    ipAddress: req.ip || '',
  });

  res.status(201).json({
    editor: {
      id: Number(info.lastInsertRowid),
      email,
      name,
      role: 'editor',
    },
  });
});

// Explicitly block any public signup attempt
app.post('/api/auth/register', (_req, res) => {
  res.status(403).json({ error: 'Public registration is disabled.' });
});

// ---------- PUBLIC API ROUTES ----------

app.get('/api/public/bootstrap', (_req, res) => {
  const categories = db.prepare(`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`).all();
  const sections = db
    .prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`)
    .all();
  const rawSettings = getSettingsMap();
  const showPublicContact = rawSettings.show_public_contact === '1';
  const settings = {
    ...rawSettings,
    contact_email: '',
    public_contact_name: showPublicContact ? rawSettings.public_contact_name || '' : '',
    public_contact_mobile: showPublicContact ? rawSettings.public_contact_mobile || '' : '',
    show_public_contact: rawSettings.show_public_contact || '0',
  };
  const videos = db
    .prepare(
      `SELECT v.*, c.slug as category_slug, c.name_en as category_name_en, c.name_hi as category_name_hi
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.status = 'published'
       ORDER BY v.display_order ASC, v.id DESC`
    )
    .all();
  const publicPhotos = db
    .prepare(`SELECT id, url, caption, sort_order, created_at FROM owner_photos WHERE is_public = 1 ORDER BY sort_order ASC, id ASC`)
    .all();

  res.json({
    categories,
    sections,
    settings,
    videos,
    publicPhotos,
  });
});

app.get('/api/public/videos', (req, res) => {
  const category = String(req.query.category || '').trim();
  const format = String(req.query.format || '').trim();
  const search = String(req.query.search || '').trim().toLowerCase();

  let sql = `
    SELECT v.*, c.slug as category_slug, c.name_en as category_name_en, c.name_hi as category_name_hi
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    WHERE v.status = 'published'
  `;
  const params: Array<string | number> = [];

  if (category && category !== 'all') {
    sql += ` AND c.slug = ?`;
    params.push(category);
  }
  if (format === 'long' || format === 'short') {
    sql += ` AND v.format = ?`;
    params.push(format);
  }
  if (search) {
    sql += ` AND (LOWER(v.title_en) LIKE ? OR LOWER(v.title_hi) LIKE ? OR LOWER(v.description_en) LIKE ? OR LOWER(v.description_hi) LIKE ?)`;
    const pat = `%${search}%`;
    params.push(pat, pat, pat, pat);
  }
  sql += ` ORDER BY v.display_order ASC, v.id DESC`;

  const videos = db.prepare(sql).all(...params);
  res.json({ videos });
});

app.get('/api/public/videos/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim();
  const video = db
    .prepare(
      `SELECT v.*, c.slug as category_slug, c.name_en as category_name_en, c.name_hi as category_name_hi
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.slug = ? AND v.status = 'published'`
    )
    .get(slug) as { id: number; category_id: number | null; format: string } | undefined;

  if (!video) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  const related = db
    .prepare(
      `SELECT v.*, c.slug as category_slug, c.name_en as category_name_en, c.name_hi as category_name_hi
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.status = 'published' AND v.id != ? AND v.format = ?
       ORDER BY (CASE WHEN v.category_id = ? THEN 0 ELSE 1 END), v.display_order ASC
       LIMIT 6`
    )
    .all(video.id, video.format, video.category_id);

  res.json({ video, related });
});

app.post('/api/public/contact', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  const language = req.body?.language === 'hi' ? 'hi' : 'en';

  if (name.length < 2 || name.length > 120) {
    res.status(400).json({ error: 'Please provide your full name (2–120 characters).' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (subject.length < 3 || subject.length > 180) {
    res.status(400).json({ error: 'Subject must be between 3 and 180 characters.' });
    return;
  }
  if (message.length < 10 || message.length > 4000) {
    res.status(400).json({ error: 'Message must be between 10 and 4000 characters.' });
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO contact_messages (name, email, subject, message, language, status)
       VALUES (?, ?, ?, ?, ?, 'new')`
    )
    .run(name, email, subject, message, language);

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    ok: true,
  });
});

// ---------- PRIVATE ADMIN / OWNER API ROUTES ----------

app.get('/api/admin/overview', requireAuth, (_req, res) => {
  const count = (sql: string) => (db.prepare(sql).get() as { cnt: number }).cnt;
  res.json({
    totalVideos: count(`SELECT COUNT(*) as cnt FROM videos`),
    publishedVideos: count(`SELECT COUNT(*) as cnt FROM videos WHERE status = 'published'`),
    draftVideos: count(`SELECT COUNT(*) as cnt FROM videos WHERE status = 'draft'`),
    demoRecords: count(`SELECT COUNT(*) as cnt FROM videos WHERE is_demo = 1`),
    realVideos: count(`SELECT COUNT(*) as cnt FROM videos WHERE is_demo = 0`),
    shortsCount: count(`SELECT COUNT(*) as cnt FROM videos WHERE format = 'short'`),
    categoriesCount: count(`SELECT COUNT(*) as cnt FROM categories`),
    contactMessagesCount: count(`SELECT COUNT(*) as cnt FROM contact_messages`),
    unreadMessagesCount: count(`SELECT COUNT(*) as cnt FROM contact_messages WHERE status = 'new'`),
    mediaCount: count(`SELECT COUNT(*) as cnt FROM media_library`),
    auditLogsCount: count(`SELECT COUNT(*) as cnt FROM audit_logs`),
    editorsCount: count(`SELECT COUNT(*) as cnt FROM users WHERE role = 'editor'`),
  });
});

app.get('/api/admin/videos', requireAuth, (_req, res) => {
  const videos = db
    .prepare(
      `SELECT v.*, c.slug as category_slug, c.name_en as category_name_en, c.name_hi as category_name_hi
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       ORDER BY v.display_order ASC, v.id DESC`
    )
    .all();
  res.json({ videos });
});

app.post('/api/admin/videos', requireAuth, (req: AuthedRequest, res) => {
  const youtubeUrlInput = String(req.body?.youtube_url || '').trim();
  const titleEn = String(req.body?.title_en || '').trim();
  const titleHi = String(req.body?.title_hi || '').trim();
  const descEn = String(req.body?.description_en || '').trim();
  const descHi = String(req.body?.description_hi || '').trim();
  const format = req.body?.format === 'short' ? 'short' : 'long';
  const categoryId = req.body?.category_id ? Number(req.body.category_id) : null;
  const customThumb = req.body?.custom_thumbnail_url ? String(req.body.custom_thumbnail_url).trim() : null;
  const status = req.body?.status === 'published' ? 'published' : 'draft';
  const placement = req.body?.placement === 'top' || req.body?.placement === 'featured' ? req.body.placement : 'normal';
  const isFeatured = placement === 'featured' || req.body?.is_featured ? 1 : 0;
  const isTrending = req.body?.is_trending ? 1 : 0;
  const isDemo = req.body?.is_demo ? 1 : 0;
  let displayOrder = Number.isFinite(Number(req.body?.display_order)) ? Number(req.body.display_order) : 0;

  if (!titleEn && !titleHi) {
    res.status(400).json({ error: 'Provide at least an English or Hindi title.' });
    return;
  }

  let youtubeId = '';
  let canonicalUrl = '';
  if (youtubeUrlInput) {
    const parsed = extractYouTubeVideoId(youtubeUrlInput);
    if (!parsed) {
      res.status(400).json({ error: 'Invalid YouTube URL. Supported: watch, youtu.be, shorts, embed.' });
      return;
    }
    youtubeId = parsed.videoId;
    canonicalUrl = parsed.canonicalUrl;
  } else if (!isDemo) {
    res.status(400).json({ error: 'A valid YouTube URL is required for channel videos.' });
    return;
  }

  const slug = uniqueVideoSlug(titleEn || youtubeId || titleHi);
  const publishedAt = status === 'published' ? (req.body?.published_at || new Date().toISOString()) : null;

  if (placement === 'top' || placement === 'featured') {
    db.prepare(`UPDATE videos SET display_order = display_order + 1 WHERE display_order >= 1`).run();
    displayOrder = 1;
    if (placement === 'featured') {
      db.prepare(`UPDATE videos SET is_featured = 0 WHERE format = ?`).run(format);
    }
  } else if (displayOrder <= 0) {
    const maxRow = db.prepare(`SELECT COALESCE(MAX(display_order), 0) as maxOrd FROM videos`).get() as { maxOrd: number };
    displayOrder = (maxRow?.maxOrd ?? 0) + 1;
  }

  const info = db
    .prepare(
      `INSERT INTO videos (
        slug, youtube_url, youtube_id, format,
        title_en, title_hi, description_en, description_hi,
        category_id, custom_thumbnail_url, status, is_featured, is_trending, is_demo, display_order, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      canonicalUrl,
      youtubeId,
      format,
      titleEn,
      titleHi,
      descEn,
      descHi,
      categoryId,
      customThumb,
      status,
      isFeatured,
      isTrending,
      isDemo,
      displayOrder,
      publishedAt
    );

  const created = db.prepare(`SELECT * FROM videos WHERE id = ?`).get(Number(info.lastInsertRowid));
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'VIDEO_CREATED',
    entityType: 'video',
    entityId: Number(info.lastInsertRowid),
    result: 'success',
    details: `${status.toUpperCase()} (${format}): ${titleEn || titleHi}`,
    ipAddress: req.ip || '',
  });

  res.status(201).json({ video: created });
});

app.put('/api/admin/videos/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM videos WHERE id = ?`).get(id) as
    | { id: number; status: string; published_at: string | null; custom_thumbnail_url: string | null; is_demo: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  const youtubeUrlInput = String(req.body?.youtube_url || '').trim();
  const titleEn = String(req.body?.title_en || '').trim();
  const titleHi = String(req.body?.title_hi || '').trim();
  const descEn = String(req.body?.description_en || '').trim();
  const descHi = String(req.body?.description_hi || '').trim();
  const format = req.body?.format === 'short' ? 'short' : 'long';
  const categoryId = req.body?.category_id ? Number(req.body.category_id) : null;
  const customThumb = req.body?.custom_thumbnail_url ? String(req.body.custom_thumbnail_url).trim() : null;
  const status = req.body?.status === 'published' ? 'published' : 'draft';
  const isFeatured = req.body?.is_featured ? 1 : 0;
  const isTrending = req.body?.is_trending ? 1 : 0;
  const isDemo = req.body?.is_demo ? 1 : 0;
  const displayOrder = Number.isFinite(Number(req.body?.display_order)) ? Number(req.body.display_order) : 0;

  if (!titleEn && !titleHi) {
    res.status(400).json({ error: 'Provide at least an English or Hindi title.' });
    return;
  }

  let youtubeId = '';
  let canonicalUrl = '';
  if (youtubeUrlInput) {
    const parsed = extractYouTubeVideoId(youtubeUrlInput);
    if (!parsed) {
      res.status(400).json({ error: 'Invalid YouTube URL.' });
      return;
    }
    youtubeId = parsed.videoId;
    canonicalUrl = parsed.canonicalUrl;
  } else if (!isDemo) {
    res.status(400).json({ error: 'A valid YouTube URL is required.' });
    return;
  }

  const slug = uniqueVideoSlug(String(req.body?.slug || titleEn || youtubeId || titleHi), id);
  const publishedAt =
    status === 'published' ? existing.published_at || new Date().toISOString() : existing.published_at;

  db.prepare(
    `UPDATE videos SET
      slug = ?, youtube_url = ?, youtube_id = ?, format = ?,
      title_en = ?, title_hi = ?, description_en = ?, description_hi = ?,
      category_id = ?, custom_thumbnail_url = ?, status = ?,
      is_featured = ?, is_trending = ?, is_demo = ?, display_order = ?,
      published_at = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    slug,
    canonicalUrl,
    youtubeId,
    format,
    titleEn,
    titleHi,
    descEn,
    descHi,
    categoryId,
    customThumb,
    status,
    isFeatured,
    isTrending,
    isDemo,
    displayOrder,
    publishedAt,
    id
  );

  if (existing.custom_thumbnail_url && existing.custom_thumbnail_url !== customThumb) {
    removeUploadedFileIfUnused(existing.custom_thumbnail_url);
  }

  const updated = db.prepare(`SELECT * FROM videos WHERE id = ?`).get(id);
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'VIDEO_UPDATED',
    entityType: 'video',
    entityId: id,
    result: 'success',
    details: `${status.toUpperCase()}: ${titleEn || titleHi}`,
    ipAddress: req.ip || '',
  });

  res.json({ video: updated });
});

app.patch('/api/admin/videos/:id/status', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status === 'published' ? 'published' : 'draft';
  const existing = db.prepare(`SELECT id, title_en, title_hi, published_at FROM videos WHERE id = ?`).get(id) as
    | { id: number; title_en: string; title_hi: string; published_at: string | null }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }
  const pubAt = status === 'published' ? existing.published_at || new Date().toISOString() : existing.published_at;
  db.prepare(`UPDATE videos SET status = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?`).run(
    status,
    pubAt,
    id
  );

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: status === 'published' ? 'VIDEO_PUBLISHED' : 'VIDEO_UNPUBLISHED',
    entityType: 'video',
    entityId: id,
    result: 'success',
    details: existing.title_en || existing.title_hi,
    ipAddress: req.ip || '',
  });

  res.json({ ok: true, status });
});

app.post('/api/admin/videos/reorder', requireAuth, (req: AuthedRequest, res) => {
  const orders = Array.isArray(req.body?.orders)
    ? (req.body.orders as Array<{ id: number; display_order: number }>)
    : [];
  const stmt = db.prepare(`UPDATE videos SET display_order = ?, updated_at = datetime('now') WHERE id = ?`);
  for (const item of orders) {
    stmt.run(Number(item.display_order) || 0, Number(item.id));
  }
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'VIDEOS_REORDERED',
    entityType: 'video',
    entityId: String(orders.length),
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

app.post('/api/admin/videos/:id/move-to-top', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const target = db.prepare(`SELECT id, title_en, title_hi FROM videos WHERE id = ?`).get(id) as
    | { id: number; title_en: string; title_hi: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  const others = db
    .prepare(`SELECT id FROM videos WHERE id != ? ORDER BY display_order ASC, id DESC`)
    .all(id) as Array<{ id: number }>;

  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare(`UPDATE videos SET display_order = 1, updated_at = datetime('now') WHERE id = ?`).run(id);
    const stmt = db.prepare(`UPDATE videos SET display_order = ?, updated_at = datetime('now') WHERE id = ?`);
    others.forEach((row, index) => {
      stmt.run(index + 2, row.id);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
    return;
  }

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'VIDEO_MOVED_TO_TOP',
    entityType: 'video',
    entityId: id,
    result: 'success',
    details: target.title_en || target.title_hi,
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

app.delete('/api/admin/videos/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare(`SELECT id, title_en, title_hi, custom_thumbnail_url, is_demo FROM videos WHERE id = ?`)
    .get(id) as
    | { id: number; title_en: string; title_hi: string; custom_thumbnail_url: string | null; is_demo: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  db.prepare(`DELETE FROM videos WHERE id = ?`).run(id);
  removeUploadedFileIfUnused(existing.custom_thumbnail_url);

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: existing.is_demo ? 'DEMO_VIDEO_DELETED' : 'VIDEO_DELETED',
    entityType: 'video',
    entityId: id,
    result: 'success',
    details: existing.title_en || existing.title_hi,
    ipAddress: req.ip || '',
  });

  res.json({ ok: true });
});

app.post('/api/admin/videos/delete-demos', requireAuth, (req: AuthedRequest, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((n: unknown) => Number(n)).filter(Boolean) : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'No demo video IDs selected.' });
    return;
  }

  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT id, custom_thumbnail_url FROM videos WHERE is_demo = 1 AND id IN (${placeholders})`)
    .all(...ids) as Array<{ id: number; custom_thumbnail_url: string | null }>;

  if (rows.length === 0) {
    res.status(404).json({ error: 'No matching demo records found.' });
    return;
  }

  db.prepare(`DELETE FROM videos WHERE is_demo = 1 AND id IN (${placeholders})`).run(...ids);
  for (const row of rows) {
    removeUploadedFileIfUnused(row.custom_thumbnail_url);
  }

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'DEMO_RECORDS_BULK_DELETED',
    entityType: 'video',
    entityId: rows.map((r) => r.id).join(','),
    result: 'success',
    details: `Deleted ${rows.length} demo record(s)`,
    ipAddress: req.ip || '',
  });

  res.json({ deletedCount: rows.length });
});

// Categories
app.get('/api/admin/categories', requireAuth, (_req, res) => {
  const categories = db.prepare(`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`).all();
  res.json({ categories });
});

app.post('/api/admin/categories', requireAuth, (req: AuthedRequest, res) => {
  const nameEn = String(req.body?.name_en || '').trim();
  const nameHi = String(req.body?.name_hi || '').trim();
  const descEn = String(req.body?.description_en || '').trim();
  const descHi = String(req.body?.description_hi || '').trim();
  const sortOrder = Number(req.body?.sort_order) || 0;
  if (!nameEn || !nameHi) {
    res.status(400).json({ error: 'Both English and Hindi category names are required.' });
    return;
  }
  const slug = slugify(String(req.body?.slug || nameEn));
  const exists = db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(slug);
  if (exists) {
    res.status(409).json({ error: 'A category with this slug already exists.' });
    return;
  }
  const info = db
    .prepare(
      `INSERT INTO categories (slug, name_en, name_hi, description_en, description_hi, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(slug, nameEn, nameHi, descEn, descHi, sortOrder);

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'CATEGORY_CREATED',
    entityType: 'category',
    entityId: Number(info.lastInsertRowid),
    result: 'success',
    details: `${nameEn} / ${nameHi}`,
    ipAddress: req.ip || '',
  });

  res.status(201).json({ category: db.prepare(`SELECT * FROM categories WHERE id = ?`).get(Number(info.lastInsertRowid)) });
});

app.put('/api/admin/categories/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const nameEn = String(req.body?.name_en || '').trim();
  const nameHi = String(req.body?.name_hi || '').trim();
  const descEn = String(req.body?.description_en || '').trim();
  const descHi = String(req.body?.description_hi || '').trim();
  const sortOrder = Number(req.body?.sort_order) || 0;
  if (!nameEn || !nameHi) {
    res.status(400).json({ error: 'Both English and Hindi category names are required.' });
    return;
  }
  db.prepare(
    `UPDATE categories SET name_en = ?, name_hi = ?, description_en = ?, description_hi = ?, sort_order = ? WHERE id = ?`
  ).run(nameEn, nameHi, descEn, descHi, sortOrder, id);

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'CATEGORY_UPDATED',
    entityType: 'category',
    entityId: id,
    result: 'success',
    details: nameEn,
    ipAddress: req.ip || '',
  });

  res.json({ category: db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id) });
});

app.delete('/api/admin/categories/:id', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare(`UPDATE videos SET category_id = NULL WHERE category_id = ?`).run(id);
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'CATEGORY_DELETED',
    entityType: 'category',
    entityId: id,
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

// Homepage Sections
app.get('/api/admin/homepage-sections', requireAuth, (_req, res) => {
  const sections = db.prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`).all();
  res.json({ sections });
});

app.put('/api/admin/homepage-sections', requireAuth, (req: AuthedRequest, res) => {
  const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];
  const stmt = db.prepare(`
    UPDATE homepage_sections SET
      title_en = ?, title_hi = ?, subtitle_en = ?, subtitle_hi = ?,
      cta_label_en = ?, cta_label_hi = ?, is_visible = ?, sort_order = ?, updated_at = datetime('now')
    WHERE section_key = ?
  `);
  for (const s of sections) {
    stmt.run(
      String(s.title_en || ''),
      String(s.title_hi || ''),
      String(s.subtitle_en || ''),
      String(s.subtitle_hi || ''),
      String(s.cta_label_en || ''),
      String(s.cta_label_hi || ''),
      s.is_visible ? 1 : 0,
      Number(s.sort_order) || 0,
      String(s.section_key || '')
    );
  }
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'HOMEPAGE_SECTIONS_UPDATED',
    entityType: 'homepage_sections',
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ sections: db.prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`).all() });
});

// Media Library
app.get('/api/admin/media', requireAuth, (_req, res) => {
  const assets = db.prepare(`SELECT * FROM media_library ORDER BY id DESC`).all();
  res.json({ assets });
});

app.post('/api/admin/media', requireAuth, (req: AuthedRequest, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Upload failed.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Please choose an image file (JPG, PNG, or WebP).' });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    const altText = String(req.body?.alt_text || req.file.originalname).trim();
    const info = db
      .prepare(
        `INSERT INTO media_library (filename, original_name, mime_type, size_bytes, url, alt_text, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        url,
        altText,
        req.authUser!.id
      );

    writeAuditLog({
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      action: 'MEDIA_UPLOADED',
      entityType: 'media',
      entityId: Number(info.lastInsertRowid),
      result: 'success',
      details: req.file.originalname,
      ipAddress: req.ip || '',
    });

    res.status(201).json({
      asset: db.prepare(`SELECT * FROM media_library WHERE id = ?`).get(Number(info.lastInsertRowid)),
    });
  });
});

app.delete('/api/admin/media/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const asset = db.prepare(`SELECT * FROM media_library WHERE id = ?`).get(id) as
    | { id: number; filename: string; url: string; original_name: string }
    | undefined;
  if (!asset) {
    res.status(404).json({ error: 'Media asset not found.' });
    return;
  }

  db.prepare(`UPDATE videos SET custom_thumbnail_url = NULL WHERE custom_thumbnail_url = ?`).run(asset.url);
  db.prepare(`DELETE FROM media_library WHERE id = ?`).run(id);
  const diskPath = path.join(UPLOADS_DIR, asset.filename);
  if (fs.existsSync(diskPath)) {
    try {
      fs.unlinkSync(diskPath);
    } catch {
      // ignore
    }
  }

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'MEDIA_DELETED',
    entityType: 'media',
    entityId: id,
    result: 'success',
    details: asset.original_name,
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

// Owner Profile Photos (Private by default; Owner chooses which appear publicly)
app.get('/api/admin/owner-photos', requireAuth, requireOwner, (_req, res) => {
  const photos = db.prepare(`SELECT * FROM owner_photos ORDER BY sort_order ASC, id DESC`).all();
  res.json({ photos });
});

app.post('/api/admin/owner-photos', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Photo upload failed.' });
      return;
    }
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      res.status(400).json({ error: 'Select one or more JPG, PNG, or WebP images (max 3 MB each).' });
      return;
    }

    const caption = String(req.body?.caption || '').trim();
    const maxOrdRow = db.prepare(`SELECT COALESCE(MAX(sort_order), 0) as maxOrd FROM owner_photos`).get() as {
      maxOrd: number;
    };
    let nextOrder = (maxOrdRow?.maxOrd ?? 0) + 1;

    const insert = db.prepare(
      `INSERT INTO owner_photos (filename, original_name, mime_type, size_bytes, url, caption, is_public, sort_order, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    );
    const createdIds: number[] = [];
    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      const info = insert.run(
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        url,
        caption,
        nextOrder++,
        req.authUser!.id
      );
      createdIds.push(Number(info.lastInsertRowid));
    }

    writeAuditLog({
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      action: 'OWNER_PHOTOS_UPLOADED',
      entityType: 'owner_photo',
      entityId: createdIds.join(','),
      result: 'success',
      details: `Uploaded ${files.length} private owner photo(s)`,
      ipAddress: req.ip || '',
    });

    const photos = db.prepare(`SELECT * FROM owner_photos ORDER BY sort_order ASC, id DESC`).all();
    res.status(201).json({ photos });
  });
});

app.patch('/api/admin/owner-photos/:id', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM owner_photos WHERE id = ?`).get(id) as
    | { id: number; caption: string; is_public: number; sort_order: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }
  const isPublic = req.body?.is_public !== undefined ? (req.body.is_public ? 1 : 0) : existing.is_public;
  const caption = req.body?.caption !== undefined ? String(req.body.caption).trim() : existing.caption;
  const sortOrder = req.body?.sort_order !== undefined ? Number(req.body.sort_order) || 0 : existing.sort_order;

  db.prepare(`UPDATE owner_photos SET is_public = ?, caption = ?, sort_order = ? WHERE id = ?`).run(
    isPublic,
    caption,
    sortOrder,
    id
  );

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'OWNER_PHOTO_UPDATED',
    entityType: 'owner_photo',
    entityId: id,
    result: 'success',
    details: `is_public=${isPublic}`,
    ipAddress: req.ip || '',
  });

  res.json({ photo: db.prepare(`SELECT * FROM owner_photos WHERE id = ?`).get(id) });
});

app.post('/api/admin/owner-photos/:id/replace', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM owner_photos WHERE id = ?`).get(id) as
    | { id: number; filename: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  upload.single('file')(req, res, (err) => {
    if (err || !req.file) {
      res.status(400).json({ error: err?.message || 'Select a valid replacement image.' });
      return;
    }

    const oldPath = path.join(UPLOADS_DIR, existing.filename);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch {
        // ignore
      }
    }

    const url = `/uploads/${req.file.filename}`;
    db.prepare(
      `UPDATE owner_photos SET filename = ?, original_name = ?, mime_type = ?, size_bytes = ?, url = ? WHERE id = ?`
    ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, id);

    writeAuditLog({
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      action: 'OWNER_PHOTO_REPLACED',
      entityType: 'owner_photo',
      entityId: id,
      result: 'success',
      details: req.file.originalname,
      ipAddress: req.ip || '',
    });

    res.json({ photo: db.prepare(`SELECT * FROM owner_photos WHERE id = ?`).get(id) });
  });
});

app.post('/api/admin/owner-photos/bulk-delete', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((n: unknown) => Number(n)).filter(Boolean) : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'No photos selected.' });
    return;
  }
  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT id, filename FROM owner_photos WHERE id IN (${placeholders})`)
    .all(...ids) as Array<{ id: number; filename: string }>;

  db.prepare(`DELETE FROM owner_photos WHERE id IN (${placeholders})`).run(...ids);
  for (const r of rows) {
    const p = path.join(UPLOADS_DIR, r.filename);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        // ignore
      }
    }
  }

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'OWNER_PHOTOS_DELETED',
    entityType: 'owner_photo',
    entityId: rows.map((r) => r.id).join(','),
    result: 'success',
    details: `Deleted ${rows.length} owner photo(s)`,
    ipAddress: req.ip || '',
  });
  res.json({ deletedCount: rows.length });
});

app.delete('/api/admin/owner-photos/:id', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT id, filename FROM owner_photos WHERE id = ?`).get(id) as
    | { id: number; filename: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }
  db.prepare(`DELETE FROM owner_photos WHERE id = ?`).run(id);
  const p = path.join(UPLOADS_DIR, existing.filename);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
    } catch {
      // ignore
    }
  }
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'OWNER_PHOTO_DELETED',
    entityType: 'owner_photo',
    entityId: id,
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

// Contact Messages
app.get('/api/admin/messages', requireAuth, (_req, res) => {
  const messages = db.prepare(`SELECT * FROM contact_messages ORDER BY id DESC`).all();
  res.json({ messages });
});

app.patch('/api/admin/messages/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const status = ['new', 'read', 'archived'].includes(String(req.body?.status)) ? String(req.body.status) : 'read';
  db.prepare(`UPDATE contact_messages SET status = ? WHERE id = ?`).run(status, id);
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'MESSAGE_STATUS_UPDATED',
    entityType: 'contact_message',
    entityId: id,
    result: 'success',
    details: status,
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

app.delete('/api/admin/messages/:id', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare(`DELETE FROM contact_messages WHERE id = ?`).run(id);
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'MESSAGE_DELETED',
    entityType: 'contact_message',
    entityId: id,
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ ok: true });
});

// Site Settings (Owner-only write)
app.get('/api/admin/settings', requireAuth, (_req, res) => {
  const editors = db
    .prepare(`SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY id ASC`)
    .all();
  res.json({ settings: getSettingsMap(), users: editors });
});

app.put('/api/admin/settings', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const updates = req.body?.settings;
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'Invalid settings payload.' });
    return;
  }
  const allowedKeys = new Set([
    'site_name',
    'youtube_channel_url',
    'default_language',
    'default_theme',
    'seo_title_en',
    'seo_title_hi',
    'seo_description_en',
    'seo_description_hi',
    'seo_keywords',
    'canonical_base_url',
    'about_en',
    'about_hi',
    'privacy_en',
    'privacy_hi',
    'terms_en',
    'terms_hi',
    'contact_email',
    'public_contact_name',
    'public_contact_mobile',
    'show_public_contact',
  ]);
  const stmt = db.prepare(
    `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  for (const [k, v] of Object.entries(updates)) {
    if (allowedKeys.has(k)) {
      stmt.run(k, String(v ?? ''));
    }
  }
  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'SETTINGS_UPDATED',
    entityType: 'site_settings',
    result: 'success',
    ipAddress: req.ip || '',
  });
  res.json({ settings: getSettingsMap() });
});

// Audit Logs (Owner-only)
app.get('/api/admin/audit-logs', requireAuth, requireOwner, (_req, res) => {
  const logs = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 250`).all();
  res.json({ logs });
});

// Backup & Recovery (Owner-only)
app.get('/api/admin/backups', requireAuth, requireOwner, (_req, res) => {
  const backups = db.prepare(`SELECT * FROM backup_metadata ORDER BY id DESC LIMIT 50`).all();
  res.json({ backups });
});

app.get('/api/admin/backup/export', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const categories = db.prepare(`SELECT * FROM categories ORDER BY id ASC`).all();
  const videos = db.prepare(`SELECT * FROM videos ORDER BY id ASC`).all();
  const homepage_sections = db.prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`).all();
  const site_settings = db.prepare(`SELECT * FROM site_settings ORDER BY key ASC`).all();
  const contact_messages = db.prepare(`SELECT * FROM contact_messages ORDER BY id ASC`).all();

  const counts = {
    categories: categories.length,
    videos: videos.length,
    homepage_sections: homepage_sections.length,
    site_settings: site_settings.length,
    contact_messages: contact_messages.length,
  };

  db.prepare(`INSERT INTO backup_metadata (created_by, record_counts_json, notes) VALUES (?, ?, ?)`).run(
    req.authUser!.email,
    JSON.stringify(counts),
    'Manual JSON export from Owner Dashboard'
  );

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'BACKUP_EXPORTED',
    entityType: 'backup',
    result: 'success',
    details: JSON.stringify(counts),
    ipAddress: req.ip || '',
  });

  res.json({
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: req.authUser!.email,
    counts,
    data: {
      categories,
      videos,
      homepage_sections,
      site_settings,
      contact_messages,
    },
  });
});

app.post('/api/admin/backup/restore', requireAuth, requireOwner, (req: AuthedRequest, res) => {
  const payload = req.body?.data;
  if (!payload || !Array.isArray(payload.categories) || !Array.isArray(payload.videos)) {
    res.status(400).json({ error: 'Invalid backup JSON format. Expected data.categories and data.videos arrays.' });
    return;
  }

  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare(`DELETE FROM videos`).run();
    db.prepare(`DELETE FROM categories`).run();

    const insertCat = db.prepare(
      `INSERT INTO categories (id, slug, name_en, name_hi, description_en, description_hi, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const c of payload.categories) {
      insertCat.run(
        c.id,
        c.slug,
        c.name_en,
        c.name_hi,
        c.description_en || '',
        c.description_hi || '',
        c.sort_order || 0,
        c.created_at || new Date().toISOString()
      );
    }

    const insertVid = db.prepare(
      `INSERT INTO videos (
        id, slug, youtube_url, youtube_id, format, title_en, title_hi, description_en, description_hi,
        category_id, custom_thumbnail_url, status, is_featured, is_trending, is_demo, display_order, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const v of payload.videos) {
      insertVid.run(
        v.id,
        v.slug,
        v.youtube_url || '',
        v.youtube_id || '',
        v.format === 'short' ? 'short' : 'long',
        v.title_en || '',
        v.title_hi || '',
        v.description_en || '',
        v.description_hi || '',
        v.category_id ?? null,
        v.custom_thumbnail_url ?? null,
        v.status === 'published' ? 'published' : 'draft',
        v.is_featured ? 1 : 0,
        v.is_trending ? 1 : 0,
        v.is_demo ? 1 : 0,
        v.display_order || 0,
        v.published_at ?? null,
        v.created_at || new Date().toISOString(),
        v.updated_at || new Date().toISOString()
      );
    }

    if (Array.isArray(payload.homepage_sections)) {
      const upsertSec = db.prepare(
        `INSERT INTO homepage_sections (section_key, title_en, title_hi, subtitle_en, subtitle_hi, cta_label_en, cta_label_hi, is_visible, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(section_key) DO UPDATE SET
           title_en = excluded.title_en, title_hi = excluded.title_hi,
           subtitle_en = excluded.subtitle_en, subtitle_hi = excluded.subtitle_hi,
           cta_label_en = excluded.cta_label_en, cta_label_hi = excluded.cta_label_hi,
           is_visible = excluded.is_visible, sort_order = excluded.sort_order`
      );
      for (const s of payload.homepage_sections) {
        upsertSec.run(
          s.section_key,
          s.title_en || '',
          s.title_hi || '',
          s.subtitle_en || '',
          s.subtitle_hi || '',
          s.cta_label_en || '',
          s.cta_label_hi || '',
          s.is_visible ? 1 : 0,
          s.sort_order || 0
        );
      }
    }

    if (Array.isArray(payload.site_settings)) {
      const upsertSet = db.prepare(
        `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      );
      for (const st of payload.site_settings) {
        upsertSet.run(st.key, String(st.value ?? ''));
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: `Restore failed: ${(err as Error).message}` });
    return;
  }

  writeAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    action: 'BACKUP_RESTORED',
    entityType: 'backup',
    result: 'success',
    details: `Restored ${payload.categories.length} categories and ${payload.videos.length} videos`,
    ipAddress: req.ip || '',
  });

  res.json({ ok: true, restoredVideos: payload.videos.length, restoredCategories: payload.categories.length });
});

// Unknown API fallback
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ---------- VITE / STATIC FRONTEND ----------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ANIDOC 2D server listening on http://localhost:${PORT}`);
  });
}

startServer();
