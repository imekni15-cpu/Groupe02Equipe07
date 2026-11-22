require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./src/config/db');
require('./src/config/firebase');

const shopRoutes = require('./src/routes/shopRoutes');
const offerRoutes = require('./src/routes/offerRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'CampusSave Backend is running successfully!' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusSave Personne 2 API' });
});

app.use('/api/shops', shopRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image size must not exceed 2 MB' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => console.log(`CampusSave server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Could not start API:', error.message);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;
