const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateAccessToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set. Auth features will not work.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/'
  });
};

const userResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  storageUsed: user.storageUsed,
  storageLimit: user.storageLimit,
  token
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Note: Input validation now done in middleware (validateRegister)
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const refreshToken = generateRefreshToken();
    const user = await User.create({
      name, email, password: hashedPassword, refreshToken
    });
    const token = generateAccessToken(user._id);
    setRefreshCookie(res, refreshToken);
    res.status(201).json(userResponse(user, token));
  } catch (error) {
    console.error('Register error:', error);
    if (error.errors) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateModifiedOnly: true });
    const token = generateAccessToken(user._id);
    setRefreshCookie(res, refreshToken);
    res.json(userResponse(user, token));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (!tokenFromCookie) {
      return res.status(401).json({ message: 'No refresh token' });
    }
    const user = await User.findOne({ refreshToken: tokenFromCookie });
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const newRefreshToken = generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save({ validateModifiedOnly: true });
    const accessToken = generateAccessToken(user._id);
    setRefreshCookie(res, newRefreshToken);
    res.json({ ...userResponse(user, accessToken), message: 'Token refreshed' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (tokenFromCookie) {
      await User.findOneAndUpdate({ refreshToken: tokenFromCookie }, { refreshToken: null });
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id, name: user.name, email: user.email,
      storageUsed: user.storageUsed, storageLimit: user.storageLimit,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (name) user.name = name;
    const updatedUser = await user.save({ validateModifiedOnly: true });
    res.json({
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshCookie(res, refreshToken);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link will be sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 30 * 60 * 1000;
    await user.save({ validateModifiedOnly: true });
    const resetLink = `${process.env.FRONTEND_URL || 'https://www.doczen.co.in'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    res.json({ 
      message: 'Password reset link has been sent to your email',
      resetLink
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({ email, resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    if (user.resetPasswordExpiry < Date.now()) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshCookie(res, refreshToken);
    res.json({ message: 'Password reset successfully', ...userResponse(user, generateAccessToken(user._id)) });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

