if(process.env.NODE_ENV!=='production') require('dotenv').config()

/**
 * @fileoverview Main entry point of the CarbonSaathi AI application.
 * Defines Express app, loads middlewares, and mounts API routes.
 * @module server/index
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const calculateRouter = require('./routes/calculate');
const insightsRouter = require('./routes/insights');
const challengesRouter = require('./routes/challenges');
const simulatorRouter = require('./routes/simulator');
const onboardingRouter = require('./routes/onboarding');

const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));
app.use(compression());

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));

app.use('/api', rateLimiter);

app.use('/api/calculate', calculateRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/onboarding', onboardingRouter);

/**
 * Health check endpoint.
 * GET /health
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'carbon-saathi',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route to serve the SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler (4 params)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.message || 'Unhandled error', { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  let message = err.message;
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'An unexpected error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    error: true,
    message,
    code,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`CarbonSaathi AI server running on port ${PORT}`);
  });
}

module.exports = app;
