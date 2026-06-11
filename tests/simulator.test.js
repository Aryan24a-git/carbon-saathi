process.env.GEMINI_API_KEY = 'test-key-for-jest';
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGIN = 'http://localhost:8080';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(
    () => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Mocked AI explanation response'
          }
        })
      })
    })
  )
}));

const request = require('supertest');
const app = require('../server/index');

describe('Simulator Integration Tests', () => {
  const mockActivities = [
    { category: 'travel', activityType: 'scooter_petrol', value: 10 },
    { category: 'food', activityType: 'chicken', value: 1.0 },
    { category: 'energy', activityType: 'ac_usage', value: 4.0 }
  ];

  it('switch_transport scenario → reduces emissions', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'switch_transport',
        scenarioParams: { fromMode: 'scooter_petrol', toMode: 'metro' }
      });
    expect(res.status).toBe(200);
    expect(res.body.result.savedKgPerMonth).toBeGreaterThan(0);
  });

  it('reduce_meat scenario → reduces emissions', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'reduce_meat',
        scenarioParams: { reductionFactor: 0.5 }
      });
    expect(res.status).toBe(200);
    expect(res.body.result.savedKgPerMonth).toBeGreaterThan(0);
  });

  it('reduce_ac scenario → reduces emissions', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'reduce_ac',
        scenarioParams: { hoursReduced: 2 }
      });
    expect(res.status).toBe(200);
    expect(res.body.result.savedKgPerMonth).toBeGreaterThan(0);
  });

  it('result has required math keys', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'reduce_ac',
        scenarioParams: { hoursReduced: 2 }
      });
    const { result } = res.body;
    expect(result).toHaveProperty('currentKgPerMonth');
    expect(result).toHaveProperty('proposedKgPerMonth');
    expect(result).toHaveProperty('savedKgPerMonth');
    expect(result).toHaveProperty('equivalents');
  });

  it('equivalents has treesPlanted, kmNotDriven, phoneCharges, flightHoursAvoided', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'reduce_ac',
        scenarioParams: { hoursReduced: 2 }
      });
    const { equivalents } = res.body.result;
    expect(equivalents).toHaveProperty('treesPlanted');
    expect(equivalents).toHaveProperty('kmNotDriven');
    expect(equivalents).toHaveProperty('phoneCharges');
    expect(equivalents).toHaveProperty('flightHoursAvoided');
  });

  it('unsupported scenario → 400 error', async () => {
    const res = await request(app)
      .post('/api/simulator')
      .send({
        currentActivities: mockActivities,
        scenario: 'invalid_scenario_params'
      });
    expect(res.status).toBe(400);
  });
});
