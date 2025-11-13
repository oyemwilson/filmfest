// server.js
/**
 * Node.js backend with:
 *  - Content per-year (video/photos/awards/partners)
 *  - Cloudinary uploads
 *  - Admin login with email/password -> JWT
 *  - Backwards-compatible x-admin-key header
 *
 * ENV:
 *  MONGODB_URI
 *  PORT (default 5001)
 *  CLOUDINARY_CLOUD_NAME
 *  CLOUDINARY_API_KEY
 *  CLOUDINARY_API_SECRET
 *  ADMIN_KEY           <-- used to protect the /auth/register route
 *  JWT_SECRET          <-- used to sign JWTs
 *
 * Install additional deps:
 *  npm i bcryptjs jsonwebtoken
 *
 */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://filmfest-1.onrender.com", // ✅ your Render frontend URL
      "http://localhost:3000"                       // ✅ optional: for local development
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// lightweight request logger for debugging (keep)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Multer / upload error handler (catch MulterError, other upload errors)
function multerErrorHandler(err, req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: 'Multer error', error: err.message });
  }
  console.error('Upload error:', err);
  return res.status(500).json({ message: 'Upload/server error', error: err.message || err.toString() });
}
app.use(multerErrorHandler);


// --- ENV checks ---
const requiredEnv = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_KEY',
  'JWT_SECRET'
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Warning: env var ${key} is not set.`);
  }
}

// --- Cloudinary config ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage for images (photos & logos)
const imagesStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // prefer checking originalUrl (safer in many routing setups)
    const url = req.originalUrl || '';
    let folder = 'events/photos';
    if (url.includes('/partners')) folder = 'events/partners';
    if (url.includes('/awards')) folder = 'events/awards';
    return {
      folder,
      // don't force format to png — let Cloudinary keep original or convert when needed
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_').split('.')[0]}`,
    };
  },
});


// Multer storage for video files (optional)
const videosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'events/videos',
    resource_type: 'video',
  },
});

const uploadImages = multer({ storage: imagesStorage });
const uploadVideo = multer({ storage: videosStorage });

// --- DB models ---
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  public_id: String,
  caption: String,
});

const PersonWithPhotoSchema = new Schema({
  name: { type: String, required: true },
  position: { type: String },
  photo: { url: String, public_id: String },
});

const AwardCategorySchema = new Schema({
  category: { type: String, required: true },
  winner: PersonWithPhotoSchema,
  firstRunnerUp: PersonWithPhotoSchema,
  secondRunnerUp: PersonWithPhotoSchema,
});

const ContentSchema = new Schema({
  year: { type: Number, required: true, index: true },
  videoLink: { type: String },
  photos: [ImageSchema],
  awards: [AwardCategorySchema],
  partners: [ImageSchema],
}, { timestamps: true });

ContentSchema.index({ year: 1 }, { unique: true });

const Content = mongoose.model('Content', ContentSchema);

// Admin user schema
const AdminUserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' }, // could extend to editor/viewer etc.
}, { timestamps: true });

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

// --- Auth helpers & middleware ---

// Verify JWT and attach user to req.user
async function verifyJwtToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    const user = await AdminUser.findById(decoded.id).select('-passwordHash');
    return user || null;
  } catch (e) {
    return null;
  }
}

// Accept either Bearer token or x-admin-key for backward compatibility
async function authMiddleware(req, res, next) {
  // 1) Bearer token
  const authHeader = req.header('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await verifyJwtToken(token);
    if (user) {
      req.user = user; // attach user object
      return next();
    }
  }

  // 2) old-school x-admin-key header
  const key = req.header('x-admin-key');
  if (key && key === process.env.ADMIN_KEY) {
    // attach a pseudo-user for backward compatibility
    req.user = { email: 'x-admin-key', role: 'admin' };
    return next();
  }

  return res.status(401).json({ message: 'Unauthorized' });
}

// adminAuth just re-uses authMiddleware
const adminAuth = authMiddleware;

// --- Replace your current mongoose.connect(...) with this ---
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventdb';

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  Warning: MONGODB_URI not set. Using fallback to local Mongo:', MONGO_URI);
  }
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ Mongo connect err', err);
    throw err; // ensure startup aborts if DB can't connect
  }
}


// --- Utility: YouTube embed normalization ---
function toYouTubeEmbed(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      if (!id) return url;
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url;
      const vid = u.searchParams.get('v');
      if (vid) return `https://www.youtube.com/embed/${vid}`;
      const parts = u.pathname.split('/').filter(Boolean);
      const possible = parts.pop();
      if (possible) return `https://www.youtube.com/embed/${possible}`;
    }
  } catch (e) {
    const id = url.trim();
    if (/^[a-zA-Z0-9_-]{10,}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

// Helper: get or create content doc by year
async function getOrCreateContentByYear(year) {
  let doc = await Content.findOne({ year });
  if (!doc) {
    doc = new Content({ year, photos: [], awards: [], partners: [] });
    await doc.save();
  }
  return doc;
}

// Self-ping to prevent sleeping (Render free tier)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL; // Set this in Render env vars
if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(`${RENDER_URL}/api/health`);
      console.log('Keep-alive ping sent');
    } catch (err) {
      console.error('Keep-alive ping failed:', err.message);
    }
  }, 14 * 60 * 1000); // Every 14 minutes
}

// Request logger (helpful while testing)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Health route for uptime checks ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Add this route at the top of your routes:
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'FilmFest Server',
    timestamp: new Date().toISOString()
  });
});

// --- Auth routes ---

// Register admin (protected by x-admin-key)
app.post('/api/auth/register', async (req, res) => {
  try {
    // require bootstrap header ADMIN_KEY to create a user
    const key = req.header('x-admin-key');
    if (!key || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: 'Unauthorized: ADMIN_KEY required to register' });
    }
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const existing = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new AdminUser({ email: email.toLowerCase().trim(), passwordHash: hash });
    await user.save();
    const safeUser = { id: user._id, email: user.email, role: user.role };
    res.status(201).json({ user: safeUser, message: 'Admin user created' });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ message: err.message });
  }
});

// Login -> returns JWT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
    const safeUser = { id: user._id, email: user.email, role: user.role };
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: err.message });
  }
});

// Optional: get current user (requires auth)
app.get('/api/auth/me', adminAuth, async (req, res) => {
  try {
    // req.user is set by authMiddleware
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Content routes ---

// GET public: list all years (summary)
app.get('/api/content', async (req, res) => {
  try {
    const docs = await Content.find({}, { year: 1, createdAt: 1, updatedAt: 1 }).sort({ year: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET content by year (public)
app.get('/api/content/:year', async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create content for a year (admin)
app.post('/api/content/:year', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const exists = await Content.findOne({ year });
    if (exists) return res.status(400).json({ message: `Content for ${year} already exists` });
    const doc = new Content({ year, photos: [], awards: [], partners: [] });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Content for this year already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT update video link for a year (admin)
app.put('/api/content/:year/video', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const { videoLink } = req.body;
    if (!videoLink) return res.status(400).json({ message: 'videoLink is required' });
    const embed = toYouTubeEmbed(videoLink);
    const doc = await getOrCreateContentByYear(year);
    doc.videoLink = embed;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optional: upload an actual video file and save url (admin)
app.post('/api/content/:year/video-file', adminAuth, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'video file required' });
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const doc = await getOrCreateContentByYear(year);
    doc.videoLink = req.file.path;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEMP: memory-storage test route — use this to test uploads without Cloudinary
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/content/:year/photos/test', adminAuth, uploadMemory.array('photos', 10), async (req, res) => {
  try {
    console.log('--- TEST upload memory route ---');
    console.log('req.body:', req.body);
    console.log('req.files (count):', Array.isArray(req.files) ? req.files.length : typeof req.files);
    console.log('req.files sample:', (req.files || []).map(f => ({ originalname: f.originalname, size: f.size, mimetype: f.mimetype })));
    return res.json({ ok: true, files: (req.files || []).map(f => ({ originalname: f.originalname, size: f.size })) });
  } catch (err) {
    console.error('test upload error', err);
    return res.status(500).json({ message: 'test upload error', error: err.message || err.toString() });
  }
});


// Upload photos for a year (admin)
app.post('/api/content/:year/photos', adminAuth, uploadImages.array('photos', 50), async (req, res) => {
  try {
    console.log('--- photos route hit ---');
    console.log('req.body:', req.body);
    console.log('req.files (count):', Array.isArray(req.files) ? req.files.length : typeof req.files);
    console.log('req.files sample:', (req.files || []).map(f => ({ originalname: f.originalname, path: f.path, filename: f.filename || f.public_id, size: f.size })));

    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded (check field name & Content-Type)' });
    }

    const doc = await getOrCreateContentByYear(year);
    for (const f of files) {
      doc.photos.push({ url: f.path, public_id: f.filename || f.public_id, caption: req.body.caption || '' });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error('Photos upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
});


// ---------- helper: robust public_id extraction ----------
function extractPublicId(maybeIdOrUrl) {
  if (!maybeIdOrUrl) return null;
  // if the value looks like a direct public_id already
  if (!maybeIdOrUrl.startsWith('http') && !maybeIdOrUrl.includes('/')) {
    return maybeIdOrUrl;
  }
  // If it contains cloudinary path, try to extract the part after '/upload/' (or '/uploaded/')
  try {
    const u = new URL(maybeIdOrUrl);
    // path may include /<version>/folder/name.ext  -> we want folder/name (without extension & without version)
    const parts = u.pathname.split('/').filter(Boolean);
    // find index of 'upload' or 'uploads' - public id is after that and possibly after the version segment
    const uploadIdx = parts.findIndex(p => p === 'upload' || p === 'uploads');
    let candidateParts = parts;
    if (uploadIdx >= 0) candidateParts = parts.slice(uploadIdx + 1);
    // remove version if it looks like v12345
    if (candidateParts.length && /^v\d+$/.test(candidateParts[0])) candidateParts = candidateParts.slice(1);
    // join remaining parts and strip extension
    let joined = candidateParts.join('/');
    // remove file extension if present
    joined = joined.replace(/\.[a-zA-Z0-9]+$/, '');
    // if still empty, fallback to the last path segment without extension
    if (!joined) {
      const last = parts[parts.length - 1] || '';
      return last.replace(/\.[a-zA-Z0-9]+$/, '');
    }
    return joined;
  } catch (e) {
    // not a URL, maybe it's some other path — fallback: strip extension & return last segment
    const raw = maybeIdOrUrl;
    const last = raw.split('/').filter(Boolean).pop();
    return (last || raw).replace(/\.[a-zA-Z0-9]+$/, '');
  }
}

// ---------- improved delete photo ----------
app.delete('/api/content/:year/photos/:public_id(*)', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    const public_id_param = req.params.public_id;
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });

    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });

    // find matching photo item (try exact public_id match first, then try matching by url)
    const photo = doc.photos.find(p => (p.public_id && p.public_id === public_id_param) || (p.url && p.url.includes(public_id_param)));
    if (!photo) {
      // nothing to delete on cloudinary, but keep DB consistent by removing any photo with that public_id field
      doc.photos = doc.photos.filter(p => !(p.public_id === public_id_param || (p.url && p.url.includes(public_id_param))));
      await doc.save();
      return res.status(404).json({ message: 'Photo not found in DB; attempted to remove any partial matches' });
    }

    // determine what to send to cloudinary
    const candidate = photo.public_id || photo.filename || extractPublicId(photo.url) || public_id_param;
    console.log('Deleting photo - db entry:', { candidate, photo });

    try {
      const destroyResult = await cloudinary.uploader.destroy(candidate, { resource_type: 'image' });
      console.log('Cloudinary destroy result:', destroyResult);
    } catch (e) {
      console.warn('Cloudinary destroy threw:', e && e.message ? e.message : e);
    }

    // remove from DB
    doc.photos = doc.photos.filter(p => !(p.public_id === photo.public_id && photo.public_id) && p !== photo);
    // fallback: remove by url inclusion if public_id was not present
    if (doc.photos.some(p => p === photo)) {
      doc.photos = doc.photos.filter(p => !(p.url && photo.url && p.url === photo.url));
    }

    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error('Delete photo error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
});

// Awards: add/update (admin)
app.post('/api/content/:year/awards', adminAuth, uploadImages.single('photo'), async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const doc = await getOrCreateContentByYear(year);

    // Bulk awards array support (stringified JSON in form field 'awards')
    if (req.body.awards && Array.isArray(req.body.awards)) {
      doc.awards = req.body.awards;
      await doc.save();
      return res.json(doc);
    }
    if (req.body.awards && typeof req.body.awards === 'string') {
      try {
        const parsed = JSON.parse(req.body.awards);
        if (Array.isArray(parsed)) {
          doc.awards = parsed;
          await doc.save();
          return res.json(doc);
        }
      } catch (e) {}
    }

    const { category, role, name, photoUrl, public_id } = req.body;
    if (!category) return res.status(400).json({ message: 'category required' });
    if (!role || !['winner', 'firstRunnerUp', 'secondRunnerUp'].includes(role)) {
      return res.status(400).json({ message: 'role must be one of winner, firstRunnerUp, secondRunnerUp' });
    }
    let categoryDoc = doc.awards.find(a => a.category === category);
    if (!categoryDoc) {
      categoryDoc = { category };
      doc.awards.push(categoryDoc);
    }

    const person = { name, position: role };
    if (req.file) {
      person.photo = { url: req.file.path, public_id: req.file.filename || req.file.public_id };
    } else if (photoUrl && public_id) {
      person.photo = { url: photoUrl, public_id };
    }

    categoryDoc[role] = person;

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get awards for a year (public)
app.get('/api/content/:year/awards/:category', async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { category } = req.params;
    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });
    const cat = doc.awards.find(a => a.category === category);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete an award category for a year (admin)
// robust delete award photo (paste in server.js, restart server)
app.delete('/api/content/:year/awards/:category/:role/photo', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });
    const category = req.params.category || '';
    const role = req.params.role || '';
    if (!category) return res.status(400).json({ message: 'Category required' });
    if (!['winner','firstRunnerUp','secondRunnerUp'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });

    const cat = doc.awards.find(a => a.category === category);
    if (!cat) return res.status(404).json({ message: 'Award category not found' });

    const person = cat[role];
    if (!person) return res.status(404).json({ message: 'Role not set' });

    const photo = person.photo;
    if (photo && (photo.public_id || photo.filename || photo.url)) {
      // Build candidate variants to try
      const candidates = [];
      if (photo.public_id) candidates.push(photo.public_id);
      if (photo.filename) candidates.push(photo.filename);
      if (photo.url) {
        try {
          const u = new URL(photo.url);
          let parts = u.pathname.split('/').filter(Boolean);
          const uploadIdx = parts.findIndex(p => p === 'upload' || p === 'uploads');
          if (uploadIdx >= 0) parts = parts.slice(uploadIdx + 1);
          if (parts.length && /^v\d+$/.test(parts[0])) parts = parts.slice(1);
          const derived = parts.join('/').replace(/\.[a-zA-Z0-9]+$/, '');
          if (derived) candidates.push(derived);
        } catch (e) {
          const last = photo.url.split('/').pop();
          if (last) candidates.push(last.replace(/\.[a-zA-Z0-9]+$/, ''));
        }
      }

      // Deduplicate
      const tried = new Set();
      for (const c of candidates) {
        if (!c || tried.has(c)) continue;
        tried.add(c);
        try {
          console.log('Attempting Cloudinary destroy for:', c);
          const result = await cloudinary.uploader.destroy(c, { resource_type: 'image' });
          console.log('Cloudinary destroy result for', c, ':', result);
          // if destroy was successful or returned 'not found', continue — we still want to clear DB
          // if destroy returned error, it will have thrown and be caught below
        } catch (err) {
          console.warn('Cloudinary destroy threw for', c, err && err.message ? err.message : err);
        }
      }
    } else {
      console.log('No photo info found for award slot — nothing to destroy on cloudinary');
    }

    // Remove photo object entirely from the role
    if (cat[role]) {
      const preserved = { ...cat[role] };
      delete preserved.photo;
      cat[role] = preserved;
    }

    // OPTIONAL: remove any duplicate image from doc.photos that points to same url or public_id
    if (photo) {
      doc.photos = doc.photos.filter(p => {
        // keep p if it doesn't match this photo's url/public_id
        const samePublicId = photo.public_id && p.public_id && p.public_id === photo.public_id;
        const sameFilename = photo.filename && p.public_id && p.public_id === photo.filename;
        const sameUrl = photo.url && p.url && p.url === photo.url;
        return !(samePublicId || sameFilename || sameUrl);
      });
    }

    await doc.save();
    console.log('Award photo removed in DB for', category, role);
    return res.json(doc);
  } catch (err) {
    console.error('Delete award photo error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});
// DELETE full award category (admin)
app.delete('/api/content/:year/awards/:category(*)', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });

    const category = req.params.category || '';
    if (!category) return res.status(400).json({ message: 'Category required' });

    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });

    // find category
    const cat = doc.awards.find(a => a.category === category);
    if (!cat) return res.status(404).json({ message: 'Award category not found' });

    // gather photos to delete from cloudinary
    const people = [cat.winner, cat.firstRunnerUp, cat.secondRunnerUp].filter(Boolean);
    for (const p of people) {
      const photo = p.photo;
      if (!photo) continue;

      // attempt various candidates (public_id, filename or extract from URL)
      const candidates = [];
      if (photo.public_id) candidates.push(photo.public_id);
      if (photo.filename) candidates.push(photo.filename);
      if (photo.url) {
        try {
          const u = new URL(photo.url);
          let parts = u.pathname.split('/').filter(Boolean);
          const uploadIdx = parts.findIndex(x => x === 'upload' || x === 'uploads');
          if (uploadIdx >= 0) parts = parts.slice(uploadIdx + 1);
          if (parts.length && /^v\d+$/.test(parts[0])) parts = parts.slice(1);
          const derived = parts.join('/').replace(/\.[a-zA-Z0-9]+$/, '');
          if (derived) candidates.push(derived);
        } catch (e) {
          const last = (photo.url || '').split('/').pop();
          if (last) candidates.push(last.replace(/\.[a-zA-Z0-9]+$/, ''));
        }
      }

      // try destroy candidates (ignore errors)
      for (const c of [...new Set(candidates)]) {
        if (!c) continue;
        try {
          console.log('Attempting Cloudinary destroy for:', c);
          const r = await cloudinary.uploader.destroy(c, { resource_type: 'image' });
          console.log('Cloudinary destroy result for', c, ':', r);
        } catch (err) {
          console.warn('Cloudinary destroy threw for', c, err && err.message ? err.message : err);
        }
      }
    }

    // Remove category from DB
    doc.awards = doc.awards.filter(a => a.category !== category);

    // Also remove any top-level doc.photos that point to these same photos (best-effort)
    const photoUrlsOrIds = people
      .map(p => p.photo)
      .filter(Boolean)
      .flatMap(photo => [photo.public_id, photo.filename, photo.url].filter(Boolean));
    if (photoUrlsOrIds.length) {
      doc.photos = doc.photos.filter(p => {
        return !photoUrlsOrIds.some(idOrUrl => (idOrUrl && (p.public_id === idOrUrl || p.url === idOrUrl || (p.url && p.url.includes(idOrUrl)))));
      });
    }

    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error('Delete award category error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});




// Partners: upload logos for a year (admin)
app.post('/api/content/:year/partners', adminAuth, uploadImages.array('logos', 50), async (req, res) => {
  try {
    console.log('--- partners route hit ---');
    console.log('req.body:', req.body);
    console.log('req.files (count):', Array.isArray(req.files) ? req.files.length : typeof req.files);
    console.log('req.files sample:', (req.files || []).map(f => ({ originalname: f.originalname, path: f.path, filename: f.filename || f.public_id, size: f.size })));

    const year = Number(req.params.year);
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'No logos uploaded' });

    const doc = await getOrCreateContentByYear(year);
    for (const f of files) {
      doc.partners.push({ url: f.path, public_id: f.filename || f.public_id });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error('Partners upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
});


// Delete partner logo by public_id for a year (admin)
app.delete('/api/content/:year/partners/:public_id(*)', adminAuth, async (req, res) => {
  try {
    const year = Number(req.params.year);
    const public_id_param = req.params.public_id;
    if (Number.isNaN(year)) return res.status(400).json({ message: 'Invalid year' });

    const doc = await Content.findOne({ year });
    if (!doc) return res.status(404).json({ message: `Content for ${year} not found` });

    const partner = doc.partners.find(p => (p.public_id && p.public_id === public_id_param) || (p.url && p.url.includes(public_id_param)));
    if (!partner) {
      doc.partners = doc.partners.filter(p => !(p.public_id === public_id_param || (p.url && p.url.includes(public_id_param))));
      await doc.save();
      return res.status(404).json({ message: 'Partner not found in DB; attempted to remove any partial matches' });
    }

    const candidate = partner.public_id || partner.filename || extractPublicId(partner.url) || public_id_param;
    console.log('Deleting partner - db entry:', { candidate, partner });

    try {
      const destroyResult = await cloudinary.uploader.destroy(candidate, { resource_type: 'image' });
      console.log('Cloudinary destroy result:', destroyResult);
    } catch (e) {
      console.warn('Cloudinary destroy threw:', e && e.message ? e.message : e);
    }

    doc.partners = doc.partners.filter(p => p !== partner && !(p.public_id && p.public_id === partner.public_id));
    if (doc.partners.some(p => p === partner)) {
      doc.partners = doc.partners.filter(p => !(p.url && partner.url && p.url === partner.url));
    }

    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error('Delete partner error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
});

// Reset (dangerous) - admin: deletes all content documents
app.post('/api/content/reset', adminAuth, async (req, res) => {
  try {
    await Content.deleteMany({});
    res.json({ message: 'All content deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
// --- Start server only after DB connects ---
const PORT = process.env.PORT || 5001;
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}\nhttp://localhost:${PORT}/api/content`);
    });
  } catch (err) {
    console.error('Server startup aborted due to DB error', err);
    process.exit(1);
  }
})();


module.exports = app;
