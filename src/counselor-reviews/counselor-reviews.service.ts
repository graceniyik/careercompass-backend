import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class CounselorReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Counselors browse all students' assessments (BR-4.2: review is optional, so this is just a browse list)
  async getAllAssessments() {
    return this.prisma.assessment.findMany({
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        submittedAt: true,
        riasecScores: true,
        student: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async getAssessmentDetail(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        student: {
          select: { id: true, email: true, studentProfile: true },
        },
        recommendations: {
          include: {
            career: true,
            counselorReviews: {
              include: { counselor: { select: { id: true, email: true } } },
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

  async getStudentHistory(studentId: string) {
    return this.prisma.assessment.findMany({
      where: { studentId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        submittedAt: true,
        riasecScores: true,
      },
    });
  }

  async createReview(
    counselorId: string,
    recommendationId: string,
    dto: CreateReviewDto,
  ) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found.');
    }

    // BR-4.1: this creates a new, additive review — never modifies the AI recommendation itself
    return this.prisma.counselorReview.create({
      data: {
        recommendationId,
        counselorId,
        statusFlag: dto.statusFlag,
        comment: dto.comment,
      },
      include: {
        counselor: { select: { id: true, email: true } },
      },
    });
  }
}
