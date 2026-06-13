/**
 * @fileoverview Route handler for carbon footprint calculations (single/batch).
 * @module server/routes/calculate
 */

const express = require('express');
const router = express.Router();
const { validateActivity, validateProfile } = require('../utils/validators');
const { EMISSION_FACTORS } = require('../data/emissionFactors');
const { MAX_ACTIVITIES_BATCH } = require('../utils/constants');
const { analyzeEmissions } = require('../engines/decisionEngine');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Calculates emissions for an activity.
 * @param {string} category - Activity category.
 * @param {string} type - Activity type.
 * @param {number} value - Activity quantity value.
 * @returns {number} Calculated emissions in kg CO2.
 * @throws {AppError} If category or type is invalid.
 */
function calculateActivityEmissions(category, type, value) {
  const catFactors = Object.prototype.hasOwnProperty.call(EMISSION_FACTORS, category)
    ? EMISSION_FACTORS[category]
    : null;
  if (!catFactors) {
    throw new AppError(`Invalid emission category: ${category}`, 400, 'INVALID_CATEGORY');
  }
  const factorInfo = Object.prototype.hasOwnProperty.call(catFactors, type)
    ? catFactors[type]
    : null;
  if (!factorInfo) {
    throw new AppError(
      `Invalid activity type: ${type} for category ${category}`,
      400,
      'INVALID_ACTIVITY_TYPE'
    );
  }
  return value * factorInfo.factor;
}

/**
 * POST /api/calculate
 * Calculate carbon footprint for a single activity.
 */
router.post('/', (req, res, next) => {
  try {
    logger.info('Calculating single activity emissions', { body: req.body });

    const validation = validateActivity(req.body);
    if (!validation.valid) {
      throw new AppError(validation.error, 400, 'INVALID_ACTIVITY_DATA');
    }

    const { category, activityType, value } = validation.sanitized;
    const emissions = parseFloat(
      calculateActivityEmissions(category, activityType, value).toFixed(2)
    );

    const comparison = {
      trees: Math.ceil(emissions / 0.057),
      kmDriven: (emissions / 0.21).toFixed(1),
      phoneCharges: Math.round(emissions / 0.005),
      minutesOfACequivalent: Math.round(emissions / 0.021)
    };

    res.status(200).json({
      category,
      activityType,
      value,
      emissions,
      unit: 'kg CO2',
      comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calculate/batch
 * Calculate carbon footprint for multiple activities and return a prioritized decision.
 */
router.post('/batch', (req, res, next) => {
  try {
    logger.info('Calculating batch activities emissions', { body: req.body });

    const { activities, profile } = req.body;
    if (!Array.isArray(activities)) {
      throw new AppError('activities must be an array', 400, 'INVALID_BATCH_DATA');
    }

    const profileValidation = validateProfile(profile);
    if (!profileValidation.valid) {
      throw new AppError(
        `Invalid profile context: ${profileValidation.error}`,
        400,
        'INVALID_PROFILE_DATA'
      );
    }
    const validatedProfile = profileValidation.profile;

    if (activities.length > MAX_ACTIVITIES_BATCH) {
      throw new AppError(
        `Batch size exceeds the limit of ${MAX_ACTIVITIES_BATCH} activities`,
        400,
        'BATCH_TOO_LARGE'
      );
    }

    const calculatedActivities = [];
    let total = 0;
    const categorySums = {
      travel: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      flights: 0
    };

    for (const act of activities) {
      const validation = validateActivity(act);
      if (!validation.valid) {
        throw new AppError(
          `Invalid activity entry: ${validation.error}`,
          400,
          'INVALID_ACTIVITY_DATA'
        );
      }

      const { category, activityType, value } = validation.sanitized;
      const emissions = parseFloat(
        calculateActivityEmissions(category, activityType, value).toFixed(2)
      );

      calculatedActivities.push({
        category,
        activityType,
        value,
        emissions,
        unit: 'kg CO2'
      });

      total += emissions;
      if (Object.prototype.hasOwnProperty.call(categorySums, category)) {
        categorySums[category] += emissions;
      }
    }

    total = parseFloat(total.toFixed(2));

    // Calculate breakdown percentages in 0-1 range
    const breakdown = {
      travel: total > 0 ? parseFloat((categorySums.travel / total).toFixed(4)) : 0,
      food: total > 0 ? parseFloat((categorySums.food / total).toFixed(4)) : 0,
      energy: total > 0 ? parseFloat((categorySums.energy / total).toFixed(4)) : 0,
      shopping: total > 0 ? parseFloat((categorySums.shopping / total).toFixed(4)) : 0,
      flights: total > 0 ? parseFloat((categorySums.flights / total).toFixed(4)) : 0
    };

    // Run decision engine
    const decision = analyzeEmissions(breakdown, validatedProfile);

    res.status(200).json({
      activities: calculatedActivities,
      total,
      breakdown,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
