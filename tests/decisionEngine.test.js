const { analyzeEmissions } = require('../server/engines/decisionEngine');

describe('Decision Engine Unit Tests', () => {
  it('travel=65% → category: "travel" decision', () => {
    const res = analyzeEmissions({ travel: 0.65, food: 0.20, energy: 0.15 }, { commute: 'scooter' });
    expect(res.category).toBe('travel');
  });

  it('food=45% → category: "food" decision', () => {
    const res = analyzeEmissions({ travel: 0.10, food: 0.45, energy: 0.45 }, {});
    expect(res.category).toBe('food');
  });

  it('energy=40% → category: "energy" decision', () => {
    const res = analyzeEmissions({ travel: 0.10, food: 0.10, energy: 0.40 }, {});
    expect(res.category).toBe('energy');
  });

  it('flights=10% → category: "flights" decision', () => {
    const res = analyzeEmissions({ travel: 0.10, food: 0.10, energy: 0.10, flights: 0.10 }, {});
    expect(res.category).toBe('flights');
  });

  it('balanced 20/20/20 → category: "balanced"', () => {
    const res = analyzeEmissions({ travel: 0.20, food: 0.20, energy: 0.20 }, {});
    expect(res.category).toBe('balanced');
  });

  it('decision has required fields', () => {
    const res = analyzeEmissions({ travel: 0.65 }, {});
    expect(res).toHaveProperty('action');
    expect(res).toHaveProperty('estimatedSavingKg');
    expect(res).toHaveProperty('difficulty');
    expect(res).toHaveProperty('reasoning');
    expect(res).toHaveProperty('treeEquivalent');
  });

  it('scooter profile → action mentions metro/bus', () => {
    const res = analyzeEmissions({ travel: 0.65 }, { commute: 'scooter' });
    expect(res.action).toContain('metro/bus');
  });

  it('car profile → action mentions public transport', () => {
    const res = analyzeEmissions({ travel: 0.65 }, { commute: 'car' });
    expect(res.action).toContain('public transport');
  });

  it('all decisions have difficulty in valid enum', () => {
    const categories = ['travel', 'food', 'energy', 'flights', 'balanced'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    categories.forEach(cat => {
      const bd = { travel: 0, food: 0, energy: 0, flights: 0 };
      if (cat !== 'balanced') {
        bd[cat] = 0.90;
      }
      const res = analyzeEmissions(bd, { commute: 'scooter' });
      expect(validDifficulties).toContain(res.difficulty);
    });
  });
});
