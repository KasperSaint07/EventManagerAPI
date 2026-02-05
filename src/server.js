/**
 * Server Entry Point
 * 
 * This file starts the Express server and connects to MongoDB.
 * Environment variables are loaded from .env file.
 */

// Load environment variables (must be first)
require('dotenv').config();

const app = require('./app');

// ======================
// CONFIGURATION
// ======================

const PORT = process.env.PORT || 5000;

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
