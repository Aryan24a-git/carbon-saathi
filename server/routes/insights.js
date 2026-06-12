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
      prompt = `You are CarbonSaathi, a friendly and practical climate coach assisting urban Indian college students to understand and reduce their carbon footprint.

CONTEXT:
- Highest emission category: ${decision.category}
- Recommended action: ${decision.action}
- Monthly savings: ${decision.estimatedSavingKg} kg CO2
- Difficulty: ${decision.difficulty}
- User profile: commute=${profile.commute}, diet=${profile.diet}
- Decision Engine logic:
  - TRAVEL_DOMINANT threshold is 50% (0.50). If travel is >= 50% of footprint, it recommends public transport or combining trips.
  - FOOD_DOMINANT threshold is 40% (0.40). If food is >= 40%, it recommends plant-based meals.
  - ENERGY_DOMINANT threshold is 35% (0.35). If energy is >= 35%, it recommends saving AC usage.
  - FLIGHTS threshold: if any flight emissions exist, it recommends trains for journeys under 500km.
  - Otherwise, it recommends maintaining current habits ("balanced").

USER'S QUESTION:
"${sanitizedMessage}"

YOUR TASK:
1. Directly and accurately answer the USER'S QUESTION in under 120 words.
2. If they ask about carbon footprint calculations, explain it based on the facts: e.g. scooter/petrol bike factor is 0.092 kg CO2/km, electric car is 0.05 kg CO2/km, petrol car is 0.21 kg CO2/km, cycling is 0 kg CO2/km.
3. If they ask about what 'analyzeEmissions' returns, explain that it calculates the category percentages of their logged emissions, checks the dominant category using the rules above, and returns a prioritized action plan (e.g. for travel, food, energy, flights, or balanced).
4. Do NOT give a canned response explaining the DECISION ALREADY MADE if it is irrelevant to their question. Instead, answer their question first, then relate it back to their profile/recommendation if it fits naturally.`;
    } else {
      prompt = `You are CarbonSaathi, a climate coach
for an Indian college student.

DECISION ALREADY MADE (do not change this):
Highest emission source: ${decision.category}
Recommended action: ${decision.action}
Estimated monthly saving: ${decision.estimatedSavingKg} kg CO2
Difficulty: ${decision.difficulty}
User profile: commute=${profile.commute}, diet=${profile.diet}

Your task: Explain this recommendation in under 
120 words. Be encouraging, practical, and 
specific to an Indian college student's lifestyle.
Use simple language. End with one actionable 
first step they can take TODAY.`;
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
