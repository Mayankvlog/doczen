const mongoose = require('mongoose');

let dbConnected = false;

const setDbConnected = (status) => {
  dbConnected = status;
  console.log('DB Connection Status updated:', status);
};

const isDbConnected = () => dbConnected;

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
