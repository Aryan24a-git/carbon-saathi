/**
 * @fileoverview What-If Simulator Engine.
 * Calculates projected emissions for lifestyle changes.
 * Pure math, no AI involved.
 * @module server/engines/simulatorEngine
 */

const { EMISSION_FACTORS } = require('../data/emissionFactors');

/**
 * Calculates emissions for a single activity.
 * @param {Object} activity - { category, activityType, value }
 * @returns {number} Emissions in kg CO2.
 */
function getActivityEmissions(activity) {
  if (!activity || !activity.category || !activity.activityType || !activity.value) {
    return 0;
  }
  const categoryFactors = EMISSION_FACTORS[activity.category];
  if (!categoryFactors) return 0;
  const factorInfo = categoryFactors[activity.activityType];
  if (!factorInfo) return 0;
  return activity.value * factorInfo.factor;
}

/**
 * Simulates carbon emissions changes based on proposed scenario.
 * @param {Array<Object>} currentActivities - List of user logged activities.
 * @param {Object} proposedChange - Details of the scenario to simulate.
 * @param {string} proposedChange.scenario - One of 'switch_transport', 'reduce_meat', 'reduce_ac', 'cycle_instead'.
 * @returns {Object} Simulation metrics.
 * @example
 * const res = simulate([{ category: 'travel', activityType: 'scooter_petrol', value: 10 }], { scenario: 'switch_transport', fromMode: 'scooter_petrol', toMode: 'metro' });
 */
function simulate(currentActivities, proposedChange) {
  if (!Array.isArray(currentActivities)) {
    currentActivities = [];
  }

  // Calculate current emissions per day
  let currentTotal = 0;
  currentActivities.forEach(act => {
    currentTotal += getActivityEmissions(act);
  });

  // Apply proposed change to construct proposedActivities
  const proposedActivities = currentActivities.map(act => {
    const copy = { ...act };
    
    if (!proposedChange || !proposedChange.scenario) {
      return copy;
    }

    switch (proposedChange.scenario) {
      case 'switch_transport':
        // Details: { fromMode: 'scooter_petrol', toMode: 'metro' }
        if (copy.category === 'travel' && copy.activityType === proposedChange.fromMode) {
          copy.activityType = proposedChange.toMode || 'metro';
        }
        break;

      case 'reduce_meat':
        // Details: { reductionFactor: 0.5 } (reduces meat consumption value by 50%)
        const meatTypes = ['beef', 'mutton', 'chicken', 'fish'];
        if (copy.category === 'food' && meatTypes.includes(copy.activityType)) {
          const factor = typeof proposedChange.reductionFactor === 'number' ? proposedChange.reductionFactor : 0.5;
          copy.value = copy.value * factor;
        }
        break;

      case 'reduce_ac':
        // Details: { hoursReduced: 1 } (reduces AC hours)
        if (copy.category === 'energy' && copy.activityType === 'ac_usage') {
          const hoursReduced = typeof proposedChange.hoursReduced === 'number' ? proposedChange.hoursReduced : 1;
          copy.value = Math.max(0, copy.value - hoursReduced);
        }
        break;

      case 'cycle_instead':
        // Details: { maxDistance: 5 } (replaces all short motor trips under maxDistance with cycling)
        const motorCommutes = ['scooter_petrol', 'car_petrol', 'auto_rickshaw'];
        const maxDist = typeof proposedChange.maxDistance === 'number' ? proposedChange.maxDistance : 5;
        if (copy.category === 'travel' && motorCommutes.includes(copy.activityType) && copy.value <= maxDist) {
          copy.activityType = 'cycling';
        }
        break;

      default:
        // No matching scenario
        break;
    }

    return copy;
  });

  // Calculate proposed emissions
  let proposedTotal = 0;
  proposedActivities.forEach(act => {
    proposedTotal += getActivityEmissions(act);
  });

  const savedKg = currentTotal - proposedTotal;

  // Handle divide by zero
  const percentageReduction = currentTotal > 0
    ? ((savedKg / currentTotal) * 100).toFixed(1)
    : '0.0';

  return {
    currentKgPerMonth: currentTotal * 30,
    proposedKgPerMonth: proposedTotal * 30,
    savedKgPerMonth: savedKg * 30,
    savedKgPerYear: savedKg * 365,
    equivalents: {
      treesPlanted: Math.ceil(savedKg * 365 / 21),
      kmNotDriven: (savedKg * 365 / 0.21).toFixed(0),
      phoneCharges: Math.round(savedKg * 365 / 0.005),
      flightHoursAvoided: (savedKg * 365 / 90).toFixed(1)
    },
    percentageReduction
  };
}

module.exports = {
  simulate
};
