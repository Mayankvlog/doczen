const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// ✅ PHASE 0 FIX: CSRF protection middleware

// CSRF protection using cookies
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/'
  }
});

// Middleware to generate CSRF token for GET requests (forms, etc)
const csrfGenerateToken = (req, res, next) => {
  // Store token in request for use in responses
  req.csrfToken = () => csrf.createToken(req, res);
  next();
};

// Middleware to check CSRF token for mutating operations
const csrfCheckToken = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/'
  }
});

module.exports = {
  csrfProtection,
  csrfGenerateToken,
  csrfCheckToken
};
