/**
 * @fileoverview Onboarding route to register student profile and compute baseline footprints.
 * @module server/routes/onboarding
 */

const express = require('express');
const router = express.Router();
const { validateOnboarding } = require('../utils/validators');
const { BASELINE_FACTORS } = require('../utils/constants');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const tipsDatabase = require('../data/tipsDatabase');

/**
 * POST /api/onboarding
 * Process onboarding details and calculate student baseline.
 */
router.post('/', (req, res, next) => {
  try {
    logger.info('Processing onboarding request', { body: req.body });

    const validation = validateOnboarding(req.body);
    if (!validation.valid) {
      throw new AppError(validation.error, 400, 'INVALID_ONBOARDING_DATA');
    }

    const { profile } = validation;

    // Calculate baseline score from profile options
    let baselineKgPerDay = 0;
    if (Object.prototype.hasOwnProperty.call(BASELINE_FACTORS.commute, profile.commute)) {
      baselineKgPerDay += BASELINE_FACTORS.commute[profile.commute];
    }
    if (Object.prototype.hasOwnProperty.call(BASELINE_FACTORS.diet, profile.diet)) {
      baselineKgPerDay += BASELINE_FACTORS.diet[profile.diet];
    }
    if (Object.prototype.hasOwnProperty.call(BASELINE_FACTORS.acUsage, profile.acUsage)) {
      baselineKgPerDay += BASELINE_FACTORS.acUsage[profile.acUsage];
    }

    // Round baseline emissions to 2 decimal places
    baselineKgPerDay = parseFloat(baselineKgPerDay.toFixed(2));

    // Select personalized tips based on the student's highest impact area
    let personalizedTip = 'Try to switch off chargers when leaving your room to save energy.';
    if (profile.commute === 'scooter' || profile.commute === 'car') {
      const travelTip = tipsDatabase.find(t => t.category === 'travel');
      if (travelTip) personalizedTip = travelTip.tip;
    } else if (profile.diet.startsWith('nonveg')) {
      const foodTip = tipsDatabase.find(t => t.category === 'food');
      if (foodTip) personalizedTip = foodTip.tip;
    } else if (profile.acUsage === 'always' || profile.acUsage === 'often') {
      const energyTip = tipsDatabase.find(t => t.category === 'energy');
      if (energyTip) personalizedTip = energyTip.tip;
    }

    res.status(200).json({
      profile,
      baselineKgPerDay,
      personalizedTip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
