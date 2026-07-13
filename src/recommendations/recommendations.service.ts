import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MatchingScoreService,
  RiasecVector,
} from './application/matching-score.service';
import { AiOrchestrationService } from './application/ai-orchestration.service';
import type { StudentProfile, StudentSkill, Skill } from '@prisma/client';

const TOP_N = 5;

type ProfileWithSkills = StudentProfile & {
  skills: (StudentSkill & { skill: Skill })[];
};

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingScoreService: MatchingScoreService,
    private readonly aiOrchestrationService: AiOrchestrationService,
  ) {}

  async generateRecommendationsForAssessment(
    assessmentId: string,
    studentId: string,
    studentProfile: ProfileWithSkills | null,
  ) {
    let t = Date.now();
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    this.logger.log(`[timing] re-fetch assessment: ${Date.now() - t}ms`);

    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found during scoring.`);
    }

    const studentSkillIds = new Set(
      (studentProfile?.skills ?? []).map((s) => s.skillId),
    );
    const studentSkillNames = (studentProfile?.skills ?? []).map(
      (s) => s.skill.name,
    );

    t = Date.now();
    const activeCareers = await this.prisma.career.findMany({
      where: { isActive: true },
      include: { requiredSkills: { include: { skill: true } } },
    });
    this.logger.log(
      `[timing] fetch active careers (${activeCareers.length}): ${Date.now() - t}ms`,
    );

    const studentRiasec = assessment.riasecScores as unknown as RiasecVector;

    const scored = activeCareers.map((career) => {
      const careerRiasec = career.riasecCode as unknown as RiasecVector;
      const careerSkillIds = career.requiredSkills.map((cs) => cs.skillId);

      const matchScore = this.matchingScoreService.computeMatchScore(
        studentRiasec,
        careerRiasec,
        studentSkillIds,
        careerSkillIds,
      );

      return { career, matchScore };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scored.slice(0, TOP_N);

    t = Date.now();
    const recommendations = await this.prisma.$transaction(
      topMatches.map(({ career, matchScore }) =>
        this.prisma.recommendation.create({
          data: {
            assessmentId,
            careerId: career.id,
            matchScore,
            status: 'PENDING',
          },
        }),
      ),
    );
    this.logger.log(
      `[timing] create ${recommendations.length} recommendation rows: ${Date.now() - t}ms`,
    );

    t = Date.now();
    const qualitativeAnswers = await this.prisma.assessmentAnswer.findMany({
      where: {
        assessmentId,
        textAnswer: { not: null },
      },
      select: { textAnswer: true },
    });
    this.logger.log(`[timing] fetch qualitative answers: ${Date.now() - t}ms`);

    const studentQualitativeAnswers = qualitativeAnswers
      .map((a) => a.textAnswer)
      .filter((a): a is string => !!a);

    void this.generateExplanationsInBackground(
      recommendations,
      topMatches,
      studentSkillNames,
      studentQualitativeAnswers,
      assessment.profileSnapshot as Record<string, unknown>,
    );

    return recommendations;
  }

  private async generateExplanationsInBackground(
    recommendations: { id: string; careerId: string }[],
    topMatches: {
      career: {
        id: string;
        title: string;
        description: string;
        requiredSkills: { skill: { name: string } }[];
      };
      matchScore: number;
    }[],
    studentSkillNames: string[],
    studentQualitativeAnswers: string[],
    profileSnapshot: Record<string, unknown>,
  ) {
    for (const recommendation of recommendations) {
      const match = topMatches.find(
        (m) => m.career.id === recommendation.careerId,
      );
      if (!match) continue;

      try {
        await this.aiOrchestrationService.generateExplanation(match.career.id, {
          recommendationId: recommendation.id,
          careerTitle: match.career.title,
          careerDescription: match.career.description,
          careerRequiredSkills: match.career.requiredSkills.map(
            (rs) => rs.skill.name,
          ),
          matchScore: match.matchScore,
          studentSkills: studentSkillNames,
          studentQualitativeAnswers,
          profileSnapshot,
        });
      } catch (error) {
        this.logger.error(
          `Unexpected error generating explanation for recommendation ${recommendation.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async getForAssessment(studentId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, studentId },
    });

    if (!assessment) {
      return [];
    }

    return this.prisma.recommendation.findMany({
      where: { assessmentId },
      include: {
        career: true,
        counselorReviews: true,
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  async askFollowUpQuestion(
    studentId: string,
    recommendationId: string,
    question: string,
  ) {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, assessment: { studentId } },
      include: { career: true },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found.');
    }

    if (
      recommendation.status !== 'COMPLETED' ||
      !recommendation.aiExplanation
    ) {
      throw new BadRequestException(
        'This recommendation is not ready to be discussed yet.',
      );
    }

    const answer = await this.aiOrchestrationService.answerFollowUp({
      recommendationId: recommendation.id,
      careerTitle: recommendation.career.title,
      careerDescription: recommendation.career.description,
      matchScore: recommendation.matchScore,
      existingExplanation: recommendation.aiExplanation,
      question,
    });

    return { answer };
  }
}
