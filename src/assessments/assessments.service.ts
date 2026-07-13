import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RiasecScoringService,
  RiasecAnswerInput,
} from './application/riasec-scoring.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riasecScoringService: RiasecScoringService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  async getActiveQuestions() {
    return this.prisma.assessmentQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async submit(userId: string, dto: SubmitAssessmentDto) {
    const overallStart = Date.now();

    let t = Date.now();
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    this.logger.log(`[timing] fetch profile: ${Date.now() - t}ms`);

    if (!profile) {
      throw new NotFoundException('Student profile not found.');
    }

    t = Date.now();
    const activeQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { isActive: true },
    });
    this.logger.log(`[timing] fetch active questions: ${Date.now() - t}ms`);

    if (activeQuestions.length === 0) {
      throw new BadRequestException('No active assessment questions found.');
    }

    const questionMap = new Map(activeQuestions.map((q) => [q.id, q]));
    const answeredQuestionIds = new Set(dto.answers.map((a) => a.questionId));

    for (const question of activeQuestions) {
      if (!answeredQuestionIds.has(question.id)) {
        throw new BadRequestException(
          `Missing answer for required question: "${question.text}"`,
        );
      }
    }

    const riasecAnswerInputs: RiasecAnswerInput[] = [];

    for (const answer of dto.answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `Unknown or inactive question: ${answer.questionId}`,
        );
      }

      if (question.type === 'LIKERT') {
        if (answer.likertValue === undefined) {
          throw new BadRequestException(
            `Question "${question.text}" requires a Likert value (1-5).`,
          );
        }
        if (question.riasecDimension) {
          riasecAnswerInputs.push({
            dimension: question.riasecDimension,
            likertValue: answer.likertValue,
          });
        }
      }

      if (question.type === 'QUALITATIVE') {
        if (!answer.textAnswer) {
          throw new BadRequestException(
            `Question "${question.text}" requires a written answer (min 20 characters).`,
          );
        }
      }
    }

    const riasecScores =
      this.riasecScoringService.computeScores(riasecAnswerInputs);

    const profileSnapshot = {
      fullName: profile.fullName,
      institution: profile.institution,
      yearOfStudy: profile.yearOfStudy,
      fieldOfStudy: profile.fieldOfStudy,
      hobbies: profile.hobbies,
      careerGoals: profile.careerGoals,
      strengths: profile.strengths,
      skills: profile.skills.map((s) => s.skill.name),
    };

    t = Date.now();
    const assessment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assessment.create({
        data: {
          studentId: userId,
          profileSnapshot,
          riasecScores,
          answers: {
            create: dto.answers.map((a) => ({
              questionId: a.questionId,
              likertValue: a.likertValue,
              textAnswer: a.textAnswer,
            })),
          },
        },
        include: {
          answers: true,
        },
      });

      return created;
    });
    this.logger.log(
      `[timing] create assessment transaction: ${Date.now() - t}ms`,
    );

    // BR-2.3: recommendation generation is automatic on submission.
    // Pass the already-fetched profile through — avoids a redundant re-fetch inside recommendations.
    t = Date.now();
    await this.recommendationsService.generateRecommendationsForAssessment(
      assessment.id,
      userId,
      profile,
    );
    this.logger.log(
      `[timing] generateRecommendationsForAssessment (scoring only, AI runs in background): ${Date.now() - t}ms`,
    );

    this.logger.log(`[timing] TOTAL submit(): ${Date.now() - overallStart}ms`);

    return assessment;
  }

  async getHistory(userId: string) {
    return this.prisma.assessment.findMany({
      where: { studentId: userId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        submittedAt: true,
        riasecScores: true,
      },
    });
  }

  async getById(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, studentId: userId },
      include: {
        answers: {
          include: { question: true },
        },
        recommendations: {
          include: {
            career: {
              include: {
                requiredSkills: { include: { skill: true } },
              },
            },
          },
          orderBy: { matchScore: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found.');
    }

    return assessment;
  }
}
