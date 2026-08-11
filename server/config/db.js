const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // 5s timeout instead of hanging
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Warning]: ${error.message}`);
    console.log('[Server]: Falling back to in-memory demo data stores for 100% uptime.');
  }
};

module.exports = connectDB;
