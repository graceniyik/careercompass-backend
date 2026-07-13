import { Injectable } from '@nestjs/common';
import { RiasecDimension } from '@prisma/client';

export type RiasecVector = Record<RiasecDimension, number>;

const ALL_DIMENSIONS: RiasecDimension[] = [
  'REALISTIC',
  'INVESTIGATIVE',
  'ARTISTIC',
  'SOCIAL',
  'ENTERPRISING',
  'CONVENTIONAL',
];

@Injectable()
export class MatchingScoreService {
  /**
   * Cosine similarity between two RIASEC vectors, scaled to 0-100.
   */
  private riasecOverlap(
    studentVector: RiasecVector,
    careerVector: RiasecVector,
  ): number {
    let dot = 0;
    let studentMagnitude = 0;
    let careerMagnitude = 0;

    for (const dim of ALL_DIMENSIONS) {
      const s = studentVector[dim] ?? 0;
      const c = careerVector[dim] ?? 0;
      dot += s * c;
      studentMagnitude += s * s;
      careerMagnitude += c * c;
    }

    if (studentMagnitude === 0 || careerMagnitude === 0) {
      return 0;
    }

    const cosineSimilarity =
      dot / (Math.sqrt(studentMagnitude) * Math.sqrt(careerMagnitude));
    return Math.round(cosineSimilarity * 100);
  }

  /**
   * Proportion of a career's required skills the student possesses, scaled to 0-100.
   * A career with no required skills is treated as a full match on this dimension.
   */
  private skillOverlap(
    studentSkillIds: Set<string>,
    careerSkillIds: string[],
  ): number {
    if (careerSkillIds.length === 0) {
      return 100;
    }

    const matched = careerSkillIds.filter((id) =>
      studentSkillIds.has(id),
    ).length;
    return Math.round((matched / careerSkillIds.length) * 100);
  }

  /**
   * Match Score = 0.6 * RIASEC overlap + 0.4 * skill overlap (BR-3.5)
   */
  computeMatchScore(
    studentRiasec: RiasecVector,
    careerRiasec: RiasecVector,
    studentSkillIds: Set<string>,
    careerSkillIds: string[],
  ): number {
    const riasec = this.riasecOverlap(studentRiasec, careerRiasec);
    const skill = this.skillOverlap(studentSkillIds, careerSkillIds);
    const score = 0.6 * riasec + 0.4 * skill;
    return Math.round(score * 100) / 100;
  }
}
