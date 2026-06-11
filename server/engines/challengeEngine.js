/**
 * @fileoverview Adaptive challenge engine for CarbonSaathi AI.
 * Tailors challenges to user commute, history, and category dominance.
 * @module server/engines/challengeEngine
 */

const CHALLENGES = [
  {
    id: 'travel_metro_easy',
    category: 'travel',
    title: 'Metro Shift Starter',
    description: 'Take the metro instead of a cab or auto-rickshaw for 1 commute this week.',
    targetKgSaved: 3,
    durationDays: 7,
    difficulty: 'easy',
    easierAlternativeId: null,
    harderAlternativeId: 'travel_metro_medium',
    icon: '🚇',
    collegeSpecific: true
  },
  {
    id: 'travel_metro_medium',
    category: 'travel',
    title: 'Metro Habit',
    description: 'Take the metro instead of a cab or auto-rickshaw for 3 commutes this week.',
    targetKgSaved: 9,
    durationDays: 7,
    difficulty: 'medium',
    easierAlternativeId: 'travel_metro_easy',
    harderAlternativeId: 'travel_metro_hard',
    icon: '🚇',
    collegeSpecific: true
  },
  {
    id: 'travel_metro_hard',
    category: 'travel',
    title: 'Public Transit Warrior',
    description: 'Exclusively use metro or bus for all commutes this week.',
    targetKgSaved: 20,
    durationDays: 7,
    difficulty: 'hard',
    easierAlternativeId: 'travel_metro_medium',
    harderAlternativeId: null,
    icon: '🚌',
    collegeSpecific: true
  },
  {
    id: 'food_veg_easy',
    category: 'food',
    title: 'Green Mess Monday',
    description: 'Eat only vegetarian or vegan meals in the dining hall on Monday.',
    targetKgSaved: 4,
    durationDays: 7,
    difficulty: 'easy',
    easierAlternativeId: null,
    harderAlternativeId: 'food_veg_medium',
    icon: '🥦',
    collegeSpecific: true
  },
  {
    id: 'food_veg_medium',
    category: 'food',
    title: 'Plant-Based Weekdays',
    description: 'Eat vegetarian meals for 3 weekdays in the college mess.',
    targetKgSaved: 12,
    durationDays: 7,
    difficulty: 'medium',
    easierAlternativeId: 'food_veg_easy',
    harderAlternativeId: 'food_veg_hard',
    icon: '🫘',
    collegeSpecific: true
  },
  {
    id: 'food_veg_hard',
    category: 'food',
    title: 'Mess Vegetarian Week',
    description: 'Go fully vegetarian or vegan for all meals this week.',
    targetKgSaved: 25,
    durationDays: 7,
    difficulty: 'hard',
    easierAlternativeId: 'food_veg_medium',
    harderAlternativeId: null,
    icon: '🍚',
    collegeSpecific: true
  },
  {
    id: 'energy_lights_easy',
    category: 'energy',
    title: 'Hostel Light Switcher',
    description: 'Turn off lights and fans every single time you leave your room this week.',
    targetKgSaved: 2,
    durationDays: 7,
    difficulty: 'easy',
    easierAlternativeId: null,
    harderAlternativeId: 'energy_lights_medium',
    icon: '💡',
    collegeSpecific: true
  },
  {
    id: 'energy_lights_medium',
    category: 'energy',
    title: 'AC Optimizer',
    description: 'Set the AC to 26°C and limit use to 2 hours per day this week.',
    targetKgSaved: 6,
    durationDays: 7,
    difficulty: 'medium',
    easierAlternativeId: 'energy_lights_easy',
    harderAlternativeId: 'energy_lights_hard',
    icon: '❄️',
    collegeSpecific: true
  },
  {
    id: 'energy_lights_hard',
    category: 'energy',
    title: 'Zero AC Challenge',
    description: 'Use only the ceiling fan and avoid switching on the AC for the entire week.',
    targetKgSaved: 15,
    durationDays: 7,
    difficulty: 'hard',
    easierAlternativeId: 'energy_lights_medium',
    harderAlternativeId: null,
    icon: '🔌',
    collegeSpecific: true
  },
  {
    id: 'shopping_books_easy',
    category: 'shopping',
    title: 'Senior Book Swap',
    description: 'Get at least 1 course textbook second-hand or borrow it from a senior.',
    targetKgSaved: 5,
    durationDays: 7,
    difficulty: 'easy',
    easierAlternativeId: null,
    harderAlternativeId: 'shopping_books_hard',
    icon: '📚',
    collegeSpecific: true
  },
  {
    id: 'shopping_books_hard',
    category: 'shopping',
    title: 'Refuse Fast Fashion',
    description: 'Do not purchase any new clothes or order online deliveries for the entire week.',
    targetKgSaved: 20,
    durationDays: 7,
    difficulty: 'hard',
    easierAlternativeId: 'shopping_books_easy',
    harderAlternativeId: null,
    icon: '👕',
    collegeSpecific: true
  }
];

/**
 * Determines and returns the next weekly challenge for a user.
 * @param {Object} profile - User onboarding profile.
 * @param {Object} [history] - Details of the last challenge taken.
 * @param {string} history.lastChallengeId - ID of the last challenge.
 * @param {boolean} history.completed - Whether the last challenge was completed.
 * @returns {Object} Next challenge along with personalized reasoning.
 * @throws {Error} Never throws.
 * @example
 * const next = getWeeklyChallenge({ commute: 'scooter' }, { lastChallengeId: 'travel_metro_easy', completed: true });
 */
function getWeeklyChallenge(profile, history) {
  let challenge;
  let reasoning = 'Based on your profile commute and energy choices.';

  if (history && history.lastChallengeId) {
    const lastChallenge = CHALLENGES.find(c => c.id === history.lastChallengeId);
    if (lastChallenge) {
      if (history.completed) {
        const harderId = lastChallenge.harderAlternativeId;
        challenge = CHALLENGES.find(c => c.id === harderId) || lastChallenge;
        reasoning = `You completed the "${lastChallenge.title}" challenge! We upgraded your difficulty level to keep pushing your limits.`;
      } else {
        const easierId = lastChallenge.easierAlternativeId;
        challenge = CHALLENGES.find(c => c.id === easierId) || lastChallenge;
        reasoning = `Since "${lastChallenge.title}" was tough to complete, we selected an easier alternative to help you gain momentum.`;
      }
    }
  }

  if (!challenge) {
    // If no history, look at profile to decide category
    let targetCategory = 'food';
    if (profile?.commute === 'scooter' || profile?.commute === 'car_petrol') {
      targetCategory = 'travel';
      reasoning = 'Since you commute via personal motorized transport, this transit-focused challenge will have the highest impact.';
    } else if (profile?.acUsage === 'often' || profile?.acUsage === 'always') {
      targetCategory = 'energy';
      reasoning = 'Your high AC usage is a primary source of carbon. Here is an easy challenge to optimize your power use.';
    } else {
      reasoning = 'Start your green journey with this easy meal alternative mess challenge.';
    }

    challenge = CHALLENGES.find(c => c.category === targetCategory && c.difficulty === 'easy') || CHALLENGES[0];
  }

  return { challenge, reasoning };
}

/**
 * Evaluates the status of a challenge and returns the next recommendation.
 * @param {string} challengeId - The ID of the challenge evaluated.
 * @param {boolean} completed - Whether the user succeeded.
 * @returns {Object} Evaluation details including next challenge, message, savings, and alternative tip.
 * @throws {Error} Never throws.
 * @example
 * const res = evaluateChallenge('travel_metro_easy', true);
 */
function evaluateChallenge(challengeId, completed) {
  const current = CHALLENGES.find(c => c.id === challengeId);
  if (!current) {
    return {
      next: CHALLENGES[0],
      message: 'Challenge not found. Starting fresh!',
      savingsAchieved: 0
    };
  }

  if (completed) {
    const harder = CHALLENGES.find(c => c.id === current.harderAlternativeId) || current;
    return {
      next: harder,
      message: `Awesome job! You successfully completed "${current.title}". You are stepping up your sustainability game. Try this next level!`,
      savingsAchieved: current.targetKgSaved
    };
  } else {
    const easier = CHALLENGES.find(c => c.id === current.easierAlternativeId) || current;
    return {
      next: easier,
      message: `No worries! Every small step counts. Let's try something a bit more achievable to keep you going.`,
      alternativeTip: `Try starting with simple actions like unplugging chargers when not in use.`
    };
  }
}

module.exports = {
  CHALLENGES,
  getWeeklyChallenge,
  evaluateChallenge
};
