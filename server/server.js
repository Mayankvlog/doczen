// Global crash handlers — server must NEVER die silently
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (keeping server alive):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION (keeping server alive):', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const envPath = path.join(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error || !process.env.MONGO_URI) {
  const localEnv = path.join(__dirname, '.env');
  dotenv.config({ path: localEnv });
}
if (!process.env.MONGO_URI) {
  console.warn('WARNING: MONGO_URI not found in .env. Create a .env file with MONGO_URI=mongodb+srv://...');
}
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not found in .env. Auth features (login, register, profile) will fail with 500.');
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Periodic cleanup of files older than 24 hours
const cleanupOldFiles = () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > ONE_DAY) {
          fs.unlinkSync(filePath);
        }
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
};
cleanupOldFiles();
setInterval(cleanupOldFiles, 60 * 60 * 1000);

const connectDB = require('./config/db');
const { isDbConnected } = require('./config/db');

const app = express();

// CORS configuration - dynamic origin validation
const ALLOWED_ORIGINS = new Set([
  'https://doczen.co.in',
  'https://www.doczen.co.in',
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.has(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'CF-Connecting-IP', 'Cache-Control', 'Pragma', 'Expires', 'Surrogate-Control'],
  exposedHeaders: ['X-Total-Count', 'X-Current-Page', 'Content-Disposition']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ PHASE 1 FIX: Add compression middleware for gzip (30-40% smaller transfers)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024 // Only compress responses larger than 1KB
}));

// ✅ PHASE 0 FIX: Apply helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // We set custom CSP below
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ✅ PHASE 0 FIX: Rate limiting middleware - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts from this IP, please try again after an hour'
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests, please try again after an hour'
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Apply separate rate limiters to auth endpoints
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/reset-password', forgotPasswordLimiter);

// Trust Cloudflare proxy - CRITICAL for SSL.
// IMPORTANT: Express does NOT support comma-separated CIDR strings.
// Use number (1 = trust first proxy), boolean (true), or array of IPs/CIDRs.
try {
  app.set('trust proxy', 1);
} catch (_) {
  // Never crash on bad trust proxy value
  app.set('trust proxy', true);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CSRF token generation - sets a non-httpOnly cookie for client to read
// MUST come after cookie-parser so it can check if token already exists
const { csrfGenerateToken } = require('./middleware/csrf');
app.use(csrfGenerateToken);

// Cookie settings middleware - Fix cookie domain and SameSite issues
app.use((req, res, next) => {
  const originalCookie = res.cookie;
  res.cookie = function(name, value, options = {}) {
    options.httpOnly = options.httpOnly !== false;
    options.secure = process.env.NODE_ENV === 'production';
    options.sameSite = options.sameSite || (process.env.NODE_ENV === 'production' ? 'Lax' : 'Lax');
    // Never set an explicit domain - let the browser use the current host
    // This prevents "invalid domain" rejection by browsers like Firefox
    delete options.domain;
    // Path defaults to root
    options.path = options.path || '/';
    return originalCookie.call(this, name, value, options);
  };
  next();
});

// Security middleware - PHASE 0 CRITICAL FIX
app.use((req, res, next) => {
  // Prevent server from being accessed via unexpected hostnames (anti-DNS-rebinding)
  const allowedHostSuffixes = ['doczen.co.in', 'localhost', '127.0.0.1'];
  const host = req.hostname || '';
  if (host && !allowedHostSuffixes.some(suffix => host === suffix || host.endsWith('.' + suffix))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Ensure HTTPS (except for health checks)
  if (req.path !== '/api/health' && !req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.status(426).json({ error: 'HTTPS required' });
  }
  
  // ✅ SECURITY HEADERS - NOW ENABLED (P0 CRITICAL FIX)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), sync-xhr=()');
  
  // HSTS - Enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CSP - ONLY safe sources (NO malvertising, NO unsafe-inline for scripts)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'nonce-doczen'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' https: data: blob:; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "connect-src 'self' https: wss: https://www.google-analytics.com https://www.googletagmanager.com; " +
    "frame-src 'self' https:; " +
    "worker-src 'self' blob:; " +
    "media-src 'self' https: blob:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests;"
  );
  
  next();
});

// SEO: robots.txt middleware - Guides crawlers to sitemap and allows all tools to be crawled
app.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /merge-pdf
Allow: /split-pdf
Allow: /compress-pdf
Allow: /rotate-pdf
Allow: /protect-pdf
Allow: /unlock-pdf
Allow: /add-page-numbers
Allow: /add-watermark
Allow: /extract-text
Allow: /reorder-pages
Allow: /delete-pages
Allow: /pdf-to-jpg
Allow: /jpg-to-pdf
Allow: /pdf-to-txt
Allow: /pdf-to-word
Allow: /word-to-pdf
Allow: /pdf-to-ppt
Allow: /ppt-to-pdf
Allow: /pdf-to-excel
Allow: /excel-to-pdf
Allow: /edit-pdf
Allow: /sign-pdf
Allow: /repair-pdf
Allow: /pdf-to-pdfa
Allow: /pdf-metadata
Allow: /flatten-pdf
Allow: /html-to-pdf
Allow: /redact-pdf
Allow: /remove-annotations
Allow: /remove-watermark
Allow: /compare-pdf
Allow: /about
Allow: /privacy-policy
Allow: /terms-of-service
Allow: /login
Allow: /register
Allow: /forgot-password
Allow: /reset-password
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Sitemap: https://www.doczen.co.in/sitemap.xml
Crawl-delay: 1`;
  res.type('text/plain').send(robotsTxt);
});

// SEO: sitemap.xml middleware - Dynamic XML sitemap for all tool pages
app.get('/sitemap.xml', (req, res) => {
  const tools = [
    { path: '/merge-pdf', priority: '0.9' },
    { path: '/split-pdf', priority: '0.9' },
    { path: '/compress-pdf', priority: '0.9' },
    { path: '/rotate-pdf', priority: '0.8' },
    { path: '/protect-pdf', priority: '0.8' },
    { path: '/unlock-pdf', priority: '0.8' },
    { path: '/add-page-numbers', priority: '0.7' },
    { path: '/add-watermark', priority: '0.7' },
    { path: '/extract-text', priority: '0.8' },
    { path: '/reorder-pages', priority: '0.7' },
    { path: '/delete-pages', priority: '0.7' },
    { path: '/pdf-to-jpg', priority: '0.9' },
    { path: '/jpg-to-pdf', priority: '0.9' },
    { path: '/pdf-to-txt', priority: '0.8' },
    { path: '/pdf-to-word', priority: '0.9' },
    { path: '/word-to-pdf', priority: '0.9' },
    { path: '/pdf-to-ppt', priority: '0.8' },
    { path: '/ppt-to-pdf', priority: '0.8' },
    { path: '/pdf-to-excel', priority: '0.8' },
    { path: '/excel-to-pdf', priority: '0.8' },
    { path: '/edit-pdf', priority: '0.8' },
    { path: '/sign-pdf', priority: '0.7' },
    { path: '/repair-pdf', priority: '0.7' },
    { path: '/pdf-to-pdfa', priority: '0.6' },
    { path: '/pdf-metadata', priority: '0.6' },
    { path: '/flatten-pdf', priority: '0.6' },
    { path: '/html-to-pdf', priority: '0.8' },
    { path: '/redact-pdf', priority: '0.7' },
    { path: '/remove-annotations', priority: '0.6' },
    { path: '/remove-watermark', priority: '0.6' },
    { path: '/compare-pdf', priority: '0.6' },
  ];

  const baseUrl = 'https://www.doczen.co.in';
  const today = new Date().toISOString().split('T')[0];
  
  let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  sitemapXml += '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';
  
  // Home page - highest priority
  sitemapXml += '  <url>\n';
  sitemapXml += `    <loc>${baseUrl}/</loc>\n`;
  sitemapXml += `    <lastmod>${today}</lastmod>\n`;
  sitemapXml += '    <changefreq>weekly</changefreq>\n';
  sitemapXml += '    <priority>1.0</priority>\n';
  sitemapXml += '    <mobile:mobile/>\n';
  sitemapXml += '  </url>\n';

  // All tool pages
  tools.forEach(tool => {
    sitemapXml += '  <url>\n';
    sitemapXml += `    <loc>${baseUrl}${tool.path}</loc>\n`;
    sitemapXml += `    <lastmod>${today}</lastmod>\n`;
    sitemapXml += '    <changefreq>monthly</changefreq>\n';
    sitemapXml += `    <priority>${tool.priority}</priority>\n`;
    sitemapXml += '    <mobile:mobile/>\n';
    sitemapXml += '  </url>\n';
  });

  // Static pages
  const staticPages = [
    { path: '/about', priority: '0.6' },
    { path: '/privacy-policy', priority: '0.5' },
    { path: '/terms-of-service', priority: '0.5' },
    { path: '/login', priority: '0.4' },
    { path: '/register', priority: '0.4' },
    { path: '/forgot-password', priority: '0.3' },
    { path: '/reset-password', priority: '0.3' },
  ];
  
  staticPages.forEach(page => {
    sitemapXml += '  <url>\n';
    sitemapXml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    sitemapXml += `    <lastmod>${today}</lastmod>\n`;
    sitemapXml += '    <changefreq>yearly</changefreq>\n';
    sitemapXml += `    <priority>${page.priority}</priority>\n`;
    sitemapXml += '  </url>\n';
  });

  sitemapXml += '</urlset>';
  
  res.type('application/xml').send(sitemapXml);
});

// DB-health middleware — return 503 immediately instead of hanging when MongoDB is down
app.use('/api/auth', (req, res, next) => {
  const { isDbConnected } = require('./config/db');
  if (!isDbConnected()) {
    return res.status(503).json({ message: 'Service temporarily unavailable. Database connection is required for authentication.' });
  }
  next();
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/history', require('./routes/history'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), protocol: req.protocol });
});

const clientBuild = path.join(__dirname, '../client/build');
const hasClientBuild = fs.existsSync(path.join(clientBuild, 'index.html'));
if (hasClientBuild) {
  app.use(express.static(clientBuild));
}

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  if (hasClientBuild) {
    res.sendFile(path.join(clientBuild, 'index.html'));
  } else {
    res.status(200).json({ message: 'Doczen API server is running. Frontend not built yet. Run: cd client && npm run build' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof URIError) {
    return res.status(400).json({ message: 'Invalid URL encoding' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 50MB' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field. Please check the field name.' });
  }
  if (err.code === 'LIMIT_FIELD_COUNT' || err.code === 'LIMIT_FIELD_KEY' || err.code === 'LIMIT_FIELD_VALUE') {
    return res.status(400).json({ message: 'Too many form fields or invalid form data.' });
  }
  if (err.code === 'LIMIT_PART_COUNT') {
    return res.status(400).json({ message: 'Too many multipart parts.' });
  }
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

connectDB().then(() => {
  if (!isDbConnected() && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Database connection failed in production mode.');
    console.error('Auth features (login, register) will not work.');
  }
  startServer();
}).catch((err) => {
  console.error('Database connection failed:', err);
});

function startServer() {
  // Nginx handles SSL termination — Node.js always runs HTTP
  // HTTPS mode is only attempted in dev when no reverse proxy is present
  const certPath = '/etc/letsencrypt/live/doczen.co.in/fullchain.pem';
  const keyPath = '/etc/letsencrypt/live/doczen.co.in/privkey.pem';
  const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

  if (hasCerts && process.env.NODE_ENV === 'production') {
    try {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
      };
      https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
        console.log(`✓ Doczen HTTPS server running on https://${HOST}:${PORT}`);
      });
      return;
    } catch (err) {
      // Cert read failed (permissions etc.) — fall through to HTTP
      // Nginx handles SSL anyway, so HTTP is fine
    }
  }
  app.listen(PORT, HOST, () => {
    console.log(`✓ Doczen HTTP server running on http://${HOST}:${PORT} (nginx terminates SSL in production)`);
  });
}

module.exports = app;


