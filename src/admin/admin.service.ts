import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // --- User Management (FR-5.1) ---

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Soft deactivation — never delete (BR-5.1)
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async reactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  // --- Skill Management ---

  async listSkills() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  async createSkill(dto: CreateSkillDto) {
    return this.prisma.skill.upsert({
      where: { name: dto.name },
      update: {},
      create: { name: dto.name },
    });
  }

  async deactivateSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found.');
    }
    return this.prisma.skill.update({
      where: { id: skillId },
      data: { isActive: false },
    });
  }

  // --- Assessment Question Management (FR-2.7) ---

  async listQuestions() {
    return this.prisma.assessmentQuestion.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async createQuestion(dto: CreateQuestionDto) {
    return this.prisma.assessmentQuestion.create({
      data: {
        type: dto.type,
        text: dto.text,
        riasecDimension: dto.riasecDimension,
        order: dto.order,
      },
    });
  }

  async deactivateQuestion(questionId: string) {
    const question = await this.prisma.assessmentQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    return this.prisma.assessmentQuestion.update({
      where: { id: questionId },
      data: { isActive: false },
    });
  }

  // --- Analytics (FR-5.4) ---

  async getAnalytics() {
    const [totalStudents, totalAssessments, careerCounts, topBookmarks] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.assessment.count(),
        this.prisma.recommendation.groupBy({
          by: ['careerId'],
          _count: { careerId: true },
          orderBy: { _count: { careerId: 'desc' } },
          take: 5,
        }),
        this.prisma.bookmark.groupBy({
          by: ['careerId'],
          _count: { careerId: true },
          orderBy: { _count: { careerId: 'desc' } },
          take: 5,
        }),
      ]);

    // Resolve career titles for the grouped results
    const careerIds = [
      ...new Set([
        ...careerCounts.map((c) => c.careerId),
        ...topBookmarks.map((b) => b.careerId),
      ]),
    ];

    const careers = await this.prisma.career.findMany({
      where: { id: { in: careerIds } },
      select: { id: true, title: true },
    });
    const careerTitleMap = new Map(careers.map((c) => [c.id, c.title]));

    return {
      totalStudents,
      totalAssessments,
      mostRecommendedCareers: careerCounts.map((c) => ({
        careerId: c.careerId,
        title: careerTitleMap.get(c.careerId),
        count: c._count.careerId,
      })),
      mostBookmarkedCareers: topBookmarks.map((b) => ({
        careerId: b.careerId,
        title: careerTitleMap.get(b.careerId),
        count: b._count.careerId,
      })),
    };
  }
}
