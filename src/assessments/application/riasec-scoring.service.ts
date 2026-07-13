import { Injectable } from '@nestjs/common';
import { RiasecDimension } from '@prisma/client';

export interface RiasecAnswerInput {
  dimension: RiasecDimension;
  likertValue: number; // 1-5
}

export type RiasecScores = Record<RiasecDimension, number>;

const ALL_DIMENSIONS: RiasecDimension[] = [
  'REALISTIC',
  'INVESTIGATIVE',
  'ARTISTIC',
  'SOCIAL',
  'ENTERPRISING',
  'CONVENTIONAL',
];

@Injectable()
export class RiasecScoringService {
  /**
   * Computes a 0-100 score per RIASEC dimension from raw Likert answers (1-5).
   * Deterministic — no AI involved (BR-2.1).
   */
  computeScores(answers: RiasecAnswerInput[]): RiasecScores {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const dimension of ALL_DIMENSIONS) {
      totals[dimension] = 0;
      counts[dimension] = 0;
    }

    for (const answer of answers) {
      totals[answer.dimension] += answer.likertValue;
      counts[answer.dimension] += 1;
    }

    const scores: Partial<RiasecScores> = {};

    for (const dimension of ALL_DIMENSIONS) {
      if (counts[dimension] === 0) {
        scores[dimension] = 0;
      } else {
        // Average Likert (1-5) scaled to a 0-100 range
        const average = totals[dimension] / counts[dimension];
        scores[dimension] = Math.round(((average - 1) / 4) * 100);
      }
    }

    return scores as RiasecScores;
  }

  /**
   * Returns the top N dimensions by score, e.g. for a Holland Code like "IAS".
   */
  getTopDimensions(scores: RiasecScores, topN = 3): RiasecDimension[] {
    return (Object.entries(scores) as [RiasecDimension, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([dimension]) => dimension);
  }
}
