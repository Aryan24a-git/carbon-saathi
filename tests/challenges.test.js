process.env.GEMINI_API_KEY = 'test-key-for-jest';
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGIN = 'http://localhost:8080';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked AI explanation response'
        }
      })
    })
  }))
}));

const request = require('supertest');
const app = require('../server/index');

describe('Challenges API Tests', () => {
  it('GET /api/challenges/current → 200', async () => {
    const res = await request(app)
      .get('/api/challenges/current')
      .query({ profile: JSON.stringify({ commute: 'scooter', diet: 'vegetarian' }) });
    expect(res.status).toBe(200);
  });

  it('response has challenge object', async () => {
    const res = await request(app)
      .get('/api/challenges/current')
      .query({ profile: JSON.stringify({ commute: 'scooter' }) });
    expect(res.body.challenge).toBeDefined();
  });

  it('challenge has: id, title, description, targetKgSaved, difficulty, durationDays', async () => {
    const res = await request(app)
      .get('/api/challenges/current')
      .query({ profile: JSON.stringify({ commute: 'scooter' }) });
    const c = res.body.challenge;
    expect(c).toHaveProperty('id');
    expect(c).toHaveProperty('title');
    expect(c).toHaveProperty('description');
    expect(c).toHaveProperty('targetKgSaved');
    expect(c).toHaveProperty('difficulty');
    expect(c).toHaveProperty('durationDays');
  });

  it('POST /api/challenges/evaluate completed:true → response has nextChallenge', async () => {
    const res = await request(app)
      .post('/api/challenges/evaluate')
      .send({ challengeId: 'travel_metro_easy', completed: true });
    expect(res.status).toBe(200);
    expect(res.body.nextChallenge).toBeDefined();
  });

  it('POST /api/challenges/evaluate completed:false → response has easier alternative', async () => {
    const res = await request(app)
      .post('/api/challenges/evaluate')
      .send({ challengeId: 'travel_metro_medium', completed: false });
    expect(res.status).toBe(200);
    expect(res.body.nextChallenge).toBeDefined();
    expect(res.body.nextChallenge.id).toBe('travel_metro_easy');
  });

  it('completed challenge → harder next challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/evaluate')
      .send({ challengeId: 'travel_metro_easy', completed: true });
    expect(res.body.nextChallenge.id).toBe('travel_metro_medium');
  });

  it('failed challenge → easier next challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/evaluate')
      .send({ challengeId: 'travel_metro_medium', completed: false });
    expect(res.body.nextChallenge.id).toBe('travel_metro_easy');
  });
});
