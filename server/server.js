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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'CF-Connecting-IP'],
  exposedHeaders: ['X-Total-Count', 'X-Current-Page']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Trust Cloudflare proxy - CRITICAL for SSL
const cloudflareIPs = (process.env.CLOUDFLARE_IPS || '103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/12,108.162.192.0/18,131.0.72.0/22,141.101.64.0/18,162.158.0.0/15,172.64.0.0/13,173.245.48.0/20,188.114.96.0/20,190.93.240.0/20,197.234.240.0/22,198.41.128.0/17').split(',');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal', '127.0.0.1', '::1', ...cloudflareIPs]);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Security middleware
app.use((req, res, next) => {
  // Ensure HTTPS (except for health checks)
  if (req.path !== '/api/health' && !req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.status(426).json({ error: 'HTTPS required' });
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
      console.log(`✓ Doczen HTTPS server running on https://${HOST}:${PORT}`);
      console.log(`✓ SSL certificates loaded from ${certPath}`);
    });
  } else {
    // HTTP server (development or missing certs)
    app.listen(PORT, HOST, () => {
      if (hasCerts) {
        console.log(`✓ Doczen HTTP server running on http://${HOST}:${PORT} (SSL available, NODE_ENV not set to production)`);
      } else {
        console.log(`⚠ Doczen HTTP server running on http://${HOST}:${PORT} (SSL certificates not found)`);
        console.log(`⚠ For production, place SSL certificates at:`);
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
