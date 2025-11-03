const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  }
}
module.exports = { connectDB };