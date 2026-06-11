/**
 * @fileoverview Route handler for managing sustainability challenges.
 * @module server/routes/challenges
 */

const express = require('express');
const router = express.Router();
const { getWeeklyChallenge, evaluateChallenge } = require('../engines/challengeEngine');
const { CHALLENGE_DURATION_DAYS } = require('../utils/constants');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * GET /api/challenges/current
 * Retrieves the current personalized challenge for a student.
 */
router.get('/current', (req, res, next) => {
  try {
    logger.info('Retrieving current weekly challenge', { query: req.query });

    let profile = {};
    let history = null;

    if (req.query.profile) {
      try {
        profile = JSON.parse(req.query.profile);
      } catch (err) {
        throw new AppError('Invalid JSON structure in profile query parameter', 400, 'INVALID_JSON');
      }
    }

    if (req.query.history) {
      try {
        history = JSON.parse(req.query.history);
      } catch (err) {
        throw new AppError('Invalid JSON structure in history query parameter', 400, 'INVALID_JSON');
      }
    }

    const { challenge, reasoning } = getWeeklyChallenge(profile, history);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + CHALLENGE_DURATION_DAYS);

    res.status(200).json({
      challenge,
      reasoning,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      targetKgSaved: challenge.targetKgSaved
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challenges/evaluate
 * Evaluates a completed/failed challenge and suggests the next variant.
 */
router.post('/evaluate', (req, res, next) => {
  try {
    logger.info('Evaluating challenge performance', { body: req.body });

    const { challengeId, completed } = req.body;

    if (typeof challengeId !== 'string' || typeof completed !== 'boolean') {
      throw new AppError('challengeId (string) and completed (boolean) are required', 400, 'INVALID_EVALUATION_REQUEST');
    }

    const evalResult = evaluateChallenge(challengeId, completed);

    res.status(200).json({
      result: completed ? 'completed' : 'failed',
      nextChallenge: evalResult.next,
      message: evalResult.message,
      savingsAchieved: evalResult.savingsAchieved || 0
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
