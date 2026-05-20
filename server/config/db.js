const mongoose = require('mongoose');

let dbConnected = false;

const setDbConnected = (status) => {
  dbConnected = status;
  console.log('DB Connection Status updated:', status);
};

const isDbConnected = () => dbConnected;

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established');
  setDbConnected(true);
});
mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected');
  setDbConnected(true);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  setDbConnected(false);
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
    await mongoose.connect(uri);
    console.log('✓ MongoDB Connected successfully');
    setDbConnected(true);
  } catch (error) {
    console.error(`✗ MongoDB connection error: ${error.message}`);
    console.log('Server will continue without database. PDF tools will work without user features.');
    setDbConnected(false);
  }
};

module.exports = connectDB;
module.exports.setDbConnected = setDbConnected;
module.exports.isDbConnected = isDbConnected;
