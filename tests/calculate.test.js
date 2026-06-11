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

describe('Calculate Integration Tests', () => {
  it('POST /api/calculate scooter 10km → 0.92 kg CO2', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'scooter_petrol', value: 10 });
    expect(res.status).toBe(200);
    expect(res.body.emissions).toBe(0.92);
  });

  it('POST /api/calculate car_petrol 10km → 2.1 kg CO2', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'car_petrol', value: 10 });
    expect(res.status).toBe(200);
    expect(res.body.emissions).toBe(2.1);
  });

  it('POST /api/calculate walking 5km → 0 kg CO2', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'walking', value: 5 });
    expect(res.status).toBe(200);
    expect(res.body.emissions).toBe(0);
  });

  it('POST /api/calculate beef 0.5kg → 13.5 kg CO2', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'food', activityType: 'beef', value: 0.5 });
    expect(res.status).toBe(200);
    expect(res.body.emissions).toBe(13.5);
  });

  it('POST /api/calculate has comparison object', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'metro', value: 10 });
    expect(res.status).toBe(200);
    expect(res.body.comparison).toBeDefined();
  });

  it('comparison has trees, kmDriven, phoneCharges', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'metro', value: 10 });
    expect(res.body.comparison).toHaveProperty('trees');
    expect(res.body.comparison).toHaveProperty('kmDriven');
    expect(res.body.comparison).toHaveProperty('phoneCharges');
  });

  it('missing category → 400', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ activityType: 'metro', value: 10 });
    expect(res.status).toBe(400);
  });

  it('invalid activityType → 400', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'invalid_type', value: 10 });
    expect(res.status).toBe(400);
  });

  it('negative value → 400', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ category: 'travel', activityType: 'metro', value: -5 });
    expect(res.status).toBe(400);
  });

  it('empty body → 400', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/calculate/batch multiple → correct total', async () => {
    const res = await request(app)
      .post('/api/calculate/batch')
      .send({
        activities: [
          { category: 'travel', activityType: 'scooter_petrol', value: 10 },
          { category: 'food', activityType: 'beef', value: 0.5 }
        ],
        profile: { commute: 'scooter', diet: 'nonveg_weekly' }
      });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(14.42); // 0.92 + 13.5 = 14.42
  });

  it('POST /api/calculate/batch > 20 items → 400', async () => {
    const list = Array(21).fill({ category: 'travel', activityType: 'metro', value: 5 });
    const res = await request(app)
      .post('/api/calculate/batch')
      .send({ activities: list });
    expect(res.status).toBe(400);
  });

  it('POST /api/calculate/batch has breakdown + decision', async () => {
    const res = await request(app)
      .post('/api/calculate/batch')
      .send({
        activities: [
          { category: 'travel', activityType: 'scooter_petrol', value: 10 }
        ],
        profile: { commute: 'scooter' }
      });
    expect(res.status).toBe(200);
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.decision).toBeDefined();
  });
});
