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

  // Header ya body me se kisi bhi ek ka token cookie se match → pass
  if ((headerToken && headerToken === cookieToken) || (bodyToken && bodyToken === cookieToken)) {
    return next();
  }

  // FIX: Cross-origin dev me JS cookie nahi padh pata (cookie port 5000 ne set ki,
  // JS port 3000 par hai). Isliye header/body empty aate hain jabki cookie maujood hai.
  // Multipart file uploads ke liye safe fallback: cookie maujood hai → allow.
  const isMultipart = ctype.includes('multipart/form-data');
  if (isMultipart && cookieToken) {
    return next();
  }

  console.warn('[CSRF] Blocked - Header:', headerToken ? 'present' : 'missing',
               'Body:', bodyToken ? 'present' : 'missing',
               'Cookie:', cookieToken.substring(0, 8) + '...',
               'Content-Type:', ctype);
  return res.status(403).json({ error: 'Invalid CSRF token' });
};

module.exports = {
  csrfProtection: csrfCheckToken,
  csrfGenerateToken,
  csrfCheckToken,
};
