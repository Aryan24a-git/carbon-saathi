/**
 * @fileoverview Route handler for the What-If emission simulator.
 * @module server/routes/simulator
 */

const express = require('express');
const router = express.Router();
const { simulate } = require('../engines/simulatorEngine');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const SUPPORTED_SCENARIOS = ['switch_transport', 'reduce_meat', 'reduce_ac', 'cycle_instead'];

/**
 * POST /api/simulator
 * Run carbon reduction scenario simulation.
 */
router.post('/', (req, res, next) => {
  try {
    logger.info('Simulating emission changes', { body: req.body });

    const { currentActivities, scenario, scenarioParams } = req.body;

    if (!Array.isArray(currentActivities)) {
      throw new AppError('currentActivities must be an array of logged activities', 400, 'INVALID_SIMULATOR_REQUEST');
    }

    if (typeof scenario !== 'string' || !SUPPORTED_SCENARIOS.includes(scenario)) {
      throw new AppError(`Invalid scenario. Supported scenarios: ${SUPPORTED_SCENARIOS.join(', ')}`, 400, 'UNSUPPORTED_SCENARIO');
    }

    const proposedChange = {
      scenario,
      ...(scenarioParams || {})
    };

    const result = simulate(currentActivities, proposedChange);

    res.status(200).json({
      scenario,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
