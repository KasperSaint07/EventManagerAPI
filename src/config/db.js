/**
 * MongoDB Database Connection
 * 
 * This file handles the connection to MongoDB using Mongoose.
 * MONGO_URI is read from environment variables.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from .env
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('Error: MONGO_URI is not defined in environment variables');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
