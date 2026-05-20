const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

router.get('/stats/daily', protect, async (req, res) => {
  try {
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

router.delete('/', protect, async (req, res) => {
  try {
    const historyEntries = await History.find({ user: req.user._id });

    const uploadsDir = path.join(__dirname, '../uploads');
    for (const entry of historyEntries) {
      if (entry.outputFiles && Array.isArray(entry.outputFiles)) {
        for (const file of entry.outputFiles) {
          if (file.path) {
            const filePath = path.isAbsolute(file.path) ? file.path : path.join(uploadsDir, file.path);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              console.error('Error deleting file:', filePath, err);
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
              console.error('Error deleting file:', filePath, err);
            }
          }
        }
      }
    }

    await History.deleteMany({ user: req.user._id });
    res.json({ message: 'History cleared' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await History.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');

    if (entry.outputFiles && Array.isArray(entry.outputFiles)) {
      for (const file of entry.outputFiles) {
        if (file.path) {
          const filePath = path.isAbsolute(file.path) ? file.path : path.join(uploadsDir, file.path);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error('Error deleting file:', filePath, err);
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
            console.error('Error deleting file:', filePath, err);
          }
        }
      }
    }

    await History.deleteOne({ _id: req.params.id, user: req.user._id });

    res.json({ message: 'History entry deleted' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
