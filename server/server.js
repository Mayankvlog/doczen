const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const envPath = path.join(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error || !process.env.MONGO_URI) {
  const localEnv = path.join(__dirname, '.env');
  dotenv.config({ path: localEnv });
}
if (!process.env.MONGO_URI) {
  console.warn('WARNING: MONGO_URI not found in .env. Create a .env file with MONGO_URI=mongodb+srv://...');
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

const app = express();

// CORS configuration for Cloudflare + HTTPS
const corsOptions = {
  origin: process.env.FRONTEND_URL || [
    'https://doczen.co.in',
    'https://www.doczen.co.in',
    'https://doczen.co.in:443',
    'https://www.doczen.co.in:443'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'CF-Connecting-IP', 'Cache-Control', 'Pragma', 'Expires', 'Surrogate-Control'],
  exposedHeaders: ['X-Total-Count', 'X-Current-Page', 'Content-Disposition']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Trust Cloudflare proxy - CRITICAL for SSL
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

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

// Security middleware
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
  
  // Add comprehensive security headers to prevent tracking and fingerprinting issues
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), sync-xhr=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.highperformanceformat.com https://zoologyfibre.com https://workdeadlinededicate.com; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.highperformanceformat.com https://zoologyfibre.com https://workdeadlinededicate.com https://protrafficinspector.com https://doczen.co.in https://www.doczen.co.in wss://doczen.co.in wss://www.doczen.co.in; frame-src 'self' https://www.highperformanceformat.com https://zoologyfibre.com https://workdeadlinededicate.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';");
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
  // Check for SSL certificates
  const certPath = '/etc/letsencrypt/live/doczen.co.in/fullchain.pem';
  const keyPath = '/etc/letsencrypt/live/doczen.co.in/privkey.pem';
  const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

  if (hasCerts && process.env.NODE_ENV === 'production') {
    // HTTPS server
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1
    };
    https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
      console.log(`âœ“ Doczen HTTPS server running on https://${HOST}:${PORT}`);
      console.log(`âœ“ SSL certificates loaded from ${certPath}`);
    });
  } else {
    // HTTP server (development or missing certs)
    app.listen(PORT, HOST, () => {
      if (hasCerts) {
        console.log(`âœ“ Doczen HTTP server running on http://${HOST}:${PORT} (SSL available, NODE_ENV not set to production)`);
      } else {
        console.log(`âš  Doczen HTTP server running on http://${HOST}:${PORT} (SSL certificates not found)`);
        console.log(`âš  For production, place SSL certificates at:`);
        console.log(`  - Cert: ${certPath}`);
        console.log(`  - Key: ${keyPath}`);
      }
    });
  }
}).catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

module.exports = app;


