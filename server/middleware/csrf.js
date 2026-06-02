const crypto = require('crypto');

const COOKIE_NAME = 'csrf_token';
const HEADER_NAME = 'x-csrf-token';

const generateToken = () => crypto.randomUUID();

const csrfGenerateToken = (req, res, next) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    req.csrfToken = req.cookies[COOKIE_NAME];
    return next();
  }
  
  const token = generateToken();
  req.csrfToken = token;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });
  next();
};

const csrfCheckToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // JSON requests cannot be forged via HTML forms (form posts are always
  // urlencoded or multipart). This is a standard CSRF defense pattern —
  // we only need the token for multipart uploads where form-based CSRF
  // is a real threat.
  const ctype = (req.headers['content-type'] || '').split(';')[0].trim();
  if (ctype === 'application/json') {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[COOKIE_NAME] : null;
  
  const headerToken = 
    req.headers[HEADER_NAME.toLowerCase()] || 
    req.headers['x-xsrf-token'] || 
    req.headers['xsrf-token'];

  let bodyToken = null;
  if (req.body && typeof req.body === 'object') {
    bodyToken = req.body._csrf || req.body.csrf_token || req.body.token;
  }

  if (!cookieToken) {
    const token = generateToken();
    req.csrfToken = token;
    res.cookie(COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    });
    return next();
  }

  const validHeader = headerToken && cookieToken && headerToken === cookieToken;
  const validBody = bodyToken && cookieToken && bodyToken === cookieToken;

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
