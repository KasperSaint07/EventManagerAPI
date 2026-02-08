/**
 * Express Application Configuration
 * 
 * This file sets up the Express app with middleware and routes.
 */

const express = require('express');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();

// MIDDLEWARE
// Parse JSON req
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ROUTES

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (register, login)
app.use('/api/auth', authRoutes);


// Handle requests to undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
