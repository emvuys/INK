require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');

const enrollRoute = require('./routes/enroll');
const verifyRoute = require('./routes/verify');
const retrieveRoute = require('./routes/retrieve');
const jwksRoute = require('./routes/jwks');

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting - 100 requests per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.use('/enroll', enrollRoute);
app.use('/verify', verifyRoute);
app.use('/retrieve', retrieveRoute);
app.use('/.well-known', jwksRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await testConnection();
  } catch (error) {
    console.error('Database connection test failed, continuing anyway...');
  }
  
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

