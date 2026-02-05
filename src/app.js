/**
 * Express Application Configuration
 * 
 * This file sets up the Express app with middleware and routes.
 * Business logic and routes will be added in future milestones.
 */

const express = require('express');

// Initialize Express app
const app = express();

// ======================
// MIDDLEWARE
// ======================

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ======================
// ROUTES
// ======================

// Health check endpoint - verifies the server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ======================
// 404 HANDLER
// ======================

// Handle requests to undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
