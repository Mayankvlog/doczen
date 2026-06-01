const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getProfile, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateChangePassword } = require('../middleware/validation');
const { csrfCheckToken } = require('../middleware/csrf');

// ✅ PHASE 0 FIX: Add input validation to all auth endpoints
router.post('/register', csrfCheckToken, validateRegister, register);
router.post('/login', csrfCheckToken, validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', csrfCheckToken, logout);
router.post('/forgot-password', csrfCheckToken, validateForgotPassword, forgotPassword);
router.post('/reset-password', csrfCheckToken, validateResetPassword, resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, csrfCheckToken, updateProfile);
router.put('/change-password', protect, csrfCheckToken, validateChangePassword, changePassword);

module.exports = router;
