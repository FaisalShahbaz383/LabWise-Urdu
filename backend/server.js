const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_reports';

// Ensure uploads directory exists on boot
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Initialized uploads directory at: ${uploadDir}`);
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'LabWise Urdu API',
    status: 'online',
    version: '2.0.0',
    endpoints: {
      health: 'GET /api/reports/health',
      upload: 'POST /api/reports/upload',
      uploadsStatic: 'GET /uploads/:filename',
    },
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start the HTTP server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Allow server to run so health endpoints and non-DB diagnostic routes are accessible
    app.listen(PORT, () => {
      console.warn(`⚠️ Server listening on http://localhost:${PORT} (MongoDB disconnected: please check MONGO_URI in .env)`);
    });
  });

module.exports = app;
