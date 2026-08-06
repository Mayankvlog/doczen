const mongoose = require('mongoose');

const RECONNECT_DELAY_MS = 30 * 1000;

let reconnectTimer = null;

// Logged for visibility; the real source of truth for health is
// mongoose.connection.readyState, so a stale flag can never mask a dead
// connection (which previously turned auth failures into opaque 500s).
const setDbConnected = (status) => {
  console.log('DB Connection Status updated:', status);
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (mongoose.connection.readyState === 1) return;
    const uri = process.env.MONGO_URI;
    if (!uri) return;
    try {
      if (mongoose.connection.readyState === 2) {
        await mongoose.connection.destroy().catch(() => {});
      }
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log('✓ MongoDB reconnected successfully');
    } catch (error) {
      console.error(`✗ MongoDB reconnect attempt failed: ${error.message}`);
      scheduleReconnect();
    }
  }, RECONNECT_DELAY_MS);
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established');
  clearReconnectTimer();
});
mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected');
  clearReconnectTimer();
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  setDbConnected(false);
  scheduleReconnect();
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
  setDbConnected(false);
});

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MongoDB URI not found. Check .env file has MONGO_URI set.');
    console.log('Server will continue without database. PDF tools will work without user features.');
    setDbConnected(false);
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('✓ MongoDB Connected successfully');
    setDbConnected(true);
  } catch (error) {
    console.error(`✗ MongoDB connection error: ${error.message}`);
    console.log('Server will continue without database. PDF tools will work without user features.');
    setDbConnected(false);
    scheduleReconnect();
  }
};

module.exports = connectDB;
module.exports.setDbConnected = setDbConnected;
module.exports.isDbConnected = isDbConnected;
