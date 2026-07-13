import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found.');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Student profile not found.');
    }

    // Run the profile field update and skill replacement together
    const updatedProfile = await this.prisma.$transaction(async (tx) => {
      await tx.studentProfile.update({
        where: { userId },
        data: {
          fullName: dto.fullName,
          institution: dto.institution,
          yearOfStudy: dto.yearOfStudy,
          fieldOfStudy: dto.fieldOfStudy,
          hobbies: dto.hobbies,
          careerGoals: dto.careerGoals,
          strengths: dto.strengths,
        },
      });

      // If skillIds were provided, replace the student's entire skill list
      if (dto.skillIds) {
        await tx.studentSkill.deleteMany({
          where: { studentProfileId: existingProfile.id },
        });

        if (dto.skillIds.length > 0) {
          await tx.studentSkill.createMany({
            data: dto.skillIds.map((skillId) => ({
              studentProfileId: existingProfile.id,
              skillId,
            })),
          });
        }
      }

      return tx.studentProfile.findUnique({
        where: { userId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    return updatedProfile;
  }
}
