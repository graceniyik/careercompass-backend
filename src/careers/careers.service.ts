import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';

@Injectable()
export class CareersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCareerDto) {
    return this.prisma.career.create({
      data: {
        title: dto.title,
        description: dto.description,
        riasecCode: dto.riasecCode as any,
        isActive: dto.isActive ?? true,
        requiredSkills: dto.requiredSkillIds
          ? {
              create: dto.requiredSkillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
        roadmapSteps: dto.roadmapSteps
          ? {
              create: dto.roadmapSteps.map((step) => ({
                order: step.order,
                title: step.title,
                description: step.description,
              })),
            }
          : undefined,
      },
      include: {
        requiredSkills: { include: { skill: true } },
        roadmapSteps: true,
      },
    });
  }

  async findAllActive() {
    return this.prisma.career.findMany({
      where: { isActive: true },
      include: {
        requiredSkills: { include: { skill: true } },
        roadmapSteps: { orderBy: { order: 'asc' } },
        certifications: true,
        degreePrograms: true,
      },
    });
  }

  async findAllForAdmin() {
    // Admins see inactive careers too (BR-3.4)
    return this.prisma.career.findMany({
      include: {
        requiredSkills: { include: { skill: true } },
        roadmapSteps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const career = await this.prisma.career.findUnique({
      where: { id },
      include: {
        requiredSkills: { include: { skill: true } },
        roadmapSteps: { orderBy: { order: 'asc' } },
        certifications: true,
        degreePrograms: true,
      },
    });

    if (!career) {
      throw new NotFoundException('Career not found.');
    }

    return career;
  }

  async update(id: string, dto: UpdateCareerDto) {
    const existing = await this.prisma.career.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Career not found.');
    }

    // If skills are being updated, replace the full set (same pattern as StudentProfile)
    if (dto.requiredSkillIds) {
      await this.prisma.careerSkill.deleteMany({ where: { careerId: id } });
      if (dto.requiredSkillIds.length > 0) {
        await this.prisma.careerSkill.createMany({
          data: dto.requiredSkillIds.map((skillId) => ({
            careerId: id,
            skillId,
          })),
        });
      }
    }

    return this.prisma.career.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        riasecCode: dto.riasecCode as any,
        isActive: dto.isActive,
      },
      include: {
        requiredSkills: { include: { skill: true } },
        roadmapSteps: true,
      },
    });
  }

  async deactivate(id: string) {
    const existing = await this.prisma.career.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Career not found.');
    }

    // Soft deactivation, never hard delete (BR-3.4)
    return this.prisma.career.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
