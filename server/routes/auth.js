const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getProfile, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateChangePassword } = require('../middleware/validation');
// Auth routes are mounted BEFORE global CSRF middleware in server.js.
// CSRF protection is handled globally for non-auth routes.
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
