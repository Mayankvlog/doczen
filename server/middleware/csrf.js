const crypto = require('crypto');

const COOKIE_NAME = 'csrf_token';
const HEADER_NAME = 'x-csrf-token';

const generateToken = () => crypto.randomUUID();

const csrfGenerateToken = (req, res, next) => {
  // Only generate token if it doesn't already exist in cookies
  // This prevents token regeneration on every request
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return next();
  }
  
  const token = generateToken();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });
  next();
};

const csrfCheckToken = (req, res, next) => {
  // Allow safe methods without CSRF check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[COOKIE_NAME] : null;
  
  // Extract token from multiple possible header sources
  const headerToken = 
    req.headers[HEADER_NAME] || 
    req.headers['x-xsrf-token'] || 
    req.headers['xsrf-token'];

  // Extract token from body (for multipart forms)
  let bodyToken = null;
  if (req.body && typeof req.body === 'object') {
    bodyToken = req.body._csrf || req.body.csrf_token || req.body.token;
  }

  // Validate: at least one source must match the cookie
  const validHeader = headerToken && cookieToken && headerToken === cookieToken;
  const validBody = bodyToken && cookieToken && bodyToken === cookieToken;

  if (!cookieToken) {
    console.warn('[CSRF] No token in cookie');
    return res.status(403).json({ error: 'CSRF token missing from cookie' });
  }

  if (!validHeader && !validBody) {
    console.warn('[CSRF] Token mismatch - Header:', headerToken ? 'present' : 'missing', 
                'Body:', bodyToken ? 'present' : 'missing', 
                'Cookie:', cookieToken.substring(0, 8) + '...');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

module.exports = {
  csrfProtection: csrfCheckToken,
  csrfGenerateToken,
  csrfCheckToken,
};
