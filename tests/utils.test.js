process.env.GEMINI_API_KEY = 'test-key-for-jest';
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGIN = 'http://localhost:8080';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation((prompt) => {
        if (typeof prompt === 'string' && (prompt.includes('xqz123abc') || prompt.includes('xyz987'))) {
          return Promise.reject(new Error('Mocked Gemini API Error (500/429)'));
        }
        return Promise.resolve({
          response: {
            text: () => 'Mocked AI explanation response'
          }
        });
      })
    })
  }))
}));

const { validateActivity, validateOnboarding, validateMessage, isValidString, sanitizeHtml } = require('../server/utils/validators');
const { EMISSION_FACTORS } = require('../server/data/emissionFactors');
const { getWeeklyChallenge, evaluateChallenge } = require('../server/engines/challengeEngine');
const { simulate } = require('../server/engines/simulatorEngine');
const request = require('supertest');
const app = require('../server/index');

describe('Utils and Validators Unit Tests', () => {
  it('validateActivity valid input → valid:true', () => {
    const res = validateActivity({ category: 'travel', activityType: 'metro', value: 10 });
    expect(res.valid).toBe(true);
    expect(res.sanitized.value).toBe(10);
  });

  it('validateActivity missing category → valid:false', () => {
    const res = validateActivity({ activityType: 'metro', value: 10 });
    expect(res.valid).toBe(false);
  });

  it('validateActivity negative value → valid:false', () => {
    const res = validateActivity({ category: 'travel', activityType: 'metro', value: -10 });
    expect(res.valid).toBe(false);
  });

  it('validateActivity HTML injection → stripped', () => {
    const res = validateActivity({ category: 'travel', activityType: '<h1>metro</h1>', value: 10 });
    expect(res.valid).toBe(true);
    expect(res.sanitized.activityType).toBe('metro');
  });

  it('validateOnboarding valid profile → valid:true', () => {
    const res = validateOnboarding({
      commute: 'scooter',
      diet: 'vegetarian',
      acUsage: 'often',
      recycling: true,
      onlineShopping: 'weekly'
    });
    expect(res.valid).toBe(true);
    expect(res.profile.diet).toBe('vegetarian');
  });

  it('validateOnboarding invalid commute → valid:false', () => {
    const res = validateOnboarding({
      commute: 'invalid_commute_type',
      diet: 'vegetarian',
      acUsage: 'often',
      recycling: true,
      onlineShopping: 'weekly'
    });
    expect(res.valid).toBe(false);
  });

  it('validateOnboarding invalid diet → valid:false', () => {
    const res = validateOnboarding({
      commute: 'scooter',
      diet: 'invalid_diet_value',
      acUsage: 'often',
      recycling: true,
      onlineShopping: 'weekly'
    });
    expect(res.valid).toBe(false);
  });

  it('validateOnboarding invalid acUsage → valid:false', () => {
    const res = validateOnboarding({
      commute: 'scooter',
      diet: 'vegetarian',
      acUsage: 'invalid_ac',
      recycling: true,
      onlineShopping: 'weekly'
    });
    expect(res.valid).toBe(false);
  });

  it('validateOnboarding invalid recycling → valid:false', () => {
    const res = validateOnboarding({
      commute: 'scooter',
      diet: 'vegetarian',
      acUsage: 'often',
      recycling: 'not-boolean',
      onlineShopping: 'weekly'
    });
    expect(res.valid).toBe(false);
  });

  it('validateOnboarding invalid onlineShopping → valid:false', () => {
    const res = validateOnboarding({
      commute: 'scooter',
      diet: 'vegetarian',
      acUsage: 'often',
      recycling: true,
      onlineShopping: 'invalid_shopping'
    });
    expect(res.valid).toBe(false);
  });

  it('validateMessage empty → valid:false', () => {
    const res = validateMessage('');
    expect(res.valid).toBe(false);
  });

  it('validateMessage over 500 chars → valid:false', () => {
    const longMsg = 'a'.repeat(501);
    const res = validateMessage(longMsg);
    expect(res.valid).toBe(false);
  });

  it('validateMessage HTML → stripped', () => {
    const res = validateMessage('<script>alert("hello")</script>Save energy');
    expect(res.valid).toBe(true);
    expect(res.message).toBe('alert("hello")Save energy');
  });

  it('isValidString helper tests', () => {
    expect(isValidString('abc', 1, 5)).toBe(true);
    expect(isValidString(123, 1, 5)).toBe(false);
    expect(isValidString('   ', 1, 5)).toBe(false);
  });

  it('sanitizeHtml helper tests', () => {
    expect(sanitizeHtml('foo&bar<baz>')).toBe('foo&amp;bar&lt;baz&gt;');
    expect(sanitizeHtml(123)).toBe('');
  });

  it('Emission math: 0.21 * 10 = 2.1 (car)', () => {
    const factor = EMISSION_FACTORS.travel.car_petrol.factor;
    const value = 10;
    const result = factor * value;
    expect(result).toBe(2.1);
  });

  it('Emission math: 0 * 5 = 0 (walking)', () => {
    const factor = EMISSION_FACTORS.travel.walking.factor;
    const value = 5;
    const result = factor * value;
    expect(result).toBe(0);
  });
});

describe('Onboarding API Integration Tests', () => {
  it('POST /api/onboarding success scooter/nonveg_weekly/often → correct baseline', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({
        commute: 'scooter',
        diet: 'nonveg_weekly',
        acUsage: 'often',
        recycling: true,
        onlineShopping: 'weekly'
      });
    expect(res.status).toBe(200);
    expect(res.body.baselineKgPerDay).toBe(6.8); // 3.5 + 2.1 + 1.2 = 6.8
    expect(res.body.profile.commute).toBe('scooter');
  });

  it('POST /api/onboarding success car/vegan/always → correct baseline', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({
        commute: 'car',
        diet: 'vegan',
        acUsage: 'always',
        recycling: false,
        onlineShopping: 'rarely'
      });
    expect(res.status).toBe(200);
    expect(res.body.baselineKgPerDay).toBe(8.0); // 5.2 + 0.3 + 2.5 = 8.0
  });

  it('POST /api/onboarding success nonveg_daily/often → correct baseline', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({
        commute: 'metro',
        diet: 'nonveg_daily',
        acUsage: 'often',
        recycling: true,
        onlineShopping: 'weekly'
      });
    expect(res.status).toBe(200);
    expect(res.body.baselineKgPerDay).toBe(7.2); // 1.2 + 4.8 + 1.2 = 7.2
  });

  it('POST /api/onboarding empty body → 400', async () => {
    const res = await request(app).post('/api/onboarding').send(null);
    expect(res.status).toBe(400);
  });

  it('POST /api/onboarding invalid input → 400', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({
        commute: 'invalid_flight',
        diet: 'vegan'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });
});

describe('Index catch-all and Health Check Tests', () => {
  it('GET /health → status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('carbon-saathi');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /random-route-catch-all → returns SPA index.html layout', async () => {
    const res = await request(app).get('/random-path-not-found-spa');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('CarbonSaathi AI');
  });
});

describe('Challenge Engine Edge Case Tests', () => {
  it('getWeeklyChallenge default returns starter challenge', () => {
    const res = getWeeklyChallenge(null, null);
    expect(res.challenge).toBeDefined();
    expect(res.challenge.difficulty).toBe('easy');
  });

  it('getWeeklyChallenge handles completed and failed history options', () => {
    const profile = { commute: 'scooter' };
    
    // Complete history
    const completedHistory = { lastChallengeId: 'travel_metro_easy', completed: true };
    const r1 = getWeeklyChallenge(profile, completedHistory);
    expect(r1.challenge.id).toBe('travel_metro_medium');

    // Failed history
    const failedHistory = { lastChallengeId: 'travel_metro_medium', completed: false };
    const r2 = getWeeklyChallenge(profile, failedHistory);
    expect(r2.challenge.id).toBe('travel_metro_easy');
  });

  it('evaluateChallenge handles invalid ID', () => {
    const res = evaluateChallenge('non-existent-challenge-id', true);
    expect(res.savingsAchieved).toBe(0);
    expect(res.message).toContain('not found');
  });
});

describe('Simulator Engine Edge Case Tests', () => {
  it('simulate handles invalid activities gracefully', () => {
    const res = simulate(null, null);
    expect(parseFloat(res.percentageReduction)).toBe(0);
  });

  it('simulate runs scenario params check', () => {
    const activities = [{ category: 'travel', activityType: 'scooter_petrol', value: 10 }];
    const r1 = simulate(activities, { scenario: 'cycle_instead', maxDistance: 15 });
    expect(r1.proposedKgPerMonth).toBe(0); // Scooter commute converted to cycling (0 factor)
  });
});

describe('Gemini Service Edge Case Tests', () => {
  it('explainDecision throws if model is not configured', async () => {
    jest.resetModules();
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const { explainDecision: explainDecisionNoKey } = require('../server/services/gemini');
    await expect(explainDecisionNoKey('test')).rejects.toThrow('No API key configured');
    process.env.GEMINI_API_KEY = originalKey; // restore key
    jest.resetModules();
  });
});

describe('Calculate Router Edge Case Tests', () => {
  it('POST /api/calculate/batch non-array activities → 400', async () => {
    const res = await request(app).post('/api/calculate/batch').send({ activities: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('POST /api/calculate/batch invalid entry → 400', async () => {
    const res = await request(app)
      .post('/api/calculate/batch')
      .send({
        activities: [{ category: 'travel', activityType: 'metro', value: -10 }]
      });
    expect(res.status).toBe(400);
  });
});

describe('Challenges Router Edge Case Tests', () => {
  it('GET /api/challenges/current invalid query params → 400', async () => {
    const res = await request(app).get('/api/challenges/current').query({ profile: 'invalid-json' });
    expect(res.status).toBe(400);
  });

  it('GET /api/challenges/current invalid history query → 400', async () => {
    const res = await request(app).get('/api/challenges/current').query({ history: 'invalid-json' });
    expect(res.status).toBe(400);
  });

  it('POST /api/challenges/evaluate invalid fields → 400', async () => {
    const res = await request(app).post('/api/challenges/evaluate').send({ challengeId: 123 });
    expect(res.status).toBe(400);
  });
});

describe('Insights Router Edge Case Tests', () => {
  it('POST /api/insights invalid payload → 400', async () => {
    const res = await request(app).post('/api/insights').send({ activities: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('POST /api/insights invalid user message → 400', async () => {
    const res = await request(app).post('/api/insights').send({
      activities: [],
      profile: { commute: 'metro' },
      message: 12345
    });
    expect(res.status).toBe(400);
  });
});

describe('Insights AI Fallback Integration Tests', () => {
  it('Gracefully falls back to local database tips when Gemini fails', async () => {
    const res = await request(app)
      .post('/api/insights')
      .send({
        activities: [
          { category: 'travel', activityType: 'scooter_petrol', value: 25.0 }
        ],
        profile: { commute: 'scooter', diet: 'vegetarian', acUsage: 'often' },
        message: 'xqz123abc never matches anything xyz987' // Nonsense string triggers Mock failure
      });

    expect(res.status).toBe(200);
    expect(res.body.explanation).toContain('As your CarbonSaathi');
    expect(res.body.explanation).toContain('Replace one scooter');
  });
});

describe('Additional Branch Coverage Tests', () => {
  it('server/index.js global error handler handles non-operational errors in production', async () => {
    const freshApp = require('../server/index');

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Trigger TypeError (non-operational) in insights by sending null inside activities array
    const res = await request(freshApp)
      .post('/api/insights')
      .send({
        activities: [null],
        profile: { commute: 'metro', diet: 'vegan' }
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(true);
    expect(res.body.message).toBe('An unexpected error occurred. Please try again later.');

    process.env.NODE_ENV = originalEnv;
  });

  it('server/routes/calculate.js calculateActivityEmissions invalid category branch via VALID_CATEGORIES manipulation', async () => {
    const freshApp = require('../server/index');
    const { VALID_CATEGORIES } = require('../server/utils/constants');
    VALID_CATEGORIES.push('fake_category_not_in_factors');

    const res = await request(freshApp)
      .post('/api/calculate')
      .send({
        category: 'fake_category_not_in_factors',
        activityType: 'metro',
        value: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CATEGORY');

    VALID_CATEGORIES.pop(); // restore constants
  });

  it('server/routes/insights.js returns 0 for invalid or malformed activities in getActivityEmissions', async () => {
    const freshApp = require('../server/index');
    const res = await request(freshApp)
      .post('/api/insights')
      .send({
        activities: [
          { category: 'invalid_cat', activityType: 'metro', value: 10 },
          { category: 'travel', activityType: 'invalid_type', value: 10 },
          { category: 'travel', activityType: 'metro' } // missing value
        ],
        profile: { commute: 'metro', diet: 'vegan', acUsage: 'sometimes' }
      });

    expect(res.status).toBe(200);
    expect(res.body.decision).toBeDefined();
  });

  it('server/routes/onboarding.js selects energy personalized tip when commute and diet are low carbon', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({
        commute: 'metro',
        diet: 'vegan',
        acUsage: 'always',
        recycling: true,
        onlineShopping: 'weekly'
      });

    expect(res.status).toBe(200);
    expect(res.body.personalizedTip).toContain('Turn off fan and lights');
  });

  it('server/routes/simulator.js throws 400 when currentActivities is not an array', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: 'not-an-array',
        scenario: 'reduce_ac'
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SIMULATOR_REQUEST');
  });

  it('server/engines/simulatorEngine.js covers missing proposedChange, default case, and malformed activity', () => {
    const activities = [{ category: 'travel', activityType: 'scooter_petrol', value: 10 }];
    
    // Malformed activity check (line 17)
    const malformed = simulate([{ category: 'travel' }], { scenario: 'reduce_ac' });
    expect(malformed.currentKgPerMonth).toBe(0);

    // Missing proposedChange (line 52)
    const missingChange = simulate(activities, null);
    expect(missingChange.proposedKgPerMonth).toBe(activities[0].value * 0.092 * 30);

    const emptyChange = simulate(activities, {});
    expect(emptyChange.proposedKgPerMonth).toBe(activities[0].value * 0.092 * 30);

    // Unsupported scenario default switch branch (line 91)
    const unsupported = simulate(activities, { scenario: 'unsupported_scenario' });
    expect(unsupported.proposedKgPerMonth).toBe(activities[0].value * 0.092 * 30);
  });

  it('server/engines/challengeEngine.js covers targetCategory energy branch', () => {
    const res = getWeeklyChallenge({ commute: 'metro', acUsage: 'always' }, null);
    expect(res.challenge.category).toBe('energy');
  });

  it('server/engines/decisionEngine.js covers percentage > 1 and default buildDecision fallback', () => {
    const { buildDecision } = require('../server/engines/decisionEngine');
    
    // percentage > 1 branch
    const res1 = buildDecision('travel', 65, {});
    expect(res1.reasoning).toContain('65%');

    // fallback category key branch
    const res2 = buildDecision('non-existent-cat', 10, {});
    expect(res2.action).toBe('Maintain your current habits and log daily');
  });

  it('server/utils/validators.js validateActivity, validateOnboarding edge cases', () => {
    expect(validateActivity(null).valid).toBe(false);
    expect(validateActivity({ category: 'travel', activityType: '', value: 10 }).valid).toBe(false);
    expect(validateActivity({ category: 'travel', activityType: 123, value: 10 }).valid).toBe(false);
    expect(validateOnboarding(null).valid).toBe(false);
  });
});

describe('Rate Limiter Middleware Execution Tests', () => {
  it('triggers rate limiting error response after 20 requests', async () => {
    // Fire requests to onboarding to hit the 20 limits
    for (let i = 0; i < 20; i++) {
      await request(app).post('/api/onboarding').send({});
    }
    const res = await request(app).post('/api/onboarding').send({});
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

