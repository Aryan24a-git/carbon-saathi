/**
 * @fileoverview Route handler for generating carbon footprint insights and tips.
 * @module server/routes/insights
 */

const express = require('express');
const router = express.Router();
const { analyzeEmissions } = require('../engines/decisionEngine');
const { explainDecision } = require('../services/gemini');
const { EMISSION_FACTORS } = require('../data/emissionFactors');
const { validateMessage } = require('../utils/validators');
const tipsDatabase = require('../data/tipsDatabase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Calculates emissions for a single activity.
 * @param {Object} activity - { category, activityType, value }
 * @returns {number} Emissions in kg CO2.
 */
function getActivityEmissions(activity) {
  if (!activity || !activity.category || !activity.activityType || !activity.value) {
    return 0;
  }
  const categoryFactors = Object.prototype.hasOwnProperty.call(EMISSION_FACTORS, activity.category)
    ? EMISSION_FACTORS[activity.category]
    : null;
  if (!categoryFactors) return 0;
  const factorInfo = Object.prototype.hasOwnProperty.call(categoryFactors, activity.activityType)
    ? categoryFactors[activity.activityType]
    : null;
  if (!factorInfo) return 0;
  return activity.value * factorInfo.factor;
}

/**
 * POST /api/insights
 * Generates carbon analysis insights, leveraging Gemini for text explanations with robust fallbacks.
 */
router.post('/', async (req, res, next) => {
  try {
    logger.info('Generating emissions insights', { body: req.body });

    const { activities, profile, message } = req.body;

    if (!Array.isArray(activities) || !profile) {
      throw new AppError('activities (array) and profile (object) are required', 400, 'INVALID_INSIGHTS_REQUEST');
    }

    // Optional user message validation
    let sanitizedMessage = '';
    if (message) {
      const msgValidation = validateMessage(message);
      if (!msgValidation.valid) {
        throw new AppError(msgValidation.error, 400, 'INVALID_USER_MESSAGE');
      }
      sanitizedMessage = msgValidation.message;
    }

    // Step 1: Calculate percentages and run Decision Engine
    let total = 0;
    const categorySums = {
      travel: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      flights: 0
    };

    activities.forEach(act => {
      const emissions = getActivityEmissions(act);
      total += emissions;
      if (Object.prototype.hasOwnProperty.call(categorySums, act.category)) {
        categorySums[act.category] += emissions;
      }
    });

    const breakdown = {
      travel: total > 0 ? parseFloat((categorySums.travel / total).toFixed(4)) : 0,
      food: total > 0 ? parseFloat((categorySums.food / total).toFixed(4)) : 0,
      energy: total > 0 ? parseFloat((categorySums.energy / total).toFixed(4)) : 0,
      shopping: total > 0 ? parseFloat((categorySums.shopping / total).toFixed(4)) : 0,
      flights: total > 0 ? parseFloat((categorySums.flights / total).toFixed(4)) : 0
    };

    const decision = analyzeEmissions(breakdown, profile);

    // Step 2: Build Gemini prompt dynamically
    let prompt = '';
    if (sanitizedMessage) {
      prompt = `You are CarbonSaathi, a precise and direct climate coach. 

CONTEXT:
- Highest emission category: ${decision.category}
- Recommended action: ${decision.action}
- Monthly savings: ${decision.estimatedSavingKg} kg CO2
- User profile: commute=${profile.commute}, diet=${profile.diet}
- Decision thresholds: Travel >= 50% (0.50), Food >= 40% (0.40), Energy >= 35% (0.35), Flights > 0.

USER'S QUESTION:
"${sanitizedMessage}"

YOUR TASK:
1. Answer the user's question directly and concisely in 1-3 sentences (maximum 50 words).
2. Do NOT use any greetings (no "Namaste", "Hey there", etc.) or introductory conversational fluff.
3. If they ask about calculations: scooter/petrol bike emits 0.092 kg CO2/km, electric car is 0.05, petrol car is 0.21, cycling/walking is 0.
4. If they ask about what 'analyzeEmissions' returns: it checks which category exceeds its threshold (e.g. Travel >= 50%) and returns that category's recommended action plan, or 'balanced' if none dominant.`;
    } else {
      prompt = `You are CarbonSaathi, a precise and direct climate coach.

DECISION:
Category: ${decision.category}
Action: ${decision.action}
Savings: ${decision.estimatedSavingKg} kg CO2
Difficulty: ${decision.difficulty}
User profile: commute=${profile.commute}, diet=${profile.diet}

YOUR TASK:
Explain this recommendation in 1-2 direct sentences (maximum 40 words). Do not use greetings or conversational fluff. Be practical and specific.`;
    }

    let explanation = '';
    try {
      // Step 3: Call Gemini
      explanation = await explainDecision(prompt);
    } catch (geminiError) {
      logger.warn('Gemini explanation failed or not configured, executing fallback tip compilation', { err: geminiError.message });

      // Step 4: FALLBACK (tipsDatabase explanation)
      const relevantTips = tipsDatabase.filter(t => t.category === decision.category);
      const sampleTip = relevantTips[0]?.tip || 'Turn off power sockets when gadgets are not charging.';
      const sampleTip2 = relevantTips[1]?.tip || 'Walk or cycle for short transit commutes.';

      explanation = `As your CarbonSaathi climate coach, let's analyze your emissions. Since your highest impact source is ${decision.category}, our recommendation is: ${decision.action}. This is a ${decision.difficulty} action that saves about ${decision.estimatedSavingKg} kg CO2. Start today with this tip: ${sampleTip} Or try this: ${sampleTip2} Every small action builds a lasting impact!`;
    }

    res.status(200).json({
      decision,
      explanation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
