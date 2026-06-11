/**
 * @fileoverview Express middleware for API rate limiting.
 * Configuration pulled from constants registry.
 * @module server/middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../utils/constants');
const AppError = require('../utils/AppError');

const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  handler: (req, res, next) => {
    const error = new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    next(error);
  }
});

module.exports = rateLimiter;
