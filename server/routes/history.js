const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { protect } = require('../middleware/auth');
const { isDbConnected } = require('../config/db');
const fs = require('fs');
const path = require('path');

router.get('/stats/daily', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected. Stats unavailable.' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count files processed today
    const todayCount = await History.countDocuments({
      user: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get total count for user
    const totalCount = await History.countDocuments({
      user: req.user._id
    });

    // Daily limit (free tier: 10 files/day, but showing 1000 as demo)
    const dailyLimit = 1000;
    const isLimitReached = todayCount >= dailyLimit;

    res.json({
      success: true,
      stats: {
        total: totalCount,
        isLimitReached: isLimitReached,
        percentageUsed: Math.round((todayCount / dailyLimit) * 100)
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected. History unavailable.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const history = await History.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await History.countDocuments({ user: req.user._id });
    const pages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      history: history || [],
      page,
      pages,
      total,
      limit
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected.' });
    }

    const entry = await History.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete all history entries for user
router.delete('/', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected. Cannot clear history.' });
    }

    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log('Starting clear all history for user:', req.user._id);

    // Find all entries first
    const historyEntries = await History.find({ user: req.user._id });

    if (!historyEntries || historyEntries.length === 0) {
      console.log('No history entries found for user:', req.user._id);
      const result = await History.deleteMany({ user: req.user._id });
      return res.json({
        success: true,
        message: 'History cleared successfully',
        deletedCount: 0,
        filesDeleted: 0
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    let totalFilesDeleted = 0;
    const fileDeletionErrors = [];

    // Delete files for each entry
    for (const entry of historyEntries) {
      if (entry.outputFiles && Array.isArray(entry.outputFiles)) {
        for (const file of entry.outputFiles) {
          if (file.path) {
            const filePath = path.isAbsolute(file.path) ? file.path : path.join(uploadsDir, file.path);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                totalFilesDeleted++;
                console.log('Deleted output file:', filePath);
              }
            } catch (err) {
              console.error('Error deleting output file:', filePath, err);
              fileDeletionErrors.push({ file: filePath, error: err.message });
            }
          }
        }
      }
      if (entry.inputFiles && Array.isArray(entry.inputFiles)) {
        for (const file of entry.inputFiles) {
          if (file.storedName) {
            const filePath = path.join(uploadsDir, file.storedName);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                totalFilesDeleted++;
                console.log('Deleted input file:', filePath);
              }
            } catch (err) {
              console.error('Error deleting input file:', filePath, err);
              fileDeletionErrors.push({ file: filePath, error: err.message });
            }
          }
        }
      }
    }

    // Delete all history records from database
    const result = await History.deleteMany({ user: req.user._id });
    console.log('Deleted history records:', result.deletedCount);

    res.json({
      success: true,
      message: 'History cleared successfully',
      deletedCount: result.deletedCount,
      filesDeleted: totalFilesDeleted,
      errors: fileDeletionErrors.length > 0 ? fileDeletionErrors : undefined
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete individual history entry by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected. Cannot delete.' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid history entry ID' });
    }

    const entry = await History.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'History entry not found' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const fileDeletionErrors = [];

    if (entry.outputFiles && Array.isArray(entry.outputFiles)) {
      for (const file of entry.outputFiles) {
        if (file.path) {
          const filePath = path.isAbsolute(file.path) ? file.path : path.join(uploadsDir, file.path);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            fileDeletionErrors.push(filePath);
          }
        }
      }
    }

    if (entry.inputFiles && Array.isArray(entry.inputFiles)) {
      for (const file of entry.inputFiles) {
        if (file.storedName) {
          const filePath = path.join(uploadsDir, file.storedName);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            fileDeletionErrors.push(filePath);
          }
        }
      }
    }

    const result = await History.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(500).json({ success: false, message: 'Failed to delete history entry from database' });
    }

    res.json({
      success: true,
      message: 'History entry deleted successfully',
      filesDeleted: (entry.outputFiles?.length || 0) + (entry.inputFiles?.length || 0),
      fileDeletionErrors: fileDeletionErrors.length > 0 ? fileDeletionErrors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
