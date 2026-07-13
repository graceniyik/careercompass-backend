import { RiasecScoringService } from './riasec-scoring.service';

describe('RiasecScoringService', () => {
  let service: RiasecScoringService;

  beforeEach(() => {
    service = new RiasecScoringService();
  });

  it('computes a score of 0 for a dimension with no answers', () => {
    const scores = service.computeScores([]);
    expect(scores.REALISTIC).toBe(0);
    expect(scores.INVESTIGATIVE).toBe(0);
  });

  it('computes 100 when all answers for a dimension are the maximum Likert value (5)', () => {
    const scores = service.computeScores([
      { dimension: 'INVESTIGATIVE', likertValue: 5 },
      { dimension: 'INVESTIGATIVE', likertValue: 5 },
    ]);
    expect(scores.INVESTIGATIVE).toBe(100);
  });

  it('computes 0 when all answers for a dimension are the minimum Likert value (1)', () => {
    const scores = service.computeScores([
      { dimension: 'REALISTIC', likertValue: 1 },
      { dimension: 'REALISTIC', likertValue: 1 },
    ]);
    expect(scores.REALISTIC).toBe(0);
  });

  it('computes 50 for a mid-point average (Likert value of 3)', () => {
    const scores = service.computeScores([
      { dimension: 'ARTISTIC', likertValue: 3 },
      { dimension: 'ARTISTIC', likertValue: 3 },
    ]);
    expect(scores.ARTISTIC).toBe(50);
  });

  it('averages multiple different answers correctly for the same dimension', () => {
    // Likert values 2, 4 average to 3 -> scaled score of 50
    const scores = service.computeScores([
      { dimension: 'SOCIAL', likertValue: 2 },
      { dimension: 'SOCIAL', likertValue: 4 },
    ]);
    expect(scores.SOCIAL).toBe(50);
  });

  it('keeps each dimension independent of the others', () => {
    const scores = service.computeScores([
      { dimension: 'ENTERPRISING', likertValue: 5 },
      { dimension: 'CONVENTIONAL', likertValue: 1 },
    ]);
    expect(scores.ENTERPRISING).toBe(100);
    expect(scores.CONVENTIONAL).toBe(0);
  });

  it('returns the top N dimensions correctly, sorted highest first', () => {
    const scores = {
      REALISTIC: 40,
      INVESTIGATIVE: 90,
      ARTISTIC: 20,
      SOCIAL: 70,
      ENTERPRISING: 30,
      CONVENTIONAL: 60,
    };
    const top3 = service.getTopDimensions(scores, 3);
    expect(top3).toEqual(['INVESTIGATIVE', 'SOCIAL', 'CONVENTIONAL']);
  });
});
