import { MatchingScoreService } from './matching-score.service';
import { RiasecDimension } from '@prisma/client';

describe('MatchingScoreService', () => {
  let service: MatchingScoreService;

  const zeroVector: Record<RiasecDimension, number> = {
    REALISTIC: 0,
    INVESTIGATIVE: 0,
    ARTISTIC: 0,
    SOCIAL: 0,
    ENTERPRISING: 0,
    CONVENTIONAL: 0,
  };

  beforeEach(() => {
    service = new MatchingScoreService();
  });

  it('gives a perfect RIASEC + skill match a score of 100', () => {
    const vector = { ...zeroVector, INVESTIGATIVE: 100, REALISTIC: 80 };
    const score = service.computeMatchScore(
      vector,
      vector, // identical vectors -> cosine similarity of 1
      new Set(['skill-1', 'skill-2']),
      ['skill-1', 'skill-2'], // student has every required skill
    );
    expect(score).toBe(100);
  });

  it('gives a completely mismatched RIASEC profile with no matching skills a low score', () => {
    const studentVector = { ...zeroVector, REALISTIC: 100 };
    const careerVector = { ...zeroVector, ARTISTIC: 100 };

    const score = service.computeMatchScore(
      studentVector,
      careerVector,
      new Set(['unrelated-skill']),
      ['required-skill'],
    );
    expect(score).toBe(0);
  });

  it('treats a career with no required skills as a full skill match', () => {
    const vector = { ...zeroVector, SOCIAL: 100 };
    const score = service.computeMatchScore(
      vector,
      vector,
      new Set(), // student has no skills at all
      [], // career requires none
    );
    expect(score).toBe(100);
  });

  it('weights RIASEC overlap at 60% and skill overlap at 40%', () => {
    const studentVector = { ...zeroVector, INVESTIGATIVE: 100 };
    const careerVector = { ...zeroVector, INVESTIGATIVE: 100 }; // perfect RIASEC match

    // Student has 1 of 2 required skills -> 50% skill overlap
    const score = service.computeMatchScore(
      studentVector,
      careerVector,
      new Set(['skill-1']),
      ['skill-1', 'skill-2'],
    );

    // Expected: 0.6 * 100 + 0.4 * 50 = 80
    expect(score).toBe(80);
  });

  it('relies only on skill overlap when the student has an all-zero RIASEC profile', () => {
    const careerVector = { ...zeroVector, ARTISTIC: 100 };
    const score = service.computeMatchScore(
      zeroVector,
      careerVector,
      new Set(['skill-1']),
      ['skill-1'],
    );
    // RIASEC overlap is 0 (zero vector), skill overlap is 100% (student has the one required skill)
    // Expected: 0.6 * 0 + 0.4 * 100 = 40
    expect(score).toBe(40);
  });
});
