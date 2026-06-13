/**
 * @fileoverview CarbonSaathi Decision Engine.
 * Makes ALL prioritization decisions using deterministic rule-based logic.
 * Gemini is NOT involved in decisions.
 * @module server/engines/decisionEngine
 */

const { DECISION_THRESHOLDS } = require('../utils/constants');
const { TREE_ABSORPTION_KG_PER_DAY } = require('../data/emissionFactors');

/**
 * Builds a structured decision object for a category.
 * @param {string} category - Dominant emission category.
 * @param {number} percentage - Category percentage (0 to 100).
 * @param {Object} profile - User profile for personalization.
 * @returns {Object} Decision details including category, action, estimatedSavingKg, difficulty, reasoning, and treeEquivalent.
 * @example
 * const decision = buildDecision('food', 42.5, { diet: 'non-veg' });
 */
const buildDecision = (category, percentage, profile) => {
  const displayPercentage = percentage <= 1 ? percentage * 100 : percentage;
  const decisions = {
    travel: {
      action: profile?.commute === 'scooter'
        ? 'Replace one scooter commute with metro/bus'
        : 'Combine trips or use public transport once',
      estimatedSavingKg: 8,
      difficulty: 'medium',
      reasoning: `Travel contributes ${displayPercentage.toFixed(0)}% of your emissions. Switching transport mode once weekly saves approximately 8 kg CO2/month.`
    },
    food: {
      action: 'Choose dal-chawal over non-veg for one meal',
      estimatedSavingKg: 6,
      difficulty: 'easy',
      reasoning: `Food contributes ${displayPercentage.toFixed(0)}% of your footprint. One plant-based meal saves up to 6 kg CO2.`
    },
    energy: {
      action: 'Turn off AC 1 hour earlier each day',
      estimatedSavingKg: 3,
      difficulty: 'easy',
      reasoning: `Energy use is your ${displayPercentage.toFixed(0)}% contributor. Each AC hour saved = 1.23 kg CO2.`
    },
    flights: {
      action: 'Consider train for journeys under 500km',
      estimatedSavingKg: 45,
      difficulty: 'hard',
      reasoning: 'Flight emissions are extremely high. Train emits 6x less CO2 per km than flying.'
    },
    balanced: {
      action: 'Maintain your current habits and log daily',
      estimatedSavingKg: 2,
      difficulty: 'easy',
      reasoning: 'Your emissions are well-distributed. Focus on consistency and daily tracking.'
    }
  };

  const d = decisions[category] || decisions.balanced;
  return {
    category,
    percentage,
    action: d.action,
    estimatedSavingKg: d.estimatedSavingKg,
    difficulty: d.difficulty,
    reasoning: d.reasoning,
    treeEquivalent: Math.ceil(
      d.estimatedSavingKg / TREE_ABSORPTION_KG_PER_DAY
    )
  };
};

/**
 * Analyzes category breakdown and determines highest impact action using IF/ELSE rules.
 * @param {Object} breakdown - Category breakdown as percentages.
 * @param {Object} profile - User onboarding profile.
 * @returns {Object} Structured decision object.
 * @example
 * const decision = analyzeEmissions({ travel: 0.60, food: 0.20 }, { commute: 'scooter' });
 */
const analyzeEmissions = (breakdown, profile) => {
  const { travel = 0, food = 0, energy = 0, shopping = 0, flights = 0 } = breakdown;

  // Rule 1: Travel dominant
  if (travel >= DECISION_THRESHOLDS.TRAVEL_DOMINANT) {
    return buildDecision('travel', travel, profile);
  }
  // Rule 2: Food dominant  
  else if (food >= DECISION_THRESHOLDS.FOOD_DOMINANT) {
    return buildDecision('food', food, profile);
  }
  // Rule 3: Energy dominant
  else if (energy >= DECISION_THRESHOLDS.ENERGY_DOMINANT) {
    return buildDecision('energy', energy, profile);
  }
  // Rule 4: Flights (any flight = high priority)
  else if (flights > 0) {
    return buildDecision('flights', flights, profile);
  }
  // Rule 5: Balanced/maintain
  else {
    return buildDecision('balanced', 0, profile);
  }
};

module.exports = { analyzeEmissions, buildDecision };
