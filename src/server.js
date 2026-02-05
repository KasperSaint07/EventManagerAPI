/**
 * Server Entry Point
 * 
 * This file starts the Express server and connects to MongoDB.
 * Environment variables are loaded from .env file.
 */

// Load environment variables (must be first)
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// ======================
// CONFIGURATION
// ======================

const PORT = process.env.PORT || 5000;

// ======================
// START SERVER
// ======================

/**
 * Initialize the server
 * 1. Connect to MongoDB
 * 2. Start Express server
 */
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start listening for requests
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
};

// Start the server
startServer();
