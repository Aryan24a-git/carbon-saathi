/**
 * @fileoverview Central registry for all constant values and limits.
 * @module server/utils/constants
 */

const MAX_MESSAGE_LENGTH = 500;
const MAX_ACTIVITIES_BATCH = 20;
const VALID_CATEGORIES = ['travel', 'food', 'energy', 'shopping', 'flights'];
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 20;

const DECISION_THRESHOLDS = {
  TRAVEL_DOMINANT: 0.5,
  FOOD_DOMINANT: 0.4,
  ENERGY_DOMINANT: 0.35
};

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const CHALLENGE_DURATION_DAYS = 7;

// Baseline emissions in kg CO2 per day for student profile options
const BASELINE_FACTORS = {
  commute: {
    scooter: 3.5,
    car: 5.2,
    metro: 1.2,
    bus: 1.2,
    walking: 0.0,
    cycling: 0.0
  },
  diet: {
    nonveg_daily: 4.8,
    nonveg_weekly: 2.1,
    vegetarian: 0.8,
    vegan: 0.3
  },
  acUsage: {
    always: 2.5,
    often: 1.2,
    sometimes: 0.0,
    never: 0.0
  }
};

module.exports = {
  MAX_MESSAGE_LENGTH,
  MAX_ACTIVITIES_BATCH,
  VALID_CATEGORIES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  DECISION_THRESHOLDS,
  DIFFICULTY_LEVELS,
  CHALLENGE_DURATION_DAYS,
  BASELINE_FACTORS
};
