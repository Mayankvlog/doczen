const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateAccessToken = (id) => {
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
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
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
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
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
    await user.save();
    const token = generateAccessToken(user._id);
    setRefreshCookie(res, refreshToken);
    res.json(userResponse(user, token));
  } catch (error) {
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
    await user.save();
    const accessToken = generateAccessToken(user._id);
    setRefreshCookie(res, newRefreshToken);
    res.json({ ...userResponse(user, accessToken), message: 'Token refreshed' });
  } catch (error) {
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
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
      message: 'Profile updated successfully'
    });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error' });
  }
};

