const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

function resolveCorsOrigin() {
  const corsOrigin = (process.env.CORS_ORIGIN || '*').trim();

  if (corsOrigin === '*') {
    // Allow all origins by default for quick frontend integration.
    return true;
  }

  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const corsOptions = {
  origin: resolveCorsOrigin()
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Allow the server to read JSON and simple form data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/contact', contactRoutes);
app.use('/api/appointments', appointmentRoutes);

const frontendPath = path.join(__dirname, '..', 'hospital');
const dashboardPath = path.join(__dirname, '..', 'dashboard');

// Serve frontend files from the separate frontend folder.
app.use(express.static(frontendPath));
app.use('/dashboard', express.static(dashboardPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.redirect('/dashboard/index.html');
});

// Simple JSON 404 handler for unknown API routes.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.'
  });
});

// Generic error handler.
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.'
  });
});

async function startServer() {
  // Start listening only after MongoDB connects.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
